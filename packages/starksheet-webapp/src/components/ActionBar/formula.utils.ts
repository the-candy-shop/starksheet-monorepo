import BN from "bn.js";
import { getSelectorFromName } from "starknet/dist/utils/hash";
import { toBN } from "starknet/utils/number";
import { Cell, CellData } from "../../types";
import { RC_BOUND } from "../../utils/constants";
import { bn2hex } from "../../utils/hexUtils";

const contractCallRegex =
  /(?<contractAddress>(0x)?[a-z0-9]+)\.(?<selector>[a-z_0-9]+)\((?<args>[a-z0-9; ]*)\)/i;
export const cellNameRegex = /^[a-z]\d+$/i;
const hexStringRegex = /^(0x)?[a-f0-9]+$/i;

export function toPlainTextFormula(
  { contractAddress, selector, calldata, abi }: CellData,
  cellNames: string[]
): string {
  if (contractAddress.toString() === RC_BOUND.toString()) {
    return selector.gte(RC_BOUND) ? bn2hex(selector) : selector.toString();
  }

  const contractName = contractAddress.lte(RC_BOUND)
    ? cellNames[contractAddress.toNumber()]
    : bn2hex(contractAddress);
  const selectorHexString = bn2hex(selector);
  const operator = abi?.name || selectorHexString;

  const args = abi?.inputs[0]?.name?.endsWith("_len")
    ? calldata.slice(1)
    : calldata;

  return `${contractName}.${operator}(${args
    .map((arg) =>
      arg.mod(toBN(2)).toNumber() === 0
        ? arg.gte(RC_BOUND)
          ? "0x" + arg.div(toBN(2)).toString(16)
          : arg.div(toBN(2))
        : cellNames[arg.sub(toBN(1)).div(toBN(2)).toNumber()]
    )
    .join(";")})`;
}

export function parse(formula: string): CellData | null {
  const formulaMatch = formula.match(contractCallRegex);
  if (!formulaMatch?.groups) {
    if (!formula.match(hexStringRegex)) {
      return null;
    }
    try {
      return {
        contractAddress: RC_BOUND,
        selector: toBN(formula),
        calldata: [],
      };
    } catch (e) {
      return {
        contractAddress: RC_BOUND,
        selector: toBN(0),
        calldata: [],
      };
    }
  }
  if (!formulaMatch.groups.contractAddress.match(hexStringRegex)) {
    return null;
  }
  const args = formulaMatch.groups.args
    .toLowerCase()
    .split(";")
    .filter((arg) => arg !== "")
    .map(parseArg)
    .filter((arg) => arg !== undefined) as BN[];

  const contractAddress = formulaMatch.groups.contractAddress.match(
    cellNameRegex
  )
    ? cellNameToTokenId(formulaMatch.groups.contractAddress)
    : formulaMatch.groups.contractAddress;

  return {
    contractAddress: toBN(contractAddress),
    selector: toBN(getSelectorFromName(formulaMatch.groups.selector)),
    calldata: args,
  };
}

export const cellNameToTokenId = (arg: string) => {
  const col = arg.toLowerCase().charCodeAt(0) - "a".charCodeAt(0);
  const row = parseInt(arg.slice(1)) - 1;
  return col + row * 15;
};

const parseArg = (arg: string): BN | undefined => {
  if (arg.match(/^[a-z]\d+$/i)) {
    const tokenId = cellNameToTokenId(arg);
    return toBN(2 * tokenId + 1);
  }
  try {
    return toBN(arg).mul(toBN(2));
  } catch (e) {
    return undefined;
  }
};

export const isDependency = (arg: BN): boolean =>
  arg.mod(toBN(2)).toNumber() !== 0;

export function getDependencies(calldata: BN[]): number[] {
  return calldata.filter(isDependency).map((data) => (data.toNumber() - 1) / 2);
}

export const getAllDependencies =
  (cells: Cell[], _dependencies: number[]) => (tokenId: number) => {
    const deps = getDependencies(cells[tokenId].calldata);
    deps.forEach((d) => _dependencies.push(d));
    if (deps.includes(tokenId)) {
      // We break here because it's enough to conclude about a circular dep
      return;
    }
    deps.map(getAllDependencies(cells, _dependencies));
  };

export function getError(
  cellId: number,
  cellData: CellData | null,
  newDependencies: number[]
): string | null {
  if (cellData) {
    if (newDependencies.includes(cellId)) {
      return `Invalid formula: circular dependency`;
    }
    return null;
  }

  return "Invalid formula format";
}

export function buildFormulaDisplay(formula: string): string {
  const operator = formula.match(contractCallRegex);

  let result = formula;

  if (operator?.groups) {
    result = result.replace(
      operator.groups.contractAddress,
      `<span class="operator">${operator.groups.contractAddress}</span>`
    );
    result = result.replace(
      operator.groups.selector,
      `<span class="operator">${operator.groups.selector}</span>`
    );

    operator.groups.args
      .split(";")
      .filter((arg) => arg.match(cellNameRegex))
      .forEach((name) => {
        result = result.replace(name, `<span class="cell">${name}</span>`);
      });
  }

  return result;
}
