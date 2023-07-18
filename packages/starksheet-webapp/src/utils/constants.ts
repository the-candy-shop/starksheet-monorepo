import { number } from "starknet";

export const RC_BOUND = number.toBN(2).pow(number.toBN(128));
export const CONTRACT_FUNCTION_SEP = ".";
export const ARGS_SEP = ",";
export const ARG_LIST_SEP = ",";
export const CELL_NAME_REGEX = /^[a-z]\d+$/i;
export const CONTRACT_CALL_REGEX =
  /(?<contractAddress>(0x)?[a-z0-9]+)\.(?<selector>[a-z_0-9]+)\((?<args>[a-z0-9[\]{},;: "']*)\)/i;
export const HEX_STRING_REGEX = /^(0x)?[a-f0-9]+$/i;
