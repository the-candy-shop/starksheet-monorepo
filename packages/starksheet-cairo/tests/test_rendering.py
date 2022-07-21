import json
import xml.etree.ElementTree as ET
from urllib.parse import unquote

import pytest
import pytest_asyncio
from starkware.starknet.compiler.compile import compile_starknet_files
from starkware.starknet.testing.starknet import Starknet, StarknetContract

from constants import CONTRACTS, N_COLS, N_ROWS
from utils import number_to_index


@pytest_asyncio.fixture(scope="session")
async def rendering(starknet: Starknet) -> StarknetContract:
    return await starknet.deploy(
        contract_class=compile_starknet_files(
            [str(CONTRACTS["rendering"])],
            debug_info=True,
            disable_hint_validation=True,
        ),
        constructor_calldata=[],
    )


@pytest.mark.asyncio
class TestRendering:
    class TestRenderTokenUri:
        @staticmethod
        async def test_should_return_data_uri(rendering):
            token_id = 10
            value = 2**100
            token_uri = (
                await rendering.Starksheet_render_token_uri(token_id, value).call()
            ).result.token_uri
            data_uri = "".join([bytes.fromhex(hex(s)[2:]).decode() for s in token_uri])
            token_data = json.loads(data_uri.replace("data:application/json,", ""))
            assert token_data["name"] == f"Sheet1!{number_to_index(token_id)}"
            svg = ET.fromstring(
                unquote(token_data["image"]).replace("data:image/svg+xml,", "")
            )
            assert svg.findall("{http://www.w3.org/2000/svg}text")[0].text == str(value)

    class TestNumberToIndex:
        @staticmethod
        @pytest.mark.parametrize("n", [0, N_COLS - 1, N_COLS, N_COLS * N_ROWS - 1])
        async def test_should_return_index(rendering, n):
            index = await rendering.number_to_index(n).call()
            assert bytes.fromhex(hex(index.result.res)[2:]).decode() == number_to_index(
                n
            )
