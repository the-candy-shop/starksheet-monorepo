import asyncio

import pytest
import pytest_asyncio
from starkware.starknet.testing.starknet import Starknet


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def starknet() -> Starknet:
    return await Starknet.empty()
