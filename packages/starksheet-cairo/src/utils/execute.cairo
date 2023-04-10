%lang starknet

from starkware.cairo.common.math import signed_div_rem
from starkware.cairo.common.math_cmp import RC_BOUND

@view
func all(arr_len: felt, arr: felt*) -> (arr_len: felt, arr: felt*) {
    return (arr_len, arr);
}
