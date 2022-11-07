import BN from "bn.js";
import { RC_BOUND } from "./constants";

export const resolveContractAddress = (values: BN[], contractAddress: BN) => {
  return contractAddress.lt(RC_BOUND)
    ? values[contractAddress.toNumber()]
    : contractAddress;
};
