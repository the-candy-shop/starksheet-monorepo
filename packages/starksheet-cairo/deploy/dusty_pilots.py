# %% Imports
import logging
from asyncio import run

import pandas as pd
from starkware.starknet.public.abi import get_selector_from_name
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
        "DustyPilots",
        "DustyPilotRenderer",
        "proxy",
    ]:
        compile_contract(contract_name)
        class_hash[contract_name] = await declare(contract_name)
    dump_declarations(class_hash)

    # %% Deploy contracts
    class_hash = get_declarations()
    deployments = get_deployments()
    deployments["DustyPilotRenderer"] = {
        **dict(
            zip(
                ["address", "tx"],
                await deploy(
                    "proxy",
                    (await get_account()).address,  # proxy_admin
                    class_hash["DustyPilotRenderer"],  # implementation_hash
                    get_selector_from_name("initialize"),  # selector
                    ((await get_account()).address,),  # calldata  # proxy_admin_address
                ),
            )
        ),
        "artifact": get_artifact("DustyPilotRenderer"),
        "alias": get_alias("DustyPilotRenderer"),
    }

    deployments["DustyPilots"] = {
        **dict(
            zip(
                ["address", "tx"],
                await deploy(
                    "proxy",
                    (await get_account()).address,  # proxy_admin
                    class_hash["DustyPilots"],  # implementation_hash
                    get_selector_from_name("initialize"),  # selector
                    (
                        int.from_bytes(b"Dusty Pilots", "big"),
                        int.from_bytes(b"DSTP", "big"),
                        (await get_account()).address,
                        0,  # merkle_root
                        0,  # max_per_wallet
                        deployments["DustyPilotRenderer"][
                            "address"
                        ],  # renderer_address
                    ),  # calldata
                ),
            )
        ),
        "artifact": get_artifact("DustyPilots"),
        "alias": get_alias("DustyPilots"),
    }

    dump_deployments(deployments)

    # %% Setup
    thresholds = pd.read_csv("dust_pilots/dusted.csv").threshold.to_list()
    await invoke("DustyPilotRenderer", "setThresholds", thresholds)
    await invoke("DustyPilots", "openMint")
    await invoke("DustyPilots", "setNRow", 19)
    value = 0x1234
    token_id = 4
    await invoke(
        "DustyPilots",
        "mintAndSetPublic",
        token_id,  # tokenId
        [],  # proof
        2**128,  # contractAddress
        value,
        [],  # cellCalldata_len, cellCalldata
    )


# %% Main
if __name__ == "__main__":
    run(main())
