%lang starknet

from starkware.cairo.common.math import signed_div_rem
from starkware.cairo.common.math_cmp import RC_BOUND

@view
func sum(arr_len : felt, arr : felt*) -> (res : felt):
    if arr_len == 0:
        return (0)
    end

    let (sum_of_rest) = sum(arr_len=arr_len - 1, arr=arr + 1)
    return ([arr] + sum_of_rest)
end

@view
func prod(arr_len : felt, arr : felt*) -> (res : felt):
    if arr_len == 0:
        return (1)
    end

    let (prod_of_rest) = prod(arr_len=arr_len - 1, arr=arr + 1)
    return ([arr] * prod_of_rest)
end

@view
func div{range_check_ptr}(arr_len : felt, arr : felt*) -> (res : felt):
    with_attr error_message("div only works with 2 arguments, {arr_len} given"):
        assert arr_len = 2
    end
    let (q, r) = signed_div_rem(arr[0], arr[1], RC_BOUND / 2)
    return (q)
end

@view
func sub(arr_len : felt, arr : felt*) -> (res : felt):
    with_attr error_message("sub only works with 2 arguments, {arr_len} given"):
        assert arr_len = 2
    end
    return (arr[0] - arr[1])
end
