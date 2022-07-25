%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.cairo.common.hash import hash2
from starkware.cairo.common.uint256 import Uint256
from starkware.cairo.common.math_cmp import is_le_felt

# verifies a merkle proof
func merkle_verify{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    leaf : felt, root : felt, proof_len : felt, proof : felt*
) -> (res : felt):
    let (calc_root) = _merkle_verify_body(leaf, proof_len, proof)
    # check if calculated root is equal to expected
    if calc_root == root:
        return (1)
    else:
        return (0)
    end
end

# calculates the merkle root of a given proof
func _merkle_verify_body{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    curr : felt, proof_len : felt, proof : felt*
) -> (res : felt):
    alloc_locals

    if proof_len == 0:
        return (curr)
    end

    local node
    local proof_elem = [proof]
    let (le) = is_le_felt(curr, proof_elem)

    if le == 1:
        let (n) = hash2{hash_ptr=pedersen_ptr}(curr, proof_elem)
        node = n
    else:
        let (n) = hash2{hash_ptr=pedersen_ptr}(proof_elem, curr)
        node = n
    end

    let (res) = _merkle_verify_body(node, proof_len - 1, proof + 1)
    return (res)
end
