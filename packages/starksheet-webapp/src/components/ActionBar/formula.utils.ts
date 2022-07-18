import { BigNumberish, toBN } from "starknet/utils/number";

const validFormulaRegex =
  /^(SUM|MINUS|DIVIDE|MULTIPLY)\((([A-Z]+\d+);)+([A-Z]+\d+)\)$/;

export const operationNumbers = {
  SUM: toBN(
    "1745323118234039575158332314383998379920114756853600128775583542343013246395"
  ),
  MINUS: toBN(
    "958766071209442778479085403119201594057288230757243102466650545030408647035"
  ),
  DIVIDE: toBN(
    "108192450202678444723308767730487539068408323925754456806249919587336532304"
  ),
  MULTIPLY: toBN(
    "390954762583876961124108005862584803545498882125673813294165296772873328665"
  ),
};

export type CellValue = {
  type: "number" | "formula";
  operation?: "SUM" | "MINUS" | "DIVIDE" | "MULTIPLY";
  dependencies?: string[];
  value?: number;
};

export function toPlainTextFormula(
  {
    value,
    dependencies,
  }: {
    value: BigNumberish;
    dependencies?: BigNumberish[];
  },
  cellNames: string[]
): string {
  if (!dependencies || dependencies.length === 0) {
    return value.toString();
  }

  const operator = Object.keys(operationNumbers).find(
    // @ts-ignore
    (key) => operationNumbers[key].toString() === value.toString()
  );

  if (!operator) {
    return "";
  }

  return `${operator}(${dependencies.map((dep) => cellNames[dep]).join(";")})`;
}

export function parse(cellName: string, formula: string): CellValue | null {
  const parsedNumber = parseNumberValue(formula);
  if (parsedNumber) {
    return parsedNumber;
  }

  const parsedFormula = parseFormulaValue(cellName, formula);
  if (parsedFormula && !parsedFormula.dependencies?.includes(cellName)) {
    return parsedFormula;
  }

  return null;
}

export function getError(cellName: string, formula: string): string | null {
  const parsedNumber = parseNumberValue(formula);
  if (parsedNumber) {
    return null;
  }

  const parsedFormula = parseFormulaValue(cellName, formula);
  if (parsedFormula) {
    if (parsedFormula.dependencies?.includes(cellName)) {
      return "You cannot reference a cell inside itself";
    }

    return null;
  }

  return "Invalid formula format";
}

export function parseNumberValue(formula: string): CellValue | null {
  const match = formula.match(/^\d+$/);

  if (!match) return null;

  return {
    type: "number",
    value: parseInt(formula),
  };
}

export function parseFormulaValue(
  cellName: string,
  formula: string
): CellValue | null {
  const match = formula.match(validFormulaRegex);

  if (!match) return null;

  const operation = match[1] as "SUM" | "MINUS" | "DIVIDE" | "MULTIPLY";
  const dependencies = formula
    .replace(operation, "")
    .replace("(", "")
    .replace(")", "")
    .split(";");

  return {
    type: "formula",
    operation,
    dependencies,
  };
}

export function buildFormulaDisplay(formula: string): string {
  const operator = formula.match(/(SUM|MINUS|DIVIDE|MULTIPLY)/);
  const cellNames = formula.match(/[A-Z]+\d+/g);

  let result = formula;

  if (operator) {
    result = result.replace(
      operator[0],
      `<span class="operator">${operator[0]}</span>`
    );
  }

  if (cellNames) {
    cellNames.forEach((name) => {
      result = result.replace(name, `<span class="cell">${name}</span>`);
    });
  }

  return result;
}
