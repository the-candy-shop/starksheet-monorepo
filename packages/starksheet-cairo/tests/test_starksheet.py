import re

import pytest
import pytest_asyncio

from constants import OWNER


@pytest.mark.asyncio
class TestStarksheet:
    token_id = 0
    token_id_256 = (0, token_id)
    value = 10
    dependencies = [10, 20, 30]
    other = OWNER + 1

    @pytest_asyncio.fixture(scope="session")
    async def starksheet_minted(self, contracts):
        await contracts["Starksheet"].mint(OWNER, self.token_id_256).invoke(
            caller_address=OWNER
        )
        await contracts["Starksheet"].setCell(
            self.token_id, self.value, self.dependencies
        ).invoke(caller_address=OWNER)
        return contracts["Starksheet"]

    class TestGetCell:
        @staticmethod
        async def test_should_return_zero_when_token_does_not_exist(starksheet_minted):
            token_id = TestStarksheet.token_id + 1
            with pytest.raises(Exception) as e:
                await starksheet_minted.ownerOf((0, token_id)).call()
            message = re.search(r"Error message: (.*)", e.value.message)[1]  # type: ignore
            assert message == "ERC721: owner query for nonexistent token"
            cell = await starksheet_minted.getCell(token_id).call()
            cell = cell.result
            assert cell.dependencies == []
            assert cell.value == 0

        @staticmethod
        async def test_should_return_cell_value_when_token_exists(starksheet_minted):
            cell = await starksheet_minted.getCell(TestStarksheet.token_id).call()
            cell = cell.result
            assert cell.value == TestStarksheet.value
            assert cell.dependencies == TestStarksheet.dependencies

    class TestSetCell:
        @staticmethod
        async def test_should_revert_when_token_does_not_exist(
            starksheet_minted,
        ):
            token_id = TestStarksheet.token_id + 1
            with pytest.raises(Exception) as e:
                await starksheet_minted.setCell(
                    token_id, TestStarksheet.value, TestStarksheet.dependencies
                ).invoke(caller_address=OWNER)
            message = re.search(r"Error message: (.*)", e.value.message)[1]  # type: ignore
            assert message == "setCell: tokenId does not exist"

        @staticmethod
        async def test_should_revert_when_caller_is_not_owner(
            starksheet_minted,
        ):
            with pytest.raises(Exception) as e:
                await starksheet_minted.setCell(
                    TestStarksheet.token_id,
                    TestStarksheet.value,
                    TestStarksheet.dependencies,
                ).invoke(caller_address=TestStarksheet.other)
            message = re.search(r"Error message: (.*)", e.value.message)[1]  # type: ignore
            assert message == "setCell: sender is not owner"

        @staticmethod
        async def test_should_set_value_and_dependencies(
            starksheet_minted,
        ):
            """
            Testing getter and setter by writing and retreiving the value leads to duplicated tests.
            However, we keep it here as well to clarify what is tested for the both.
            """
            cell = (
                await starksheet_minted.getCell(TestStarksheet.token_id).call()
            ).result
            assert cell.value == TestStarksheet.value
            assert cell.dependencies == TestStarksheet.dependencies
