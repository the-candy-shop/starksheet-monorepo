import asyncio

import pytest
import pytest_asyncio
from starkware.starknet.testing.starknet import Starknet

from constants import CONTRACTS


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def starknet():
    return await Starknet.empty()


@pytest_asyncio.fixture(scope="session")
async def contracts(starknet):
    return {
        contract.stem: await starknet.deploy(source=str(contract))
        for contract in CONTRACTS
    }
