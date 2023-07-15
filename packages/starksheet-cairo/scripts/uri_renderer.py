# %% Imports
import logging
from asyncio import run

from starkware.starknet.public.abi import get_selector_from_name
from utils.deployment import (
    call,
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
    invoke,
)

logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


# %% Main
async def main():
    # %% Compile & declare contracts
    class_hash = get_declarations()
    for contract_name in [
        "UriRenderer",
        "proxy",
    ]:
        compile_contract(contract_name)
        class_hash[contract_name] = await declare(contract_name)
    dump_declarations(class_hash)

    # %% Deploy contracts
    class_hash = get_declarations()
    deployments = get_deployments()
    deployments["UriRenderer"] = {
        **dict(
            zip(
                ["address", "tx"],
                await deploy(
                    "proxy",
                    (await get_account()).address,  # proxy_admin
                    class_hash["UriRenderer"],  # implementation_hash
                    get_selector_from_name("initialize"),  # selector
                    ((await get_account()).address,),  # calldata  # proxy_admin_address
                ),
            )
        ),
        "artifact": get_artifact("UriRenderer"),
        "alias": get_alias("UriRenderer"),
    }
    dump_deployments(deployments)


# %% Main
if __name__ == "__main__":
    run(main())
