import logging
import string

from starkware.crypto.signature.signature import pedersen_hash

from constants import N_COLS

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def number_to_index(n):
    row = n // N_COLS
    col = n % N_COLS
    return string.ascii_uppercase[col] + str(row + 1)


def hash2(x, y):
    return pedersen_hash(x, y) if x <= y else pedersen_hash(y, x)


def merkle_root(leafs):
    if len(leafs) == 1:
        return leafs[0]
    if len(leafs) % 2 == 1:
        leafs.append(leafs[-1])
    return merkle_root([hash2(x, y) for x, y in zip(leafs[::2], leafs[1::2])])


def address_to_leaf(address):
    return hash2(address, address)


def merkle_proof(address, addresses):
    """
    Returns the merkle proof for the given address belonging to the given list of addresses.
    """
    if address not in addresses:
        raise ValueError("Address not in addresses")
    leafs = [address_to_leaf(address) for address in addresses]
    if len(leafs) % 2 == 1:
        leafs.append(leafs[-1])
    index = addresses.index(address)
    proof = [leafs[(index + 1) if (index % 2 == 0) else (index - 1)]]

    while len(leafs) > 1:
        leafs = [hash2(x, y) for x, y in zip(leafs[::2], leafs[1::2])]
        if len(leafs) == 1:
            break
        if len(leafs) % 2 == 1:
            leafs.append(leafs[-1])
        index = index // 2
        proof.append(leafs[(index + 1) if (index % 2 == 0) else (index - 1)])

    return proof


def merkle_proofs(addresses):
    return {address: merkle_proof(address, addresses) for address in addresses}


def merkle_verify(leaf, root, proof):
    """
    Verifies the given merkle proof for the given address.
    """
    if len(proof) == 0:
        return leaf == root
    return merkle_verify(hash2(proof[0], leaf), root, proof[1:])
