import BN from "bn.js";
import { BigNumber, ethers } from "ethers";
import { FunctionAbi, number, uint256 } from "starknet";
import { N_COL } from "../../config";
import { Cell, CellData, ChainType, ContractAbi } from "../../types";
import {
  ARGS_SEP,
  ARG_LIST_SEP,
  CONTRACT_FUNCTION_SEP,
  RC_BOUND,
} from "../../utils/constants";
import { bn2hex, bn2uint, hex2str, str2hex } from "../../utils/hexUtils";

export const contractCallRegex =
  /(?<contractAddress>(0x)?[a-z0-9]+)\.(?<selector>[a-z_0-9]+)\((?<args>[a-z0-9[\]{},;: ]*)\)/i;
export const cellNameRegex = /^[a-z]\d+$/i;
export const hexStringRegex = /^(0x)?[a-f0-9]+$/i;

const isBigNumber = (arg: any): boolean => {
  return arg instanceof BigNumber || arg instanceof BN;
};

export function toPlainTextFormula(
  cellData: CellData,
  chainType: ChainType
): string {
  if (!cellData) return "0";

  const { contractAddress, selector, calldata, abi } = cellData;
  if (contractAddress.eq(RC_BOUND)) {
    return selector.gte(RC_BOUND) ? bn2hex(selector) : selector.toString();
  }

  const contractName = contractAddress.lt(RC_BOUND)
    ? tokenIdToCellName(contractAddress.toNumber())
    : bn2hex(contractAddress);
  const selectorHexString = bn2hex(selector);
  const operator = abi?.name || selectorHexString;

  const args = calldata.map((arg) =>
    isDependency(arg)
      ? tokenIdToCellName(
          arg.sub(number.toBN(1)).div(number.toBN(2)).toNumber()
        )
      : arg.gte(RC_BOUND)
      ? "0x" + arg.div(number.toBN(2)).toString(16)
      : arg.div(number.toBN(2)).toString()
  );
  let displayedArgs = [];
  if (!!abi) {
    if (chainType === ChainType.STARKNET) {
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
              uint256
                .uint256ToBN({
                  low: args[argsIndex],
                  high: args[argsIndex + 1],
                })
                .toString()
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
              args
                .slice(argsIndex + 1, argsIndex + 1 + len)
                .join(ARG_LIST_SEP) +
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
    } else if (chainType === ChainType.EVM) {
      const data =
        "0x" +
        calldata
          .map((arg) =>
            isDependency(arg)
              ? arg.sub(number.toBN(1)).div(number.toBN(2))
              : arg.div(number.toBN(2))
          )
          .map(bn2uint(32))
          .join("");
      const decodedData = ethers.utils.defaultAbiCoder.decode(
        abi.inputs.map((i) => i.type),
        data
      );
      // @ts-ignore
      displayedArgs = [customStringify(decodedData).slice(1, -1)];
    } else {
      throw new Error(
        `ChainType ${chainType} has no cellData to string encoding function`
      );
    }
  } else {
    displayedArgs = args;
  }

  return `${contractName}${CONTRACT_FUNCTION_SEP}${operator}(${displayedArgs.join(
    ARGS_SEP
  )})`;
}

function customStringify(input: any): any {
  if (Array.isArray(input)) {
    return "[" + input.map(customStringify).join(", ") + "]";
  } else if (typeof input === "object" && !isBigNumber(input)) {
    return (
      "{" +
      Object.entries(input)
        .map(([key, value]) => `${key}: ${customStringify(value)}`)
        .join(", ") +
      "}"
    );
  } else if (isBigNumber(input)) {
    return input.toString();
  } else return `${input}`;
}

