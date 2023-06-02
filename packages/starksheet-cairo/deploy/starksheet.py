# %% Imports
import logging
from asyncio import run

from dotenv import load_dotenv
from utils.deployment import (
    compile_contract,
    declare,
    deploy,
    dump_declarations,
    dump_deployments,
    get_account,
    get_alias,
    get_artifact,
    get_declarations,
    get_deployments,
)

load_dotenv()
logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


# %% Main
async def main():
    # %% Compile & declare contracts
    class_hash = get_declarations()
    for contract_name in [
        "Sheet",
        "Starksheet",
        "BasicCellRenderer",
        "UriRenderer",
        "math",
        "execute",
        "proxy",
    ]:
        compile_contract(contract_name)
        class_hash[contract_name] = await declare(contract_name)
    dump_declarations(class_hash)

    # %% Deploy contracts
    class_hash = get_declarations()
    deployments = get_deployments()
    deployments = {
        contract_name: {
            **dict(zip(["address", "tx"], await deploy(contract_name))),
            "artifact": get_artifact(contract_name),
            "alias": get_alias(contract_name),
        }
        for contract_name in [
            "BasicCellRenderer",
            "math",
            "execute",
        ]
    }
    deployments["Starksheet"] = {
        **dict(
            zip(
                ["address", "tx"],
                await deploy(
                    "Starksheet",
                    (await get_account()).address,  # owner
                    class_hash["Sheet"],  # sheet_class_hash
                    class_hash["proxy"],  # proxy_class_hash
                    deployments["BasicCellRenderer"][
                        "address"
                    ],  # default_renderer_address
                    int(0.01 * 1e18),  # sheet_price
                ),
            )
        ),
        "artifact": get_artifact("Starksheet"),
        "alias": get_alias("Starksheet"),
    }
    dump_deployments(deployments)


# %% Main
if __name__ == "__main__":
    run(main())
