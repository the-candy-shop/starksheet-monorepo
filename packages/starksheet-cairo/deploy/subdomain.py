# %% Imports
import logging
from asyncio import run

from dotenv import load_dotenv
from starkware.starknet.public.abi import get_selector_from_name
from utils.constants import (
    ONSHEET_OWNER_ADDRESS,
    ONSHEET_PRIVATE_KEY,
    STARKNET_ID_ADDRESS,
    STARKNET_ID_NAMING,
)
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
from utils.starknet_id import encode_domain

load_dotenv()
logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


# %% Main
async def main():
    # %% Compile & declare contracts
    class_hash = get_declarations()
    for contract_name in [
        "Subdomain",
        "proxy",
    ]:
        compile_contract(contract_name)
        class_hash[contract_name] = await declare(contract_name)
    dump_declarations(class_hash)

    # %% Claim back onsheet token if required
    deployments = get_deployments()
    onsheet_token_id = await call(
        STARKNET_ID_NAMING, "domain_to_token_id", 1, encode_domain("onsheet")
    )
    onsheet_owner = await get_account(ONSHEET_OWNER_ADDRESS, ONSHEET_PRIVATE_KEY)
    current_owner = (
        await call(STARKNET_ID_ADDRESS, "ownerOf", onsheet_token_id[0], 0)
    )[0]
    logger.info(f"ℹ️  Current onsheet.stark owner: {hex(current_owner)}")
    if current_owner != onsheet_owner.address and "Subdomain" in deployments:
        await invoke("Subdomain", "claim_domain_back", [encode_domain("onsheet")])

    # %% Deploy contracts
    class_hash = get_declarations()
    deployments = get_deployments()
    deployments["Subdomain"] = {
        **dict(
            zip(
                ["address", "tx"],
                await deploy(
                    "proxy",
                    (await get_account()).address,  # proxy_admin
                    class_hash["Subdomain"],  # implementation_hash
                    get_selector_from_name("initializer"),  # selector
                    (  # calldata
                        (await get_account()).address,  # proxy_admin_address
                        STARKNET_ID_ADDRESS,  # starknetid_contract
                        STARKNET_ID_NAMING,  # naming_contract
                    ),
                ),
            )
        ),
        "artifact": get_artifact("Subdomain"),
        "alias": get_alias("Subdomain"),
    }
    dump_deployments(deployments)

    # %% Transfer onsheet ownership
    deployments = get_deployments()

    await invoke(
        STARKNET_ID_ADDRESS,
        "transferFrom",
        onsheet_owner.address,
        deployments["Subdomain"]["address"],
        onsheet_token_id[0],
        0,
        account=onsheet_owner,
    )
    await invoke("Subdomain", "open_registration")


# %% Main
if __name__ == "__main__":
    run(main())
