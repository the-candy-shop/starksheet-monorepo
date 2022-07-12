import asyncio
from typing import Dict

import pytest
import pytest_asyncio
from starkware.starknet.compiler.compile import compile_starknet_files
from starkware.starknet.testing.starknet import Starknet, StarknetContract

from constants import CONTRACTS, OWNER

CONTRACTS_FIXTURE = Dict[str, StarknetContract]


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def starknet() -> Starknet:
    return await Starknet.empty()


@pytest_asyncio.fixture(scope="session")
async def contracts(starknet: Starknet) -> CONTRACTS_FIXTURE:

    Starksheet = compile_starknet_files(
        [str(CONTRACTS["Starksheet"])], debug_info=True, disable_hint_validation=True
    )
    # TODO: rework this fixture to be more generic and to use one single deployment config
    return {
        "Starksheet": await starknet.deploy(
            contract_class=Starksheet,
            constructor_calldata=[
                int("Starksheet".encode().hex(), 16),
                int("STRK".encode().hex(), 16),
                OWNER,
            ],
        )
    }
