%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.cairo.common.hash import hash2
from starkware.cairo.common.uint256 import Uint256
from starkware.cairo.common.math_cmp import is_le_felt
from starkware.cairo.common.math import unsigned_div_rem
from starkware.cairo.common.alloc import alloc
from openzeppelin.utils.constants import TRUE

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

func merkle_build{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    leafs_len : felt, leafs : felt*
) -> (res : felt):
    alloc_locals
    if leafs_len == 1:
        return ([leafs])
    end
    let (local new_leafs) = alloc()
    _merkle_build_body{new_leafs=new_leafs, leafs=leafs, stop=leafs_len}(0)

    let (q, r) = unsigned_div_rem(leafs_len, 2)
    return merkle_build(q + r, new_leafs)
end

func _merkle_build_body{
    syscall_ptr : felt*,
    pedersen_ptr : HashBuiltin*,
    range_check_ptr,
    new_leafs : felt*,
    leafs : felt*,
    stop : felt,
}(i : felt):
    let (stop_loop) = is_le_felt(stop, i)
    if stop_loop == TRUE:
        return ()
    end
    if i == stop - 1:
        let (n) = hash2{hash_ptr=pedersen_ptr}([leafs + i], [leafs + i])
        tempvar range_check_ptr = range_check_ptr
    else:
        let (n) = hash2{hash_ptr=pedersen_ptr}([leafs + i], [leafs + i + 1])
        tempvar range_check_ptr = range_check_ptr
    end
    assert [new_leafs + i / 2] = n
    return _merkle_build_body(i + 2)
end

func addresses_to_leafs{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    allow_list_len : felt, allow_list : felt*
) -> (leafs_len : felt, leafs : felt*):
    alloc_locals
    let (local leafs) = alloc()
    _addresses_to_leafs_body{leafs=leafs, allow_list=allow_list, stop=allow_list_len}(0)
    return (allow_list_len, leafs)
end

func _addresses_to_leafs_body{
    syscall_ptr : felt*,
    pedersen_ptr : HashBuiltin*,
    range_check_ptr,
    leafs : felt*,
    allow_list : felt*,
    stop : felt,
}(i : felt):
    if i == stop:
        return ()
    end
    let (n) = hash2{hash_ptr=pedersen_ptr}([allow_list + i], [allow_list + i])
    assert [leafs + i] = n
    return _addresses_to_leafs_body(i + 1)
end