export function parseContractCall(
  formula: string
): { contractAddress: string; selector: string; args: string } | null {
  const _formula = formula
    .trim()
    .replaceAll("\n", "")
    .replaceAll("\r", "")
    .replaceAll("&nbsp;", "");

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
  abi: ContractAbi,
  chainType: ChainType
): CellData | null {
  // eval is safe client side with user input only
  // see https://stackoverflow.com/questions/197769/when-is-javascripts-eval-not-evil
  // eslint-disable-next-line no-eval
  const args = eval(
    // Add global brackets if user input is just a comma separated list
    `[${rawCall.args}]`
      // Quote cell names before eval
      .replace(/([A-O][0-9]+)/gi, '"$1"')
  ) as any[];

  // retrieve function and corresponding abi
  const filteredAbi = Object.entries(abi).filter(
    ([selector, _abi]) =>
      _abi.name === rawCall.selector &&
      // @ts-ignore
      (_abi as FunctionAbi).type === "function" &&
      args.length ===
        (_abi as FunctionAbi).inputs.filter((i) => !i.name.endsWith("_len"))
          .length
  );

  if (filteredAbi.length !== 1) {
    return null;
  }

  const selector = filteredAbi[0][0];
  const selectorAbi = filteredAbi[0][1] as FunctionAbi;

  let calldata;
  if (chainType === ChainType.STARKNET) {
    const encodedArgs = encodeInputs(args) as any[];
    // Flatten the object prefixing arrays with their len
    // Result dismisses the first value, with is the len of the initial array of args
    calldata = flattenWithLen(encodedArgs).slice(1) as BN[];
  } else if (chainType === ChainType.EVM) {
    // TODO: need to support cell references
    calldata = (ethers.utils.defaultAbiCoder
      .encode(
        selectorAbi.inputs.map((i) => i.type),
        args
      )
      .slice(2)
      .match(/.{1,64}/g)
      ?.map((bytes32) => encodeConst("0x" + bytes32)) || []) as BN[];
  } else {
    throw new Error(`No parsing function for chainType ${chainType}`);
  }

  return {
    contractAddress: number.toBN(rawCall.contractAddress),
    selector: number.toBN(selector),
    calldata,
    abi: selectorAbi,
  };
}

export const cellNameToTokenId = (arg: string) => {
  const col = arg.toLowerCase().charCodeAt(0) - "a".charCodeAt(0);
  const row = parseInt(arg.slice(1)) - 1;
  return col + row * 15;
};

export const tokenIdToCellName = (id: number) => {
  const col = ((id % N_COL) + 1 + 9).toString(36).toUpperCase();
  const row = Math.floor(id / N_COL) + 1;
  return `${col}${row}`;
};

export const encodeConst = (_arg: number.BigNumberish): BN => {
  try {
    return number.toBN(_arg).mul(number.toBN(2));
  } catch (e) {
    return number.toBN(str2hex(_arg.toString(16))).mul(number.toBN(2));
  }
};

export const encodeTokenId = (_arg: number.BigNumberish): BN =>
  number.toBN(_arg).mul(number.toBN(2)).add(number.toBN(1));

export const decode = (_arg: BN) =>
  isDependency(_arg)
    ? _arg.sub(number.toBN(1)).div(number.toBN(2))
    : _arg.div(number.toBN(2));

/**
 *
 * @param input the user input object
 * @returns an object with the same structure but with inputs encoded (cell references, numbers, strings)
 *
 */
function encodeInputs(input: any): any {
  if (typeof input === "object") {
    if (Array.isArray(input)) {
      return input.map(encodeInputs);
    } else {
      return Object.entries(input).reduce(
        (prev, cur) => ({ ...prev, [cur[0]]: encodeInputs(cur[1]) }),
        {}
      );
    }
  } else if (typeof input === "string") {
    return input.replaceAll('"', "").match(cellNameRegex)
      ? encodeTokenId(cellNameToTokenId(input))
      : encodeConst(input);
  } else if (typeof input === "number") {
    return encodeConst(input);
  }
}

/**
 * Flatten an nested object or array of object, appending the encoded length of the array
 * before each array
 *
 * @param input
 * @returns
 */
function flattenWithLen(input: any): any[] {
  if (Array.isArray(input)) {
    return [
      encodeConst(input.length),
      ...input.map(flattenWithLen).reduce((prev, cur) => [...prev, ...cur], []),
    ];
  } else if (typeof input === "object" && !isBigNumber(input)) {
    return Object.values(input)
      .map(flattenWithLen)
      .reduce((prev, cur) => [...prev, ...cur], []);
  } else {
    return [input];
  }
}

export const isDependency = (arg: BN): boolean =>
  arg.mod(number.toBN(2)).toNumber() !== 0;

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

export function buildFormulaDisplay(
  formula: string,
  settings?: { text: boolean }
): string {
  const operator = formula.match(contractCallRegex);

  let result = formula;

  if (settings?.text) {
    try {
      return hex2str(bn2hex(number.toBN(formula)));
    } catch (e) {
      return formula;
    }
  }
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
