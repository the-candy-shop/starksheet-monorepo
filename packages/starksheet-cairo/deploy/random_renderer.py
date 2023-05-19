# %% Imports
import logging
from asyncio import run
from collections import Counter
from itertools import chain
from string import ascii_letters
from textwrap import wrap

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
        "RandomRenderer",
        "proxy",
    ]:
        compile_contract(contract_name)
        class_hash[contract_name] = await declare(contract_name)
    dump_declarations(class_hash)

    # %% Deploy contracts
    class_hash = get_declarations()
    deployments = get_deployments()
    deployments["RandomRenderer"] = {
        **dict(
            zip(
                ["address", "tx"],
                await deploy(
                    "proxy",
                    (await get_account()).address,  # proxy_admin
                    class_hash["RandomRenderer"],  # implementation_hash
                    get_selector_from_name("initialize"),  # selector
                    ((await get_account()).address,),  # calldata  # proxy_admin_address
                ),
            )
        ),
        "artifact": get_artifact("RandomRenderer"),
        "alias": get_alias("RandomRenderer"),
    }
    dump_deployments(deployments)

    # %% Random Renderer tests
    uris = [ascii_letters[:33], ascii_letters[-33:], ascii_letters[:31]]
    l = [len(wrap(uri, 31)) + 1 for uri in uris]
    uris_encoded = [sum(l[:i]) + len(l) for i in range(len(l))] + list(
        chain.from_iterable(
            [
                [len(wrap(uri, 31))]
                + [int.from_bytes(p.encode(), "big") for p in wrap(uri, 31)]
                for uri in uris
            ]
        )
    )
    await invoke("RandomRenderer", "setUris", uris_encoded)
    c = Counter()
    for i in range(100):
        uri = bytes.fromhex(
            "".join(
                [
                    hex(p)[2:]
                    for p in (
                        await call("RandomRenderer", "token_uri", i, 0, 0)
                    ).token_uri
                ]
            )
        ).decode()
        assert uri in uris
        c[uri] += 1
    for i, uri in enumerate(uris):
        assert (
            bytes.fromhex(
                "".join(
                    [
                        hex(p)[2:]
                        for p in (
                            await call("RandomRenderer", "testUris", uris_encoded, i)
                        ).uri
                    ]
                )
            ).decode()
            == uri
        )


# %% Main
if __name__ == "__main__":
    run(main())
