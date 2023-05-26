import pytest
import pytest_asyncio
from starkware.starknet.compiler.compile import compile_starknet_files
from starkware.starknet.public.abi import get_selector_from_name
from starkware.starknet.testing.starknet import StarknetContract
from utils.constants import CONTRACTS


@pytest_asyncio.fixture(scope="session")
async def caller_user(starknet) -> StarknetContract:
    return await starknet.deploy(
        contract_class=compile_starknet_files(
            [str(CONTRACTS["caller_user"])],
            debug_info=True,
            disable_hint_validation=True,
            cairo_path=["src"],
        ),
        constructor_calldata=[],
    )


@pytest_asyncio.fixture(scope="session")
async def caller_contract(starknet) -> StarknetContract:
    return await starknet.deploy(
        contract_class=compile_starknet_files(
            [str(CONTRACTS["caller_contract"])],
            debug_info=True,
            disable_hint_validation=True,
            cairo_path=["src"],
        ),
        constructor_calldata=[],
    )


@pytest.mark.asyncio
class TestCallerContract:
    class TestFunCallingAFunUsingGetCaller:
        async def test_call(
            self, caller_user: StarknetContract, caller_contract: StarknetContract
        ):
            print(f"\n{caller_contract.contract_address=}")
            selector = get_selector_from_name("fun_with_get_caller")
            await caller_contract.fun_calling_a_fun_using_get_caller(
                caller_user.contract_address, selector
            ).execute(caller_address=1234)
