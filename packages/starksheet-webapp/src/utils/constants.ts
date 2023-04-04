import { toBN } from "starknet/utils/number";
import contract from "../contract.json";
import { OnsheetContractData } from "../types";

export const RC_BOUND = toBN(2).pow(toBN(128));
export const onsheetContractData = contract as OnsheetContractData;
