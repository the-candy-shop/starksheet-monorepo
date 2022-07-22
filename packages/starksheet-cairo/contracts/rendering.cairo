%lang starknet

from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.math import unsigned_div_rem, sign, abs_value
from starkware.cairo.common.math_cmp import is_le
from starkware.cairo.common.cairo_builtins import HashBuiltin

from contracts.constants import N_COLS

# Copied from topology-gg/caistring
# Convert felt (decimal integer) into ascii-encoded felt representing str(felt); return a literal
# e.g. 7 => interpreted as '7', return 55
# e.g. 77 => interpreted as '77', return 55*256 + 55 = 14135
# fail if needed more than 31 characters
#
func str{range_check_ptr}(num : felt) -> (literal : felt):
    alloc_locals

    if num == 0:
        return ('0')
    end

    let (arr_ascii) = alloc()
    let (num_abs) = abs_value(num)
    let (arr_ascii_len : felt) = _recurse_ascii_array_from_number(
        remain=num_abs, arr_ascii_len=0, arr_ascii=arr_ascii
    )

    let (s) = sign(num)
    local init
    if s == -1:
        init = '-'
    else:
        init = ''
    end

    let (ascii) = _recurse_ascii_from_ascii_array_inverse(
        ascii=init, len=arr_ascii_len, arr=arr_ascii, idx=0
    )

    return (ascii)
end

@view
func number_to_index{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    token_id : felt
) -> (res : felt):
    alloc_locals
    let (local row, local col) = unsigned_div_rem(token_id, N_COLS)
    local letter = 'A' + col
    let (number) = str(row + 1)
    local shift
    let (_row_single_digit) = is_le(number, '9')
    if _row_single_digit == 1:
        shift = 256
    else:
        shift = 256 * 256
    end
    let res = letter * shift + number
    return (res)
end

#
# Get ascii in decimal value from given digit
# note: does not check if input is indeed a digit
#
func _ascii_from_digit(digit : felt) -> (ascii : felt):
    return (digit + '0')
end

func _recurse_ascii_array_from_number{range_check_ptr}(
    remain : felt, arr_ascii_len : felt, arr_ascii : felt*
) -> (arr_ascii_final_len : felt):
    alloc_locals

    if remain == 0:
        return (arr_ascii_len)
    end

    let (remain_nxt, digit) = unsigned_div_rem(remain, 10)
    let (ascii) = _ascii_from_digit(digit)
    assert arr_ascii[arr_ascii_len] = ascii

    #
    # Tail recursion
    #
    let (arr_ascii_final_len) = _recurse_ascii_array_from_number(
        remain=remain_nxt, arr_ascii_len=arr_ascii_len + 1, arr_ascii=arr_ascii
    )
    return (arr_ascii_final_len)
end

func _recurse_ascii_from_ascii_array_inverse{range_check_ptr}(
    ascii : felt, len : felt, arr : felt*, idx : felt
) -> (ascii_final : felt):
    if idx == len:
        return (ascii)
    end

    let ascii_nxt = ascii * 256 + arr[len - idx - 1]

    #
    # Tail recursion
    #
    let (ascii_final) = _recurse_ascii_from_ascii_array_inverse(
        ascii=ascii_nxt, len=len, arr=arr, idx=idx + 1
    )
    return (ascii_final)
end

@view
func Starksheet_render_token_uri{pedersen_ptr : HashBuiltin*, syscall_ptr : felt*, range_check_ptr}(
    token_id : felt, value : felt
) -> (token_uri_len : felt, token_uri : felt*):
    alloc_locals
    let (local cell_index_ascii) = number_to_index(token_id)
    let (local value_ascii) = str(value)
    let (token_uri) = alloc()
    assert [token_uri + 0] = 'data:application/json,{"descrip'
    assert [token_uri + 1] = 'tion": "Starksheet", "name": "S'
    assert [token_uri + 2] = 'heet1!'
    assert [token_uri + 3] = cell_index_ascii
    assert [token_uri + 4] = '", "image": "data:image/svg+xml'
    assert [token_uri + 5] = ',%3Csvg%20width%3D%2789%27%20he'
    assert [token_uri + 6] = 'ight%3D%2755%27%20viewBox%3D%27'
    assert [token_uri + 7] = '0%200%2089%2055%27%20fill%3D%27'
    assert [token_uri + 8] = 'none%27%20xmlns%3D%27http%3A//w'
    assert [token_uri + 9] = 'ww.w3.org/2000/svg%27%3E%3Crect'
    assert [token_uri + 10] = '%20width%3D%2789%27%20height%3D'
    assert [token_uri + 11] = '%2755%27%20fill%3D%27%23E5E5E5%'
    assert [token_uri + 12] = '27%20/%3E%3Crect%20width%3D%278'
    assert [token_uri + 13] = '9%27%20height%3D%2755%27%20fill'
    assert [token_uri + 14] = '%3D%27%2329296E%27%20/%3E%3Crec'
    assert [token_uri + 15] = 't%20x%3D%275.5%27%20y%3D%275.5%'
    assert [token_uri + 16] = '27%20width%3D%2778%27%20height%'
    assert [token_uri + 17] = '3D%2744%27%20fill%3D%27%230000F'
    assert [token_uri + 18] = 'F%27%20/%3E%3Ctext%20text-ancho'
    assert [token_uri + 19] = 'r%3D%27middle%27%20x%3D%2744.5%'
    assert [token_uri + 20] = '27%20y%3D%2731%27%20fill%3D%27%'
    assert [token_uri + 21] = '20white%27%20font-family%3D%27P'
    assert [token_uri + 22] = 'ress%20Start%202P%27%20font-siz'
    assert [token_uri + 23] = 'e%3D%2712%27%3E'
    assert [token_uri + 24] = value_ascii
    assert [token_uri + 25] = '%3C/text%3E%3Crect%20x%3D%275.5'
    assert [token_uri + 26] = '%27%20y%3D%275.5%27%20width%3D%'
    assert [token_uri + 27] = '2778%27%20height%3D%2744%27%20s'
    assert [token_uri + 28] = 'troke%3D%27%23FF4F0A%27%20strok'
    assert [token_uri + 29] = 'e-width%3D%273%27%20/%3E%3Crect'
    assert [token_uri + 30] = '%20x%3D%2747%27%20y%3D%2745%27%'
    assert [token_uri + 31] = '20width%3D%2741%27%20height%3D%'
    assert [token_uri + 32] = '278%27%20fill%3D%27%23FF4F0A%27'
    assert [token_uri + 33] = '%20/%3E%3Ctext%20text-anchor%3D'
    assert [token_uri + 34] = '%27end%27%20x%3D%2786%27%20y%3D'
    assert [token_uri + 35] = '%2752%27%20fill%3D%27%20white%2'
    assert [token_uri + 36] = '7%20font-family%3D%27Press%20St'
    assert [token_uri + 37] = 'art%202P%27%20font-size%3D%278%'
    assert [token_uri + 38] = '27%20letter-spacing%3D%270em%27'
    assert [token_uri + 39] = '%3ESheet1!'
    assert [token_uri + 40] = cell_index_ascii
    assert [token_uri + 41] = '%3C/text%3E%3C/svg%3E"}'
    let token_uri_len = 42
    return (token_uri_len, token_uri)
end
