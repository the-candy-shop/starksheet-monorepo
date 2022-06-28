// noinspection JSUnusedGlobalSymbols

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { TAGS } from "../utils/constants";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Deploy token
  await deploy("Starksheet", {
    from: deployer,
    log: true,
    args: [
      "Starksheet",
      "STRKS",
    ],
  });
};
export default func;
func.tags = [TAGS.STARKSHEET];
