import random
import re
from collections import namedtuple
from math import prod

import pytest
import pytest_asyncio
from starkware.crypto.signature.signature import FIELD_PRIME
from starkware.starknet.public.abi import get_selector_from_name

from constants import OWNER

Cell = namedtuple("Cell", ["id", "value", "dependencies"])
random.seed(0)

OTHER = OWNER + 1
FUNCTIONS = {get_selector_from_name(ops.__name__): ops for ops in [sum, prod]}
CELLS = [
    Cell(
        **{
            "id": id,
            "dependencies": (
                deps := random.sample(list(range(id - 1)), k=random.randint(0, id - 1))
                if id > 0
                else []
            ),
            "value": random.sample(list(FUNCTIONS.keys()), k=1)[0]
            if len(deps) > 0
            else random.randint(0, 2**16),
        }
    )
    for id in range(10)
]


def render(cells):
    def _render(i):
        cell = cells[i]
        if not cell.dependencies:
            return cell.value
        return (
            FUNCTIONS[cell.value](
                [_render(dependency) for dependency in cell.dependencies]
            )
            % FIELD_PRIME
        )

    return _render


@pytest.mark.asyncio
class TestStarksheet:
    @pytest_asyncio.fixture(scope="session")
    async def starksheet_minted(self, contracts):
        for cell in CELLS:
            await contracts["Starksheet"].mint(OWNER, (cell.id, 0)).invoke(
                caller_address=OWNER
            )
            await contracts["Starksheet"].setCell(
                cell.id,
                cell.value,
                cell.dependencies,
            ).invoke(caller_address=OWNER)
        return contracts["Starksheet"]

    class TestGetCell:
        @staticmethod
        async def test_should_return_zero_when_token_does_not_exist(starksheet_minted):
            with pytest.raises(Exception) as e:
                await starksheet_minted.ownerOf((0, len(CELLS))).call()
            message = re.search(r"Error message: (.*)", e.value.message)[1]  # type: ignore
            assert message == "ERC721: owner query for nonexistent token"
            cell = (await starksheet_minted.getCell(len(CELLS)).call()).result
            assert cell.dependencies == []
            assert cell.value == 0

        @staticmethod
        @pytest.mark.parametrize("cell", CELLS)
        async def test_should_return_cell_value_when_token_exists(
            starksheet_minted, cell
        ):
            result = (await starksheet_minted.getCell(cell.id).call()).result
            assert result.value == cell.value
            assert result.dependencies == cell.dependencies

    class TestSetCell:
        @staticmethod
        async def test_should_revert_when_token_does_not_exist(
            starksheet_minted,
        ):
            with pytest.raises(Exception) as e:
                await starksheet_minted.setCell(len(CELLS), 0, []).invoke(
                    caller_address=OWNER
                )
            message = re.search(r"Error message: (.*)", e.value.message)[1]  # type: ignore
            assert message == f"setCell: tokenId does not exist"

        @staticmethod
        async def test_should_revert_when_caller_is_not_owner(
            starksheet_minted,
        ):
            with pytest.raises(Exception) as e:
                await starksheet_minted.setCell(
                    CELLS[0].id,
                    CELLS[0].value,
                    CELLS[0].dependencies,
                ).invoke(caller_address=OTHER)
            message = re.search(r"Error message: (.*)", e.value.message)[1]  # type: ignore
            assert message == "setCell: caller is not owner"

        @staticmethod
        @pytest.mark.parametrize("cell", CELLS)
        async def test_should_set_value_and_dependencies(starksheet_minted, cell):
            """
            Testing getter and setter by writing and retreiving the value leads to duplicated tests.
            However, we keep it here as well to clarify what is tested for the both.
            """
            result = (await starksheet_minted.getCell(cell.id).call()).result
            assert result.value == cell.value
            assert result.dependencies == cell.dependencies

    class TestRenderCell:
        @staticmethod
        @pytest.mark.parametrize("cell", CELLS)
        async def test_should_return_rendered_cell_value(starksheet_minted, cell):
            result = (await starksheet_minted.renderCell(cell.id).call()).result
            assert result.value == render(CELLS)(cell.id)

    class TestMintBatchPublic:
        @staticmethod
        async def test_should_mint_batch_to_caller(contracts):
            token_ids = [(len(CELLS) + 1, 0), (len(CELLS) + 2, 0)]
            await contracts["Starksheet"].mintBatchPublic(token_ids).invoke(
                caller_address=OWNER
            )
            owner = await contracts["Starksheet"].ownerOf(token_ids[0]).call()
            assert OWNER == owner.result.owner
            owner = await contracts["Starksheet"].ownerOf(token_ids[1]).call()
            assert OWNER == owner.result.owner
