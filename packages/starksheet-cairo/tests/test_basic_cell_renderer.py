import json
import xml.etree.ElementTree as ET
from urllib.parse import unquote

import pytest
from utils.constants import N_COLS, N_ROWS
from utils.merkle_proof import number_to_index


@pytest.mark.asyncio
class TestBasicCellRenderer:
    class TestTokenUri:
        @staticmethod
        async def test_should_return_data_uri(renderer):
            token_id = 10
            value = 2**100
            name = "Starksheet"
            token_uri = (
                await renderer.token_uri(
                    token_id, value, int(name.encode().hex(), 16)
                ).call()
            ).result.token_uri
            data_uri = "".join([bytes.fromhex(hex(s)[2:]).decode() for s in token_uri])
            token_data = json.loads(data_uri.replace("data:application/json,", ""))
            assert token_data["name"] == f"{name}!{number_to_index(token_id)}"
            svg = ET.fromstring(
                unquote(token_data["image"]).replace("data:image/svg+xml,", "")
            )
            assert svg.findall("{http://www.w3.org/2000/svg}text")[0].text == str(value)
            assert (
                svg.findall("{http://www.w3.org/2000/svg}text")[1].text
                == f"{name}!{number_to_index(token_id)}"
            )

    class TestNumberToIndex:
        @staticmethod
        @pytest.mark.parametrize("n", [0, N_COLS - 1, N_COLS, N_COLS * N_ROWS - 1])
        async def test_should_return_index(renderer, n):
            index = await renderer.number_to_index(n).call()
            assert bytes.fromhex(hex(index.result.res)[2:]).decode() == number_to_index(
                n
            )
