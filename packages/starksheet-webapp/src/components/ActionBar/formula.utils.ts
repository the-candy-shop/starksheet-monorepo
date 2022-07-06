export const SupportedOperationSymbols = ["+", "-", "/", "x"];

export type FormulaComponent = {
  value: string;
  type: "number" | "operator" | "cell" | "unknown";
};

export function parseFormula(
  cellName: string,
  formula: string
): FormulaComponent[] {
  const result: FormulaComponent[] = [];
  let currentSubString = "";

  for (let i = 0; i < formula.length; i++) {
    if (SupportedOperationSymbols.includes(formula.charAt(i))) {
      if (currentSubString !== "") {
        result.push({
          value: currentSubString,
          type: getFormulaComponentType(cellName, currentSubString),
        });
      }

      result.push({
        value: formula.charAt(i),
        type: "operator",
      });

      currentSubString = "";
    } else if (i === formula.length - 1) {
      currentSubString += formula.charAt(i);
      result.push({
        value: currentSubString,
        type: getFormulaComponentType(cellName, currentSubString),
      });
    } else {
      currentSubString += formula.charAt(i);
    }
  }

  return result;
}

export function buildFormulaDisplay(cellName: string, formula: string): string {
  const elements: string[] = [];
  const components = parseFormula(cellName, formula);

  components.forEach((el) =>
    elements.push(`<span class="${el.type}">${el.value}</span>`)
  );

  return elements.join("");
}

function getFormulaComponentType(
  cellName: string,
  component: string
): FormulaComponent["type"] {
  if (!!component.match(/^\d+$/)) {
    return "number";
  } else if (!!component.match(/^[A-Z]+\d+$/)) {
    return component === cellName ? "unknown" : "cell";
  } else {
    return "unknown";
  }
}
