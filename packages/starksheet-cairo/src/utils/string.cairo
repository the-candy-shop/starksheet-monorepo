%lang starknet

from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.math import unsigned_div_rem, sign, abs_value
from starkware.cairo.common.math_cmp import is_le
from starkware.cairo.common.cairo_builtins import HashBuiltin

// Copied from topology-gg/caistring
// Convert felt (decimal integer) into ascii-encoded felt representing str(felt); return a literal
// e.g. 7 => interpreted as '7', return 55
// e.g. 77 => interpreted as '77', return 55*256 + 55 = 14135
// fail if needed more than 31 characters
func str{range_check_ptr}(num: felt) -> (literal: felt) {
    alloc_locals;

    if (num == 0) {
        return ('0',);
    }

    let (arr_ascii) = alloc();
    let num_abs = abs_value(num);
    let (arr_ascii_len: felt) = _recurse_ascii_array_from_number(
        remain=num_abs, arr_ascii_len=0, arr_ascii=arr_ascii
    );

    let s = sign(num);
    local init;
    if (s == -1) {
        init = '-';
    } else {
        init = '';
    }

    let (ascii) = _recurse_ascii_from_ascii_array_inverse(
        ascii=init, len=arr_ascii_len, arr=arr_ascii, idx=0
    );

    return (ascii,);
}

//
// Get ascii in decimal value from given digit
// note: does not check if input is indeed a digit
//
func _ascii_from_digit(digit: felt) -> (ascii: felt) {
    return (digit + '0',);
}

func _recurse_ascii_array_from_number{range_check_ptr}(
    remain: felt, arr_ascii_len: felt, arr_ascii: felt*
) -> (arr_ascii_final_len: felt) {
    alloc_locals;

    if (remain == 0) {
        return (arr_ascii_len,);
    }

    let (remain_nxt, digit) = unsigned_div_rem(remain, 10);
    let (ascii) = _ascii_from_digit(digit);
    assert arr_ascii[arr_ascii_len] = ascii;

    //
    // Tail recursion
    //
    let (arr_ascii_final_len) = _recurse_ascii_array_from_number(
        remain=remain_nxt, arr_ascii_len=arr_ascii_len + 1, arr_ascii=arr_ascii
    );
    return (arr_ascii_final_len,);
}

func _recurse_ascii_from_ascii_array_inverse{range_check_ptr}(
    ascii: felt, len: felt, arr: felt*, idx: felt
) -> (ascii_final: felt) {
    if (idx == len) {
        return (ascii,);
    }

    let ascii_nxt = ascii * 256 + arr[len - idx - 1];

    //
    // Tail recursion
    //
    let (ascii_final) = _recurse_ascii_from_ascii_array_inverse(
        ascii=ascii_nxt, len=len, arr=arr, idx=idx + 1
    );
    return (ascii_final,);
}
