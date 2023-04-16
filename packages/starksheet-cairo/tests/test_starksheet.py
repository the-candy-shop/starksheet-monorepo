import pytest
import pytest_asyncio
from starkware.starknet.compiler.compile import compile_starknet_files
from starkware.starknet.testing.starknet import Starknet, StarknetContract

from utils.constants import ACCOUNT_ADDRESS, CONTRACTS

OWNER = int(ACCOUNT_ADDRESS, 16)
OTHER = OWNER + 1


@pytest_asyncio.fixture(scope="session")
async def sheet_class_hash(starknet: Starknet):
    return await starknet.declare(
        contract_class=compile_starknet_files(
            [str(CONTRACTS["Sheet"])],
            debug_info=True,
            disable_hint_validation=True,
        )
    )


@pytest_asyncio.fixture(scope="session")
async def starksheet(
    starknet: Starknet, sheet_class_hash, renderer
) -> StarknetContract:
    return await starknet.deploy(
        contract_class=compile_starknet_files(
            [str(CONTRACTS["Starksheet"])],
            debug_info=True,
            disable_hint_validation=True,
        ),
        constructor_calldata=[
            OWNER,
            sheet_class_hash.class_hash,
            renderer.contract_address,
        ],
    )


@pytest.mark.asyncio
class TestStarksheet:
    class TestAddSheet:
        @staticmethod
        async def test_should_deploy_sheet_with_caller_as_owner_and_given_names(
            starknet, starksheet, sheet_class_hash
        ):
            name = int("MySheet".encode().hex(), 16)
            symbol = int("MS".encode().hex(), 16)
            tx = await starksheet.addSheet(name, symbol, []).execute(
                caller_address=OTHER
            )
            sheet = StarknetContract(
                state=starknet.state,
                abi=sheet_class_hash.abi,
                contract_address=tx.result.address,
                deploy_call_info=tx,
            )
            sheet_name = await sheet.name().call()
            assert name == sheet_name.result.name

            sheet_symbol = await sheet.symbol().call()
            assert symbol == sheet_symbol.result.symbol

            sheet_owner = await sheet.getOwner().call()
            assert OTHER == sheet_owner.result.owner

        @staticmethod
        async def test_should_deploy_sheet_with_caller_as_owner_and_default_names(
            starknet, starksheet, sheet_class_hash
        ):
            tx = await starksheet.addSheet(0, 0, []).execute(caller_address=OTHER)
            sheet = StarknetContract(
                state=starknet.state,
                abi=sheet_class_hash.abi,
                contract_address=tx.result.address,
                deploy_call_info=tx,
            )
            sheet_name = await sheet.name().call()
            sheet_symbol = await sheet.symbol().call()
            sheet_owner = await sheet.getOwner().call()
            assert "Sheet1" == bytes.fromhex(
                hex(sheet_name.result.name)[2:]
            ).decode().replace("\x00", "")

            assert "SHT1" == bytes.fromhex(
                hex(sheet_symbol.result.symbol)[2:]
            ).decode().replace("\x00", "")

            assert OTHER == sheet_owner.result.owner
