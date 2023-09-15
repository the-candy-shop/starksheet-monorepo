import { BigNumber, ethers } from "ethers";
import { FunctionAbi } from "starknet";
import { CellData, ChainType, ContractAbi } from "../../types";
import {
  ARGS_SEP,
  ARG_LIST_SEP,
  CELL_NAME_REGEX,
  CONTRACT_CALL_REGEX,
  CONTRACT_FUNCTION_SEP,
  HEX_STRING_REGEX,
  RC_BOUND,
} from "../../utils/constants";
import { bigint2hex, bigint2uint, hex2str } from "../../utils/hexUtils";
import {
  cellNameToTokenId,
  encodeConst,
  encodeTokenId,
  isDependency,
  tokenIdToCellName,
} from "../../utils/sheetUtils";

const isBigNumber = (arg: any): boolean => {
  return arg instanceof BigNumber || typeof arg === "bigint";
};

export function toPlainTextFormula(
  cellData: CellData,
  chainType: ChainType
): string {
  if (!cellData) return "0";

  const { contractAddress, selector, calldata, abi } = cellData;
  if (contractAddress === RC_BOUND) {
    return selector >= RC_BOUND ? bigint2hex(selector) : selector.toString();
  }

  const contractName =
    contractAddress <= RC_BOUND
      ? tokenIdToCellName(Number(contractAddress))
      : bigint2hex(contractAddress);
  const selectorHexString = bigint2hex(selector);
  const operator = abi?.name || selectorHexString;

  const args = calldata.map((arg) =>
    isDependency(arg)
      ? tokenIdToCellName(Number((arg - 1n) / 2n))
      : arg >= RC_BOUND
      ? "0x" + (arg / 2n).toString(16)
      : (arg / 2n).toString()
  );
  let displayedArgs = [];
  if (!!abi) {
    if (chainType === ChainType.STARKNET) {
      let argsIndex = 0;
      let inputIndex = 0;
      while (inputIndex < abi.inputs.length) {
        const _input = abi.inputs[inputIndex];
        if (_input.type === "Uint256") {
          displayedArgs.push(args[argsIndex]);
          displayedArgs.push(args[argsIndex + 1]);
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
      const mapping: Record<string, string> = {};
      const data =
        "0x" +
        calldata
          .map((arg) => {
            if (isDependency(arg)) {
              const placeholder = ethers.BigNumber.from(
                ethers.utils.randomBytes(20)
              )
                ._hex.slice(2)
                .padStart(64, "0");
              mapping[placeholder] = tokenIdToCellName(Number((arg - 1n) / 2n));
              return placeholder;
            }
            return bigint2uint(32)(arg / 2n);
          })
          .join("");
      const decodedData = ethers.utils.defaultAbiCoder.decode(
        abi.inputs.map((i) => i.type),
        data
      );
      // @ts-ignore
      displayedArgs = [customStringify(mapping)(decodedData).slice(1, -1)];
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

const customStringify =
  (mapping: Record<string, string>) =>
  (input: any): any => {
    if (Array.isArray(input)) {
      return "[" + input.map(customStringify(mapping)).join(", ") + "]";
    } else if (typeof input === "object" && !isBigNumber(input)) {
      return (
        "{" +
        Object.entries(input)
          .map(([key, value]) => `${key}: ${customStringify(mapping)(value)}`)
          .join(", ") +
        "}"
      );
    } else if (isBigNumber(input)) {
      const key = input._hex.slice(2).padStart(64, "0");
      const ret = mapping[key] === undefined ? input.toString() : mapping[key];
      return ret;
    } else if (typeof input === "string") {
      const key = input.slice(2).padStart(64, "0").toLowerCase();
      if (mapping[key] !== undefined) {
        return mapping[key];
      }
    }
    return `"${input}"`;
  };

export function parseContractCall(
  formula: string
): { contractAddress: string; selector: string; args: string } | null {
  const _formula = formula
    .trim()
    .replaceAll("\n", "")
    .replaceAll("\r", "")
    .replaceAll("&nbsp;", "");

  const formulaMatch = _formula.match(CONTRACT_CALL_REGEX);

  if (!formulaMatch?.groups) {
    return null;
  }

  const contractAddress = formulaMatch.groups.contractAddress.match(
    CELL_NAME_REGEX
  )
    ? cellNameToTokenId(formulaMatch.groups.contractAddress).toString()
    : formulaMatch.groups.contractAddress;

  if (!contractAddress.match(HEX_STRING_REGEX)) {
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
      .replace(/([, [(]?)([A-O]{1}[0-9]{1,2})([, \])]?)/gi, '$1"$2"$3')
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
    calldata = flattenWithLen(encodedArgs).slice(1) as bigint[];
  } else if (chainType === ChainType.EVM) {
    const m: Record<string, string> = {};
    const mappedArgs = mapCellsToRandom(m)(args);
    calldata = (ethers.utils.defaultAbiCoder
      .encode(
        selectorAbi.inputs.map((i) => i.type),
        mappedArgs
      )
      .slice(2)
      .match(/.{1,64}/g)
      ?.map((bytes32) => {
        const key = "0x" + bytes32.replace(/^0+/, "");
        if (m[key] !== undefined) {
          const cellName = m[key];
          return encodeTokenId(cellNameToTokenId(cellName));
        }
        return encodeConst("0x" + bytes32);
      }) || []) as bigint[];
  } else {
    throw new Error(`No parsing function for chainType ${chainType}`);
  }

  return {
    contractAddress: BigInt(rawCall.contractAddress),
    selector: BigInt(selector),
    calldata,
    abi: selectorAbi,
  };
}

export const decode = (_arg: bigint) =>
  isDependency(_arg) ? (_arg - 1n) / 2n : _arg / 2n;

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
    return input.replaceAll('"', "").match(CELL_NAME_REGEX)
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
  const operator = formula.match(CONTRACT_CALL_REGEX);

  let result = formula;

  if (settings?.text) {
    try {
      return hex2str(bigint2hex(BigInt(formula)));
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
        arg.replace("[", "").replace("]", "").match(CELL_NAME_REGEX)
      )
      .forEach((name) => {
        result = result.replace(name, `<span class="cell">${name}</span>`);
      });
  }

  return result;
}

const mapCellsToRandom =
  (mapping: Record<string, string>) =>
  (input: any): any => {
    if (Array.isArray(input)) {
      return input.map(mapCellsToRandom(mapping));
    } else if (typeof input === "object") {
      return Object.entries(input)
        .map(([key, value]) => ({
          [key]: mapCellsToRandom(mapping)(value),
        }))
        .reduce((prev, cur) => ({ ...prev, ...cur }), {});
    } else if (
      typeof input === "string" &&
      input.replace('"', "").match(CELL_NAME_REGEX)
    ) {
      const placeholder = ethers.BigNumber.from(
        // restricted to 20 instead of 32 to handle addresses (bytes20)
        ethers.utils.randomBytes(20)
      )._hex;
      mapping[placeholder] = input;
      return placeholder;
    } else return input;
  };
