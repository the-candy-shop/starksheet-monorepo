import { parseFormula } from "../ActionBar/formula.utils";
import { Parser } from "expr-eval";

export function computeCellValue(
  cellName: string,
  values: Record<string, string>
): string {
  const formula = values[cellName];

  if (!formula) {
    return "0";
  }

  const formulaComponents = parseFormula(cellName, formula);

  let expression = "";
  for (let i = 0; i < formulaComponents.length; i++) {
    if (formulaComponents[i].type === "unknown") {
      return "#ERROR";
    } else if (
      formulaComponents[i].type === "operator" ||
      formulaComponents[i].type === "number"
    ) {
      expression += formulaComponents[i].value;
    } else {
      expression += computeCellValue(formulaComponents[i].value, values);
    }
  }

  return Parser.evaluate(expression).toString();
}
