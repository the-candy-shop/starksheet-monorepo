import BN from "bn.js";
import { constants } from "starknet";
import { getSelectorFromName } from "starknet/dist/utils/hash";
import { BigNumberish, toBN } from "starknet/utils/number";
import { ContractAbi } from "../../utils/abiUtils";

export const RC_BOUND = toBN(2).pow(toBN(128));

const contractCallRegex =
  /(?<contractAddress>0x[a-f0-9]+)\.(?<selector>[a-z_0-9]+)\((?<args>[a-z0-9; ]*)\)/i;

export type CellData = {
  contractAddress: BigNumberish;
  value: BigNumberish;
  calldata: BN[];
};

export function toPlainTextFormula(
  { contractAddress, abi, value, calldata }: CellData & { abi: ContractAbi },
  cellNames: string[]
): string {
  const selector = "0x" + value.toString(16);
  if (!abi[selector]) {
    return value.toString();
  }

  const operator = abi[selector].name;

  return `0x${
    contractAddress.toString(16)
    // .replace(/(.{4})..+(.{4})/, "$1...$2")
  }.${operator}(${calldata
    .slice(1)
    .map((data) =>
      data.toNumber() % 2 === 0
        ? data.div(toBN(2))
        : cellNames[data.sub(toBN(1)).div(toBN(2)).toNumber()]
    )
    .join(";")})`;
}

export function parse(formula: string): CellData | null {
  const formulaMatch = formula.match(contractCallRegex);
  if (!formulaMatch?.groups) {
    if (!formula.match(/^(0x)?[a-f0-9]+$/i)) {
      return null;
    }
    return {
      contractAddress: RC_BOUND,
      value: toBN(formula),
      calldata: [],
    };
  }
  const args = formulaMatch.groups.args
    .toLowerCase()
    .split(";")
    .filter((arg) => !!arg)
    .map(parseArg)
    .map(toBN);

  return {
    contractAddress: toBN(formulaMatch.groups.contractAddress),
    value: getSelectorFromName(formulaMatch.groups.selector),
    calldata: args,
  };
}

const parseArg = (cellName: string) => {
  if (cellName.match(/^[a-z]\d+$/i)) {
    const col = cellName.charCodeAt(0) - "a".charCodeAt(0);
    const row = parseInt(cellName.slice(1)) - 1;
    const tokenId = col + row * 15;
    return 2 * tokenId + 1;
  }
  return 2 * parseInt(cellName);
};

export const isDependency = (arg: BN): boolean => arg.toNumber() % 2 !== 0;

export function getDependencies(calldata: BN[]): number[] {
  return calldata.filter(isDependency).map((data) => (data.toNumber() - 1) / 2);
}

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
  const cellNames = formula.match(/[A-Z]+\d+/g);

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
  }

  if (cellNames) {
    cellNames.forEach((name) => {
      result = result.replace(name, `<span class="cell">${name}</span>`);
    });
  }

  return result;
}

export function getValue(value: BN): BN {
  return value
    .add(toBN(constants.FIELD_PRIME).div(toBN(2)).abs())
    .mod(toBN(constants.FIELD_PRIME))
    .sub(toBN(constants.FIELD_PRIME).div(toBN(2)).abs());
}
