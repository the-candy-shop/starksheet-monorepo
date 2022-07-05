import pytest


@pytest.mark.asyncio
class TestSetContent:
    @staticmethod
    async def test_should_revert_when_token_does_not_exist(contracts):
        assert False

    @staticmethod
    async def test_should_set_constant_cell(contracts):
        await contracts.get("starksheet").setContent(0, 10, []).invoke()
        cell = await contracts.get("starksheet").getCell(0).invoke()
        assert len(cell.result) == 1
        assert cell.result[0].value == 10
        assert cell.result[0].dependencies_len == 0

    @staticmethod
    async def test_should_set_cell_with_deps(contracts):
        dependencies = [1, 2, 3]
        await contracts.get("starksheet").setContent(0, 10, dependencies).invoke()
        cell = await contracts.get("starksheet").getCell(0).invoke()
        assert len(cell.result) == 1
        assert cell.result[0].value == 10
        assert cell.result[0].dependencies_len == 3
        deps = [
            (
                await contracts.get("starksheet")
                .getCellDependenciesAtIndex(0, i)
                .invoke()
            ).result[0]
            for i in range(cell.result[0].dependencies_len)
        ]
        assert deps == dependencies
