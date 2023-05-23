import json
import random
import re
import xml.etree.ElementTree as ET
from collections import namedtuple
from urllib.parse import unquote

import numpy as np
import pytest
import pytest_asyncio
from starkware.crypto.signature.signature import FIELD_PRIME
from starkware.starknet.compiler.compile import compile_starknet_files
from starkware.starknet.public.abi import get_selector_from_name
from starkware.starknet.testing.starknet import Starknet, StarknetContract
from utils.constants import ACCOUNT_ADDRESS, ALLOW_LIST, CONTRACTS, SOURCE_DIR
from utils.merkle_proof import (
    address_to_leaf,
    merkle_proof,
    merkle_root,
    number_to_index,
)

Cell = namedtuple("Cell", ["contract_address", "id", "value", "calldata"])
random.seed(0)
OWNER = int(ACCOUNT_ADDRESS, 16)


def _div(l_len, *l):
    return l[0] // l[1]


def _sub(l_len, *l):
    return l[0] - l[1]


def _prod(l_len, *l):
    return np.prod(l)


def _sum(l_len, *l):
    return np.sum(l)


GRID_SIZE = 15 * 15
OTHER = OWNER + 1
LEAFS = [address_to_leaf(address) for address in ALLOW_LIST]
MERKLE_ROOT = merkle_root(LEAFS)
MAX_PER_WALLET = 10
FUNCTIONS = {
    get_selector_from_name(ops.__name__[1:]): ops for ops in [_sum, _prod, _div, _sub]
}
NAME = "Sheet 1"
SYMBOL = "SHT1"
RC_BOUND = 2**128


def render(cells):
    def _render(i):
        if i >= len(cells):
            return 0
        cell = cells[i]
        if cell.contract_address == RC_BOUND:
            return cell.value
        return FUNCTIONS[cell.value](
            *[_render(d >> 1) if d & 1 else d >> 1 for d in cell.calldata]
        )

    return _render


def dependencies_to_calldata(dependencies):
    return [len(dependencies) << 1, *[d << 1 + 1 for d in dependencies]]


@pytest.fixture(scope="session")
def cells(math):
    _cells = []
    for id in range(10):
        dependencies = (
            random.sample(list(range(id - 1)), k=random.randint(0, id - 1))
            if id > 0
            else []
        )
        if id < 2:
            value = random.sample(
                [get_selector_from_name(ops.__name__) for ops in [_sum, _prod]], k=1
            )[0]
        else:
            value = random.sample(list(FUNCTIONS.keys()), k=1)[0]
        contract_address = math.contract_address
        if not dependencies:
            value = random.randint(0, 2**16 - 1)
            contract_address = RC_BOUND
        if value in [get_selector_from_name(ops.__name__[1:]) for ops in [_div, _sub]]:
            dependencies = random.sample(list(range(id)), k=2)
        _cells.append(
            Cell(
                contract_address,
                id,
                value,
                dependencies_to_calldata(dependencies),
            )
        )

        try:
            rendered = render(_cells)(id)
            while rendered > 2**64 - 1:
                dependencies.pop()
                _cells[-1] = Cell(
                    contract_address,
                    id,
                    value,
                    dependencies_to_calldata(dependencies),
                )
                rendered = render(_cells)(id)
        except ZeroDivisionError:
            dependencies[-1] = 1
            _cells[-1] = Cell(
                contract_address,
                id,
                value,
                dependencies_to_calldata(dependencies),
            )
    return _cells


