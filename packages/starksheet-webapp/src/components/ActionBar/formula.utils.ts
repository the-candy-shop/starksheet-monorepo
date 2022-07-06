export const SupportedOperationSymbols = ["+", "-", "/", "x"];

export type FormulaComponent = {
  value: string;
  type: "number" | "operator" | "cell" | "unknown";
};

export function parseFormula(formula: string): FormulaComponent[] {
  const result: FormulaComponent[] = [];
  let currentSubString = "";

  for (let i = 0; i < formula.length; i++) {
    if (SupportedOperationSymbols.includes(formula.charAt(i))) {
      if (currentSubString !== "") {
        result.push({
          value: currentSubString,
          type: getFormulaComponentType(currentSubString),
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
        type: getFormulaComponentType(currentSubString),
      });
    } else {
      currentSubString += formula.charAt(i);
    }
  }

  return result;
}

export function buildFormulaDisplay(formula: string): string {
  const elements: string[] = [];
  const components = parseFormula(formula);

  components.forEach((el) =>
    elements.push(`<span class="${el.type}">${el.value}</span>`)
  );

  return elements.join("");
}

function getFormulaComponentType(component: string): FormulaComponent["type"] {
  if (!!component.match(/^[1-9]+$/)) {
    return "number";
  } else if (!!component.match(/^[A-Z]+[1-9]+$/)) {
    return "cell";
  } else {
    return "unknown";
  }
}
