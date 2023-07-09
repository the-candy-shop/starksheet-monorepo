import { number } from "starknet";

export const RC_BOUND = number.toBN(2).pow(number.toBN(128));
export const CONTRACT_FUNCTION_SEP = ".";
export const ARGS_SEP = ",";
export const ARG_LIST_SEP = ",";
export const CELL_NAME_REGEX = /^[a-z]\d+$/i;
