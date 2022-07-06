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
        await contracts["Starksheet"].setContent(
            self.token_id, self.value, self.dependencies
        ).invoke(caller_address=OWNER)
        return contracts["Starksheet"]

    class TestGetCell:
        @staticmethod
        async def test_should_return_zero_when_token_does_not_exist(starksheet_minted):
            token_id = TestStarksheet.token_id + 1
            with pytest.raises(Exception):
                await starksheet_minted.ownerOf((0, token_id)).invoke()
            cell = await starksheet_minted.getCell(token_id).invoke()
            assert len(cell.result) == 1
            token_data = cell.result[0]
            assert token_data.dependencies_len == 0
            assert token_data.value == 0

        @staticmethod
        async def test_should_return_cell_value_when_token_exists(starksheet_minted):
            cell = await starksheet_minted.getCell(TestStarksheet.token_id).invoke()
            assert len(cell.result) == 1
            token_data = cell.result[0]
            assert token_data.dependencies_len == len(TestStarksheet.dependencies)
            assert token_data.value == TestStarksheet.value

    class TestSetContent:
        @staticmethod
        async def test_should_revert_when_token_does_not_exist(
            starksheet_minted,
        ):
            token_id = TestStarksheet.token_id + 1
            with pytest.raises(Exception):
                await starksheet_minted.setContent(
                    token_id, TestStarksheet.value, TestStarksheet.dependencies
                ).invoke(caller_address=OWNER)

        @staticmethod
        async def test_should_revert_when_caller_is_not_owner(
            starksheet_minted,
        ):
            with pytest.raises(Exception):
                await starksheet_minted.setContent(
                    TestStarksheet.token_id,
                    TestStarksheet.value,
                    TestStarksheet.dependencies,
                ).invoke(caller_address=TestStarksheet.other)

        @staticmethod
        async def test_should_set_value_and_dependencies(
            starksheet_minted,
        ):

            cell = await starksheet_minted.getCell(TestStarksheet.token_id).invoke()
            assert len(cell.result) == 1
            assert cell.result[0].value == TestStarksheet.value
            assert cell.result[0].dependencies_len == len(TestStarksheet.dependencies)
            deps = [
                (
                    await starksheet_minted.getCellDependenciesAtIndex(
                        TestStarksheet.token_id, i
                    ).invoke()
                ).result[0]
                for i in range(cell.result[0].dependencies_len)
            ]
            assert deps == TestStarksheet.dependencies
