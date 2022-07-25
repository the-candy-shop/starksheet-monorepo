import json
import random
import re
import xml.etree.ElementTree as ET
from collections import namedtuple
from math import prod
from urllib.parse import unquote

import pytest
import pytest_asyncio
from starkware.crypto.signature.signature import FIELD_PRIME, pedersen_hash
from starkware.starknet.compiler.compile import compile_starknet_files
from starkware.starknet.public.abi import get_selector_from_name
from starkware.starknet.testing.starknet import Starknet, StarknetContract

from constants import CONTRACTS, OWNER
from utils import number_to_index

Cell = namedtuple("Cell", ["id", "value", "dependencies"])
random.seed(0)


def div(l):
    return l[0] // l[1]


def sub(l):
    return l[0] - l[1]


def merkle_root(values):
    if len(values) == 1:
        return values[0]
    return merkle_root([pedersen_hash(x, y) for x, y in zip(values[::2], values[1::2])])


GRID_SIZE = 15 * 15
OTHER = OWNER + 1
ALLOW_LIST = [OWNER, OTHER]
LEAFS = [pedersen_hash(address, address) for address in ALLOW_LIST]
MERKLE_ROOT = merkle_root(LEAFS)
FUNCTIONS = {get_selector_from_name(ops.__name__): ops for ops in [sum, prod, div, sub]}
CELLS = []
for id in range(10):
    dependencies = (
        random.sample(list(range(id - 1)), k=random.randint(0, id - 1))
        if id > 0
        else []
    )
    if id < 2:
        value = random.sample(
            [get_selector_from_name(ops.__name__) for ops in [sum, prod]], k=1
        )[0]
    else:
        value = random.sample(list(FUNCTIONS.keys()), k=1)[0]
    if not dependencies:
        value = random.randint(0, 2**32 - 1)
    if value in [get_selector_from_name(ops.__name__) for ops in [div, sub]]:
        dependencies = random.sample(list(range(id)), k=2)
    CELLS.append(Cell(id, value, dependencies))


def render(cells):
    def _render(i):
        if i >= len(cells):
            return 0
        cell = cells[i]
        if not cell.dependencies:
            return cell.value
        return FUNCTIONS[cell.value](
            [_render(dependency) for dependency in cell.dependencies]
        )

    return _render


@pytest_asyncio.fixture(scope="session")
async def starksheet(starknet: Starknet) -> StarknetContract:
    _starksheet = await starknet.deploy(
        contract_class=compile_starknet_files(
            [str(CONTRACTS["Starksheet"])],
            debug_info=True,
            disable_hint_validation=True,
        ),
        constructor_calldata=[
            int("Starksheet".encode().hex(), 16),
            int("STRK".encode().hex(), 16),
            OWNER,
        ],
    )
    for cell in CELLS:
        await _starksheet.mintOwner(OWNER, (cell.id, 0)).invoke(caller_address=OWNER)
        await _starksheet.setCell(
            cell.id,
            cell.value,
            cell.dependencies,
        ).invoke(caller_address=OWNER)
    await _starksheet.setMerkleRoot(MERKLE_ROOT).invoke(caller_address=OWNER)
    return _starksheet