@pytest_asyncio.fixture(scope="session")
async def sheet(starknet: Starknet, renderer, cells) -> StarknetContract:
    _sheet = await starknet.deploy(
        contract_class=compile_starknet_files(
            [str(CONTRACTS["Sheet"])],
            debug_info=True,
            disable_hint_validation=True,
            cairo_path=[str(SOURCE_DIR)],
        ),
        constructor_calldata=[],
    )
    await _sheet.initialize(
        int(NAME.encode().hex(), 16),  # name
        int(SYMBOL.encode().hex(), 16),  # symbol
        OWNER,  # owner
        MERKLE_ROOT,  # merkle_root
        MAX_PER_WALLET,  # max_per_wallet
        renderer.contract_address,  # renderer_address
    ).execute(caller_address=OWNER)
    for cell in cells:
        await _sheet.mintOwner(OWNER, (cell.id, 0)).execute(caller_address=OWNER)
        await _sheet.setCell(
            cell.id,
            cell.contract_address,
            cell.value,
            cell.calldata,
        ).execute(caller_address=OWNER)
    return _sheet


@pytest.mark.asyncio
class TestSheet:
    class TestGetCell:
        @staticmethod
        async def test_should_return_zero_when_token_does_not_exist(sheet, cells):
            with pytest.raises(Exception) as e:
                await sheet.ownerOf((0, len(cells))).call()
            message = re.search(r"Error message: (.*)", e.value.message)[1]  # type: ignore
            assert message == "ERC721: owner query for nonexistent token"
            cell = (await sheet.getCell(len(cells)).call()).result
            assert cell.cell_calldata == []
            assert cell.value == 0
            assert cell.contractAddress == 2**128

        @staticmethod
        async def test_should_return_cell_value_when_token_exists(sheet, cells):
            for cell in cells:
                result = (await sheet.getCell(cell.id).call()).result
                assert result.value == cell.value
                assert result.cell_calldata == cell.calldata

    class TestSetCell:
        @staticmethod
        async def test_should_revert_when_token_does_not_exist(sheet, cells):
            with pytest.raises(Exception) as e:
                await sheet.setCell(len(cells), 0, 0, []).execute(caller_address=OWNER)
            message = re.search(r"Error message: (.*)", e.value.message)[1]  # type: ignore
            assert message == f"setCell: tokenId does not exist"

        @staticmethod
        async def test_should_revert_when_caller_is_not_owner(sheet, cells):
            with pytest.raises(Exception) as e:
                await sheet.setCell(
                    0,
                    cells[0].id,
                    cells[0].value,
                    cells[0].calldata,
                ).execute(caller_address=OTHER)
            message = re.search(r"Error message: (.*)", e.value.message)[1]  # type: ignore
            assert message == "setCell: caller is not owner"

        @staticmethod
        async def test_should_set_value_and_dependencies(sheet, cells):
            """
            Testing getter and setter by writing and retrieving the value leads to duplicated tests.
            However, we keep it here as well to clarify what is tested for the both.
            """
            for cell in cells:
                result = (await sheet.getCell(cell.id).call()).result
                assert result.value == cell.value
                assert result.cell_calldata == cell.calldata

    class TestRenderCell:
        @staticmethod
        async def test_should_return_rendered_cell_value(sheet, cells):
            for cell in cells:
                result = (await sheet.renderCell(cell.id).call()).result.cell
                assert result.value == render(cells)(cell.id) % FIELD_PRIME
                assert result.id == cell.id
                assert result.owner == OWNER

    class TestRenderGrid:
        @staticmethod
        async def test_should_return_rendered_grid(sheet, cells):
            result = (await sheet.renderGrid().call()).result.cells
            grid = [render(cells)(i) % FIELD_PRIME for i in range(len(cells))]
            assert [cell.value for cell in result] == grid
            assert {cell.owner for cell in result} == {OWNER}
            assert [cell.id for cell in result] == list(range(len(cells)))

    class TestTokenURI:
        @staticmethod
        async def test_should_return_token_uri(sheet, cells):
            for cell in cells:
                token_uri = (await sheet.tokenURI((cell.id, 0)).call()).result.token_uri
                data_uri = "".join(
                    [bytes.fromhex(hex(s)[2:]).decode() for s in token_uri]
                )
                token_data = json.loads(data_uri.replace("data:application/json,", ""))
                assert token_data["name"] == f"{NAME}!{number_to_index(cell.id)}"
                svg = ET.fromstring(
                    unquote(token_data["image"]).replace("data:image/svg+xml,", "")
                )
                with open(f"tests/tokens/token_{cell.id}.svg", "w") as f:
                    f.write(
                        unquote(token_data["image"]).replace("data:image/svg+xml,", "")
                    )
                assert svg.findall("{http://www.w3.org/2000/svg}text")[0].text == str(
                    render(cells)(cell.id)
                )
                assert (
                    svg.findall("{http://www.w3.org/2000/svg}text")[1].text
                    == f"{NAME}!{number_to_index(cell.id)}"
                )

        @staticmethod
        async def test_should_revert_when_token_does_not_exist(sheet, cells):
            with pytest.raises(Exception) as e:
                await sheet.tokenURI((len(cells), 0)).call()
            message = re.search(r"Error message: (.*)", e.value.message)[1]  # type: ignore
            assert message == f"ERC721: tokenURI query for nonexistent token"

    class TestSetMerkleRoot:
        @staticmethod
        async def test_should_revert_when_caller_is_not_owner(sheet):
            with pytest.raises(Exception) as e:
                await sheet.setMerkleRoot(0).execute(caller_address=OTHER)
            message = re.search(r"Error message: (.*)", e.value.message)[1]  # type: ignore
            assert message == "Ownable: caller is not the owner"

    class TestMintPublic:
        @staticmethod
        async def test_should_revert_when_caller_is_not_in_allow_list(sheet):
            other = sorted(ALLOW_LIST)[-1] + 1
            with pytest.raises(Exception) as e:
                await sheet.mintPublic((0, 0), []).execute(caller_address=other)
            message = re.search(r"Error message: (.*)", e.value.message)[1]  # type: ignore
            assert message == f"mint: {other - FIELD_PRIME} is not allowed"

        @staticmethod
        async def test_should_mint_public_token_up_to_max_per_wallet(sheet, cells):
            token_id = (len(cells) + 1, 0)
            caller = [address for address in ALLOW_LIST if address != OWNER][0]
            proof = merkle_proof(caller, ALLOW_LIST)
            await sheet.mintPublic(token_id, proof).execute(caller_address=caller)
            owner = await sheet.ownerOf(token_id).call()
            assert caller == owner.result.owner
            max_per_wallet = 1
            await sheet.setMaxPerWallet(max_per_wallet).execute(caller_address=OWNER)
            with pytest.raises(Exception) as e:
                await sheet.mintPublic(token_id, proof).execute(caller_address=caller)
            message = re.search(r"Error message: (.*)", e.value.message)[1]  # type: ignore
            assert message == f"mint: user {caller} exceeds allocation {max_per_wallet}"
            await sheet.setMaxPerWallet(MAX_PER_WALLET).execute(caller_address=OWNER)

        @staticmethod
        async def test_should_mint_public_token_when_no_wl(sheet, cells):
            token_id = (len(cells) + 2, 0)
            await sheet.setMerkleRoot(0).execute(caller_address=OWNER)
            await sheet.mintPublic(token_id, []).execute(caller_address=OTHER + 1)
            owner = await sheet.ownerOf(token_id).call()
            assert OTHER + 1 == owner.result.owner
            await sheet.setMerkleRoot(MERKLE_ROOT).execute(caller_address=OWNER)

        @staticmethod
        async def test_should_mint_with_default_contract_address_and_value(
            sheet, cells
        ):
            token_id = (len(cells) + 3, 0)
            await sheet.setMerkleRoot(0).execute(caller_address=OWNER)
            await sheet.mintPublic(token_id, []).execute(caller_address=OTHER + 1)
            cell = (await sheet.getCell(token_id[0]).call()).result
            assert cell.value == 0
            assert cell.contractAddress == 2**128
            assert cell.cell_calldata == []
