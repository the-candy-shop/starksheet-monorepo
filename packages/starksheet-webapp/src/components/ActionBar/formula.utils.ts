import BN from "bn.js";
import { AbiEntry, FunctionAbi, StructAbi } from "starknet";
import { getSelectorFromName } from "starknet/dist/utils/hash";
import { uint256ToBN } from "starknet/dist/utils/uint256";
import { BigNumberish, toBN } from "starknet/utils/number";
import { Cell, CellData, ContractAbi } from "../../types";
import { RC_BOUND } from "../../utils/constants";
import { bn2hex } from "../../utils/hexUtils";

export const CONTRACT_FUNCTION_SEP = ".";
export const ARGS_SEP = ";";
export const ARG_LIST_SEP = ",";

export const contractCallRegex =
  /(?<contractAddress>(0x)?[a-z0-9]+)\.(?<selector>[a-z_0-9]+)\((?<args>[a-z0-9[\],; ]*)\)/i;
export const cellNameRegex = /^[a-z]\d+$/i;
export const hexStringRegex = /^(0x)?[a-f0-9]+$/i;

export function toPlainTextFormula(
  cellData: CellData,
  cellNames: string[]
): string {
  if (!cellData) return "0";

  const { contractAddress, selector, calldata, abi } = cellData;
  if (contractAddress.eq(RC_BOUND)) {
    return selector.gte(RC_BOUND) ? bn2hex(selector) : selector.toString();
  }

  const contractName = contractAddress.lt(RC_BOUND)
    ? cellNames[contractAddress.toNumber()]
    : bn2hex(contractAddress);
  const selectorHexString = bn2hex(selector);
  const operator = abi?.name || selectorHexString;

  const args = calldata.map((arg) =>
    isDependency(arg)
      ? cellNames[arg.sub(toBN(1)).div(toBN(2)).toNumber()]
      : arg.gte(RC_BOUND)
      ? "0x" + arg.div(toBN(2)).toString(16)
      : arg.div(toBN(2)).toString()
  );

  let displayedArgs = [];
  if (!!abi) {
    let argsIndex = 0;
    let inputIndex = 0;
    while (inputIndex < abi.inputs.length) {
      const _input = abi.inputs[inputIndex];
      if (_input.type === "Uint256") {
        if (isDependency(calldata[argsIndex])) {
          displayedArgs.push(args[argsIndex]);
          if (args[argsIndex + 1] !== "0")
            throw new Error("Cannot parse Uint256 input");
        } else {
          displayedArgs.push(
            uint256ToBN({
              low: args[argsIndex],
              high: args[argsIndex + 1],
            }).toString()
          );
        }
        argsIndex += 2;
        inputIndex++;
        continue;
      }
      if (_input.name.endsWith("_len")) {
        const len = parseInt(args[argsIndex]);

        displayedArgs.push(
          "[" +
            args.slice(argsIndex + 1, argsIndex + 1 + len).join(ARG_LIST_SEP) +
            "]"
        );
        argsIndex += len + 1; // arg_len, arg and len
        inputIndex += 2; // skip next arg
        continue;
      }
      displayedArgs.push(args[argsIndex]);
      argsIndex++;
      inputIndex++;
    }
  } else {
    displayedArgs = args;
  }

  return `${contractName}${CONTRACT_FUNCTION_SEP}${operator}(${displayedArgs.join(
    ARGS_SEP
  )})`;
}

export function parseContractCall(
  formula: string
): { contractAddress: string; selector: string; args: string } | null {
  const _formula = formula
    .trim()
    .replaceAll("\n", "")
    .replaceAll("\r", "")
    .replaceAll("&nbsp;", "")
    .replaceAll(" ", "");

  const formulaMatch = _formula.match(contractCallRegex);

  if (!formulaMatch?.groups) {
    return null;
  }

  const contractAddress = formulaMatch.groups.contractAddress.match(
    cellNameRegex
  )
    ? cellNameToTokenId(formulaMatch.groups.contractAddress).toString()
    : formulaMatch.groups.contractAddress;

  if (!contractAddress.match(hexStringRegex)) {
    return null;
  }

  return {
    contractAddress,
    selector: formulaMatch.groups.selector,
    args: formulaMatch.groups.args,
  };
}

export function parse(
  rawCall: {
    contractAddress: string;
    selector: string;
    args: string;
  },
  abi: ContractAbi
): CellData | null {
  const args = rawCall.args
    .toLowerCase()
    .split(ARGS_SEP)
    .filter((arg) => arg !== "");

  const selector = getSelectorFromName(rawCall.selector);
  const selectorAbi = abi[selector] as FunctionAbi;

  if (selectorAbi.type !== "function") return null;
  const inputs = selectorAbi.inputs.filter((i) => !i.name.endsWith("_len"));

  if (args.length !== inputs.length) {
    return null;
  }

  const calldata = args
    .map((arg, index) => parseArg(arg, inputs[index], abi))
    .flat()
    .filter((arg) => arg !== undefined) as BN[];

  return {
    contractAddress: toBN(rawCall.contractAddress),
    selector: toBN(selector),
    calldata,
    abi: selectorAbi,
  };
}

export const cellNameToTokenId = (arg: string) => {
  const col = arg.toLowerCase().charCodeAt(0) - "a".charCodeAt(0);
  const row = parseInt(arg.slice(1)) - 1;
  return col + row * 15;
};

export const encodeConst = (_arg: BigNumberish): BN => toBN(_arg).mul(toBN(2));
export const encodeTokenId = (_arg: BigNumberish): BN =>
  toBN(_arg).mul(toBN(2)).add(toBN(1));
export const decode = (_arg: BN) =>
  isDependency(_arg) ? _arg.sub(toBN(1)).div(toBN(2)) : _arg.div(toBN(2));

const parseArg = (
  arg: string,
  inputAbi: AbiEntry,
  contractAbi: ContractAbi
): BN[] | undefined => {
  let len;
  let _args;

  if (arg.startsWith("[")) {
    if (!arg.endsWith("]")) return undefined;
    if (!inputAbi.type.endsWith("*")) return undefined;

    _args = arg.replace("[", "").replace("]", "").split(ARG_LIST_SEP);
    len = _args.length;
  } else {
    _args = [arg];
  }
  const type = inputAbi.type.replace("*", "");

  const typeAbi = contractAbi[getSelectorFromName(type)] as StructAbi;

  const size = typeAbi?.size || 1;

  const parsedArg = _args
    .map((_arg) =>
      _arg.match(cellNameRegex)
        ? encodeTokenId(cellNameToTokenId(_arg))
        : encodeConst(_arg)
    )
    .filter((_arg) => _arg !== undefined)
    .map((_arg) => {
      // TODO: this is a hard-fix to work only with Uint256 when arg < RC_BOUND
      const arr = Array(size).fill(toBN(0));

      arr[0] = _arg;
      return arr;
    })
    .flat();

  return len ? [encodeConst(len), ...parsedArg] : parsedArg;
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
      .filter((arg) =>
        arg.replace("[", "").replace("]", "").match(cellNameRegex)
      )
      .forEach((name) => {
        result = result.replace(name, `<span class="cell">${name}</span>`);
      });
  }

  return result;
}
