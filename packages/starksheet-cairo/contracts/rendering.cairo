%lang starknet

from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.math import unsigned_div_rem, sign, abs_value
from starkware.cairo.common.cairo_builtins import HashBuiltin

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
    let (local token_id_ascii) = str(token_id)
    let (local value_ascii) = str(value)
    let token_uri_len = 43
    let (token_uri) = alloc()
    let index = token_uri
    assert [index] = 'data:application/json,{"descrip'
    let index = index + 1
    assert [index] = 'tion": "Starksheet", "name": "S'
    let index = index + 1
    assert [index] = 'heet1!'
    let index = index + 1
    assert [index] = token_id_ascii
    let index = index + 1
    assert [index] = '", "image": "data:image/svg+xml'
    let index = index + 1
    assert [index] = ',%3Csvg%20width%3D%2789%27%20he'
    let index = index + 1
    assert [index] = 'ight%3D%2755%27%20viewBox%3D%27'
    let index = index + 1
    assert [index] = '0%200%2089%2055%27%20fill%3D%27'
    let index = index + 1
    assert [index] = 'none%27%20xmlns%3D%27http%3A//w'
    let index = index + 1
    assert [index] = 'ww.w3.org/2000/svg%27%3E%3Crect'
    let index = index + 1
    assert [index] = '%20width%3D%2789%27%20height%3D'
    let index = index + 1
    assert [index] = '%2755%27%20fill%3D%27%23E5E5E5%'
    let index = index + 1
    assert [index] = '27/%3E%3Crect%20width%3D%2789%2'
    let index = index + 1
    assert [index] = '7%20height%3D%2755%27%20fill%3D'
    let index = index + 1
    assert [index] = '%27%2329296E%27/%3E%3Crect%20x%'
    let index = index + 1
    assert [index] = '3D%275.5%27%20y%3D%275.5%27%20w'
    let index = index + 1
    assert [index] = 'idth%3D%2778%27%20height%3D%274'
    let index = index + 1
    assert [index] = '4%27%20fill%3D%27%230000FF%27/%'
    let index = index + 1
    assert [index] = '3E%3Ctext%20text-anchor%3D%27mi'
    let index = index + 1
    assert [index] = 'ddle%27%20x%3D%2744.5%27%20y%3D'
    let index = index + 1
    assert [index] = '%2731%27%20fill%3D%27white%27%2'
    let index = index + 1
    assert [index] = '0font-family%3D%27Press%20Start'
    let index = index + 1
    assert [index] = '%202P%27%20font-size%3D%2712%27'
    let index = index + 1
    assert [index] = '%20letter-spacing%3D%270em%27%3'
    let index = index + 1
    assert [index] = 'E'
    let index = index + 1
    assert [index] = value_ascii
    let index = index + 1
    assert [index] = '%3C/text%3E%3Crect%20x%3D%2778%'
    let index = index + 1
    assert [index] = '27%20y%3D%2745%27%20width%3D%27'
    let index = index + 1
    assert [index] = '9%27%20height%3D%278%27%20fill%'
    let index = index + 1
    assert [index] = '3D%27%23FF4F0A%27/%3E%3Crect%20'
    let index = index + 1
    assert [index] = 'x%3D%275.5%27%20y%3D%275.5%27%2'
    let index = index + 1
    assert [index] = '0width%3D%2778%27%20height%3D%2'
    let index = index + 1
    assert [index] = '744%27%20stroke%3D%27%23FF4F0A%'
    let index = index + 1
    assert [index] = '27%20stroke-width%3D%273%27/%3E'
    let index = index + 1
    assert [index] = '%3Cpath%20d%3D%27M81.4286%2051V'
    let index = index + 1
    assert [index] = '50.4286H81V49.8571H81.8571V50.4'
    let index = index + 1
    assert [index] = '286H83.1429V49.2857H81.4286V48.'
    let index = index + 1
    assert [index] = '7143H81V47.5714H81.4286V47H83.5'
    let index = index + 1
    assert [index] = '714V47.5714H84V48.1429H83.1429V'
    let index = index + 1
    assert [index] = '47.5714H81.8571V48.7143H83.5714'
    let index = index + 1
    assert [index] = 'V49.2857H84V50.4286H83.5714V51H'
    let index = index + 1
    assert [index] = '81.4286Z%27%20fill%3D%27%230000'
    let index = index + 1
    assert [index] = 'FF%27/%3E%3C/svg%3E"}'
    let index = index + 1

    return (token_uri_len, token_uri)
end
