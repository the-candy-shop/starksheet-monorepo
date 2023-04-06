import { number } from "starknet";
import contract from "../contract.json";
import { OnsheetContractData } from "../types";

export const RC_BOUND = number.toBN(2).pow(number.toBN(128));
export const onsheetContractData = contract as OnsheetContractData;
