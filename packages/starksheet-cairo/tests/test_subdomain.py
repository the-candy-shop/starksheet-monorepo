import pytest
from utils.starknet_id import BASIC_ALPHABET, encode_domain


@pytest.mark.asyncio
class TestSubdomain:
    class TestBasicEncoding:
        @staticmethod
        @pytest.mark.parametrize("domain_len", range(1, 16))
        async def test_should_return_encoded_ascii_domain(subdomain, domain_len):
            # Using last chars to have letters, numbers and -
            domain = BASIC_ALPHABET[-domain_len:]
            assert (
                await subdomain.basic_encoding(
                    int.from_bytes(domain.encode(), "big")
                ).call()
            ).result.domain_encoded == encode_domain(domain)
