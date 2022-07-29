import asyncio

import pytest
import pytest_asyncio
from starkware.starknet.compiler.compile import compile_starknet_files
from starkware.starknet.testing.starknet import Starknet

from constants import CONTRACTS


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def starknet() -> Starknet:
    return await Starknet.empty()


@pytest_asyncio.fixture(scope="session")
async def math(starknet):
    return await starknet.deploy(
        contract_class=compile_starknet_files(
            [str(CONTRACTS["math"])],
            debug_info=True,
            disable_hint_validation=True,
        ),
        constructor_calldata=[],
    )


@pytest_asyncio.fixture(scope="session")
async def renderer(starknet):
    return await starknet.deploy(
        contract_class=compile_starknet_files(
            [str(CONTRACTS["BasicCellRenderer"])],
            debug_info=True,
            disable_hint_validation=True,
        ),
        constructor_calldata=[],
    )
