# %% Imports
import logging
from asyncio import run

from dotenv import load_dotenv
from utils.constants import NETWORK
from utils.starknet import (
    deploy,
    dump_deployments,
    get_declarations,
    get_deployments,
    get_starknet_account,
)

load_dotenv()
logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


# %% Main
async def main():
    # %% Deploy contracts
    class_hash = get_declarations()
    deployments = get_deployments()
    deployments = {
        contract_name: await deploy(contract_name)
        for contract_name in [
            "BasicCellRenderer",
            "math",
            "execute",
        ]
    }
    deployments["Starksheet"] = await deploy(
        "Starksheet",
        (await get_starknet_account()).address,  # owner
        class_hash["Sheet"],  # sheet_class_hash
        class_hash["proxy"],  # proxy_class_hash
        deployments["BasicCellRenderer"]["address"],  # default_renderer_address
        int(0.01 * 1e18),  # sheet_price
    )
    if NETWORK["devnet"]:
        deployments["Multicall"] = await deploy("Multicall")

    dump_deployments(deployments)


# %% Main
if __name__ == "__main__":
    run(main())