@pytest.mark.asyncio
class TestStarksheet:
    class TestGetCell:
        @staticmethod
        async def test_should_return_zero_when_token_does_not_exist(starksheet):
            with pytest.raises(Exception) as e:
                await starksheet.ownerOf((0, len(CELLS))).call()
            message = re.search(r"Error message: (.*)", e.value.message)[1]  # type: ignore
            assert message == "ERC721: owner query for nonexistent token"
            cell = (await starksheet.getCell(len(CELLS)).call()).result
            assert cell.dependencies == []
            assert cell.value == 0

        @staticmethod
        @pytest.mark.parametrize("cell", CELLS)
        async def test_should_return_cell_value_when_token_exists(starksheet, cell):
            result = (await starksheet.getCell(cell.id).call()).result
            assert result.value == cell.value
            assert result.dependencies == cell.dependencies

    class TestSetCell:
        @staticmethod
        async def test_should_revert_when_token_does_not_exist(
            starksheet,
        ):
            with pytest.raises(Exception) as e:
                await starksheet.setCell(len(CELLS), 0, []).invoke(caller_address=OWNER)
            message = re.search(r"Error message: (.*)", e.value.message)[1]  # type: ignore
            assert message == f"setCell: tokenId does not exist"

        @staticmethod
        async def test_should_revert_when_caller_is_not_owner(
            starksheet,
        ):
            with pytest.raises(Exception) as e:
                await starksheet.setCell(
                    CELLS[0].id,
                    CELLS[0].value,
                    CELLS[0].dependencies,
                ).invoke(caller_address=OTHER)
            message = re.search(r"Error message: (.*)", e.value.message)[1]  # type: ignore
            assert message == "setCell: caller is not owner"

        @staticmethod
        @pytest.mark.parametrize("cell", CELLS)
        async def test_should_set_value_and_dependencies(starksheet, cell):
            """
            Testing getter and setter by writing and retreiving the value leads to duplicated tests.
            However, we keep it here as well to clarify what is tested for the both.
            """
            result = (await starksheet.getCell(cell.id).call()).result
            assert result.value == cell.value
            assert result.dependencies == cell.dependencies

    class TestRenderCell:
        @staticmethod
        @pytest.mark.parametrize("cell", CELLS)
        async def test_should_return_rendered_cell_value(starksheet, cell):
            result = (await starksheet.renderCell(cell.id).call()).result.cell
            assert result.value == render(CELLS)(cell.id) % FIELD_PRIME
            assert result.id == cell.id
            assert result.owner == OWNER

        @staticmethod
        @pytest_asyncio.fixture
        async def starksheet_cell_altered(starksheet):
            cell = next(iter([cell for cell in CELLS if cell.dependencies]))
            await starksheet.setCell(
                cell.id,
                cell.value + 1,
                cell.dependencies,
            ).invoke(caller_address=OWNER)
            yield starksheet, cell
            await starksheet.setCell(
                cell.id,
                cell.value,
                cell.dependencies,
            ).invoke(caller_address=OWNER)

        @staticmethod
        async def test_should_revert_when_value_does_not_exist_and_cell_has_deps(
            starksheet_cell_altered,
        ):
            starksheet, cell = starksheet_cell_altered
            with pytest.raises(Exception) as e:
                await starksheet.renderCell(cell.id).call()
            message = re.search(r"Error message: (.*)", e.value.message)[1]  # type: ignore
            assert message == f"renderCell: formula {cell.value + 1} not found"

    class TestRenderGrid:
        @staticmethod
        async def test_should_return_rendered_grid(starksheet):
            result = (await starksheet.renderGrid().call()).result.cells
            grid = [render(CELLS)(i) % FIELD_PRIME for i in range(GRID_SIZE)]
            assert [cell.value for cell in result] == grid
            assert {cell.owner for cell in result} == {0, OWNER}
            assert [cell.id for cell in result] == list(range(GRID_SIZE))

    class TestTokenURI:
        @staticmethod
        @pytest.mark.parametrize("cell", CELLS)
        async def test_should_return_token_uri(starksheet, cell):
            token_uri = (
                await starksheet.tokenURI((cell.id, 0)).call()
            ).result.token_uri
            data_uri = "".join([bytes.fromhex(hex(s)[2:]).decode() for s in token_uri])
            token_data = json.loads(data_uri.replace("data:application/json,", ""))
            assert token_data["name"] == f"Sheet1!{number_to_index(cell.id)}"
            svg = ET.fromstring(
                unquote(token_data["image"]).replace("data:image/svg+xml,", "")
            )
            with open(f"tests/tokens/token_{cell.id}.svg", "w") as f:
                f.write(unquote(token_data["image"]).replace("data:image/svg+xml,", ""))
            assert svg.findall("{http://www.w3.org/2000/svg}text")[0].text == str(
                render(CELLS)(cell.id)
            )
            assert (
                svg.findall("{http://www.w3.org/2000/svg}text")[1].text
                == f"Sheet1!{number_to_index(cell.id)}"
            )

        @staticmethod
        async def test_should_revert_when_token_does_not_exist(starksheet):
            with pytest.raises(Exception) as e:
                await starksheet.tokenURI((len(CELLS), 0)).call()
            message = re.search(r"Error message: (.*)", e.value.message)[1]  # type: ignore
            assert message == f"ERC721: tokenURI query for nonexistent token"

    class TestSetMerkleRoot:
        @staticmethod
        async def test_should_revert_when_caller_is_not_owner(starksheet):

            with pytest.raises(Exception) as e:
                await starksheet.setMerkleRoot(0).invoke(caller_address=OTHER)
            message = re.search(r"Error message: (.*)", e.value.message)[1]  # type: ignore
            assert message == "Ownable: caller is not the owner"

        @staticmethod
        async def test_should_set_merkle_root(starksheet):
            merkle_root = 1234
            await starksheet.setMerkleRoot(merkle_root).invoke(caller_address=OWNER)
            result = (await starksheet.getMerkleRoot().call()).result
            assert result.root == merkle_root

    class TestMintPublic:
        @staticmethod
        async def test_should_revert_when_caller_is_not_in_allow_list(starksheet):
            with pytest.raises(Exception) as e:
                await starksheet.mintPublic((0, 0), []).invoke(
                    caller_address=(OTHER + 1)
                )
            message = re.search(r"Error message: (.*)", e.value.message)[1]  # type: ignore
            assert message == "mint: proof is not valid"

        @staticmethod
        async def test_should_mint_public_token_and_revert_second_mint(starksheet):
            token_id = (len(CELLS) + 1, 0)
            await starksheet.mintPublic(token_id, [LEAFS[0]]).invoke(
                caller_address=OTHER
            )
            owner = await starksheet.ownerOf(token_id).call()
            assert OTHER == owner.result.owner
            with pytest.raises(Exception) as e:
                await starksheet.mintPublic(token_id, [LEAFS[0]]).invoke(
                    caller_address=OTHER
                )
            message = re.search(r"Error message: (.*)", e.value.message)[1]  # type: ignore
            assert message == "mint: token already claimed"
