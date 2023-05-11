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

    # %% TODO: remove when wallets work on devnet
    deployments = get_deployments()

    origin_address = (await call("Starksheet", "getSheet", 0)).address
    name = bytes.fromhex(
        hex((await call("Sheet", "name", address=origin_address)).name)[2:]
    ).decode()
    logger.info(f"ℹ️  {name} sheet address {hex(origin_address)}")
    await invoke(
        "Sheet",
        "setCellRenderer",
        deployments["UriRenderer"]["address"],
        address=origin_address,
    )
    base_uri = list(b"ipfs://QmPJUCccDijTC8oMbEMSAYHtxjXekJTQXP2N1rJsYBkUaa")
    await invoke("UriRenderer", "setBaseUri", base_uri)
    assert base_uri == (await call("UriRenderer", "getBaseUri")).base_uri

    value = 0x1234
    token_id = 4
    await invoke(
        "Sheet",
        "mintAndSetPublic",
        token_id,  # tokenId
        [],  # proof
        2**128,  # contractAddress
        value,
        [],  # cellCalldata_len, cellCalldata
        address=origin_address,
    )
    assert (
        base_uri
        == (await call("Sheet", "tokenURI", token_id, address=origin_address)).token_uri
    )
    await invoke("UriRenderer", "setUseValue", 1)
    assert [*base_uri, ord("/"), int(str(token_id).encode().hex(), 16)] == (
        await call("Sheet", "tokenURI", token_id, address=origin_address)
    ).token_uri


# %% Main
if __name__ == "__main__":
    run(main())
