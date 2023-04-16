import random

import pytest

from utils.merkle_proof import (
    address_to_leaf,
    merkle_proofs,
    merkle_root,
    merkle_verify,
)

random.seed(0)


@pytest.fixture
def allow_list():
    return [random.randint(0, 2**250) for _ in range(30)]


@pytest.fixture
def leafs(allow_list):
    return [address_to_leaf(address) for address in allow_list]


class TestUtils:
    class TestMerkleUtils:
        def test_utils_should_be_consistents(self, allow_list, leafs):
            root = merkle_root(leafs)
            proofs = merkle_proofs(allow_list)
            assert {
                merkle_verify(address_to_leaf(address), root, proofs[address])
                for address in allow_list
            } == {True}
