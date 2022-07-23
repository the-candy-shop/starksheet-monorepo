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
    assert [token_uri + 5] = ',%3Csvg%20viewBox%3D%270%200%20'
    assert [token_uri + 6] = '89%2055%27%20fill%3D%27none%27%'
    assert [token_uri + 7] = '20xmlns%3D%27http%3A//www.w3.or'
    assert [token_uri + 8] = 'g/2000/svg%27%3E%3Cdefs%3E%3Cst'
    assert [token_uri + 9] = 'yle%3E%40font-face%20%7Bfont-fa'
    assert [token_uri + 10] = 'mily%3A%20%27Press%20Start%202P'
    assert [token_uri + 11] = '%27%3Bsrc%3A%20url%28%27data%3A'
    assert [token_uri + 12] = 'font/woff2%3Bbase64%2Cd09GMgABA'
    assert [token_uri + 13] = 'AAAABL8AA8AAAAAR5wAABKgAAEAAAAA'
    assert [token_uri + 14] = 'AAAAAAAAAAAAAAAAAAAAAAAAP0ZGVE0'
    assert [token_uri + 15] = 'cGjAbMByCXgZgAINyEQgK8FTSaQuDRA'
    assert [token_uri + 16] = 'ABNgIkA4NMBCAFhzQHhFIb6DVlB0j1O'
    assert [token_uri + 17] = 'MBS3oOIStEbs///lJwcVrzGcO0gohLE'
    assert [token_uri + 18] = 'HMciiDCCNWiZga0ybSEUYTQOjKBp8Tl'
    assert [token_uri + 19] = 'szsDRd8qatXl30Xt0dZGFyR0VhDKwlb'
    assert [token_uri + 20] = 'tl%2BrsFCw9E1ndeYJts/7Rwb0VsxMq'
    assert [token_uri + 21] = 'WlcjjwTESz/Uhu/w3s3tkoImp44dQQh'
    assert [token_uri + 22] = 'WoEmT3uyRmptouSDkzWEA8v/926JKu9'
    assert [token_uri + 23] = 'Hoinn6s7ft3mIeGlw7Tqd7Eo2jFQxIv'
    assert [token_uri + 24] = 'jVBIJpV2iaObTzhWY21NtGgrht4pMK4'
    assert [token_uri + 25] = 'WUj4bLygT/Q%2BQLxy%2B3lH/6/kbuI'
    assert [token_uri + 26] = 'dDIr9DjrJIjo9Js6RMX%2BEk7BOTZkm'
    assert [token_uri + 27] = 'p9z4tURFRVfV0qHPDH7Ztb6Jaoa0hL3'
    assert [token_uri + 28] = 'Yuab2G3sfzr6Wv9E6y5ivp%2Bq5VLtB'
    assert [token_uri + 29] = 'jQDxGoSE0AP17b3df7larje%2Bsczkr'
    assert [token_uri + 30] = 'AtJ3KfW0J4%2BK23etKKUj85TaoWG4S'
    assert [token_uri + 31] = '4aXClBwCA2hgaAe%2B6X9oin20NbUJr'
    assert [token_uri + 32] = 'dFggQpIhmRGIM07/p%2Bw7ZpX1lG1jj'
    assert [token_uri + 33] = 'QxpsCQAB48qDEAPB4iP1/j9Y/Bahj5Y'
    assert [token_uri + 34] = 'CAN0/xqAWIhRajlniNeOP9nxC4ffy2U'
    assert [token_uri + 35] = 'iHC0NG8khooVzotY3DEAzAzA5kG753z'
    assert [token_uri + 36] = 'jHS5MnmXkiIjmTUM6UmM0%2BV4ivu/H'
    assert [token_uri + 37] = '7xj6Ff2/k44rxzdI2AAggBI/LHAk9Jz'
    assert [token_uri + 38] = '5UMIoLwU4AFET5rZFO3DMafUc0awsQC'
    assert [token_uri + 39] = 'HyIpUzTk0xJGJEOjNhqCkGEpIaSGOjq'
    assert [token_uri + 40] = 'NFm/WNCN5ickqCMnAAeVLMLeXg5iq8k'
    assert [token_uri + 41] = '6WRXZR2l3pB981BzsGZt2%2BVilCBr9'
    assert [token_uri + 42] = 'TIJgKgx6UBQDF%2BVjKDqNwAAIH8jiI'
    assert [token_uri + 43] = 'fMnu8KhfXKHoN3HcA4GrExhB2AUD/yZ'
    assert [token_uri + 44] = 'UMB8WTuyIA4DcOKed49y9PBIanBigsM'
    assert [token_uri + 45] = 'EN8Uk0vlTv0JX3N9MyZuTMv5seSWA5%'
    assert [token_uri + 46] = '2B8Ue8PDeTrdTgGIsVmN3cXVXjdcyRu'
    assert [token_uri + 47] = 'c448XffAvPns5u2ME1r%2BjG1p17vz8'
    assert [token_uri + 48] = 'IpOAnH4DBsgy3Q/T7k3dm/8F3B27sUi'
    assert [token_uri + 49] = 'HwFF1AOlh0UdnIDqINQdPcU91Exo/4b'
    assert [token_uri + 50] = 'RijjQipNN0zLdlzPD8IoTtIsL8qqbto'
    assert [token_uri + 51] = 'OQIQJZVxIpY11PsSUS219zLXPfd/Pvg'
    assert [token_uri + 52] = 'vWQ4crFM%2BWiuVqpdZoNdudXrc/GE2'
    assert [token_uri + 53] = 'MJ6en5ucWFiGc7Rt6OHvv5MgL%2BzDs'
    assert [token_uri + 54] = '5xDBwiaA1T3UHw2kcYC1/UfdS1fE1m7'
    assert [token_uri + 55] = 'v7B4e7e3PWHHxe3YO2H5%2BAPOZyeP0'
    assert [token_uri + 56] = '%2BQPeSBThy0xq9e62AHjaAUhBC/6AD'
    assert [token_uri + 57] = 'HLoGoOev6A%2BhgHsi1za8q5ZNMqjYl'
    assert [token_uri + 58] = 'WZMq8g5BHDUtISpWJsRoRTJVa0I0Z9W'
    assert [token_uri + 59] = 'TkSqVKsPz4dXjvHtdIhLnvptULC0u5B'
    assert [token_uri + 60] = 'VuyAMTKJQ90YKRgTnWiGkmqSEqKmrVh'
    assert [token_uri + 61] = 'RYgKk3TChbUW6qEoEcveWzhYSTL2HNp'
    assert [token_uri + 62] = 'g5E/mqQ99VVDgv3RGT5Xm3czhuL9rhX'
    assert [token_uri + 63] = 'd1a27/slQ0hiY6jd79aOZCtjoRhrb16'
    assert [token_uri + 64] = 'WVvQKrW4Gzxjxir28IMiz/qUDysIWp7'
    assert [token_uri + 65] = 'Qjfwe4zUd7aJsVQWQyRLUKHKBWy8WvE'
    assert [token_uri + 66] = 'VS3XMS56V3wWdOD%2BF8uv9dTwImKr/'
    assert [token_uri + 67] = 'PdbmWcwQvEfAajyuVjpxN2pOVcWi3l8'
    assert [token_uri + 68] = 'wEL/m9PpdoUIE6%2BPKX81PATmgeO0B'
    assert [token_uri + 69] = '1sGEH%2Bapz54fdmSJz37Ahf56jLw9u'
    assert [token_uri + 70] = 'nPE5dMK0%2B7TF9V8CCTfR9yfNsUI4t'
    assert [token_uri + 71] = 'UzFFB2nSn8KObjdDidULp4IJhswxxYQ'
    assert [token_uri + 72] = 'rYZd6NvCnU9MDX%2BReLnMTml1ZE9r0'
    assert [token_uri + 73] = 'kPw3N2gR%2BsjEsYmISpk5l1Is3YNaJ'
    assert [token_uri + 74] = 'Konzep7VcsT1nUkb4pHwKZAykaKoCPF'
    assert [token_uri + 75] = '0PomEhvIWXenoZvx6wOK10p1l2tThXy'
    assert [token_uri + 76] = '8P1eUwdsvSqQWvoBMtsgHQUJaGtIBsu'
    assert [token_uri + 77] = 'hawdPTZSxYprWuw4dzr1VGUtDIFXqro'
    assert [token_uri + 78] = 'MMiYsFx8WiT3dcWKo7mPULyqVWA9r0Y'
    assert [token_uri + 79] = 'tRJLbiWvjnL%2Brc4RdggbNQlQAAa2d'
    assert [token_uri + 80] = '0mab66MHDpt1CdwbkQCbS7PSDZMz7Fr'
    assert [token_uri + 81] = 'OQq1ecaS0JltdAlDRyAXqs6A0XbGpwH'
    assert [token_uri + 82] = 'gkp6urUwWAbrFM3uyMvNKl4MlCUHSyP'
    assert [token_uri + 83] = 'Am91waDEJ5YYQHuJM20KWRQsv7Hka3G'
    assert [token_uri + 84] = 'phlS2XDKqOKBEUGS1e0kc1o24IIAfHl'
    assert [token_uri + 85] = 'DIyBxXJJeggB3i8atVgCO0dDOZHJWYj'
    assert [token_uri + 86] = 'VLAjj9q7vVsEnrhK7EhLuBzBXmMgETc'
    assert [token_uri + 87] = 'E1cmaCivPKoJvfpFlyI5MpXB4EC%2BE'
    assert [token_uri + 88] = 'g/Ym04TxxC5NlsYktdoYQUel8bFsEl7'
    assert [token_uri + 89] = 'H4Z6sCwb/8bk4tXWFXPKjqTbRnd3nLW'
    assert [token_uri + 90] = 'p9OxIAplfKXgGhNlrD4b5JLZ6pUu4Ar'
    assert [token_uri + 91] = 'gVaM6ea5xDWBDGozpzFA7ngGtYc4HaA'
    assert [token_uri + 92] = 'wRiGUvcvSe6RAAw3ZWkVOFgvKF6IUil'
    assert [token_uri + 93] = 'MI9IdqQU4Q4XRdHHfsffQwp19UCJI0j'
    assert [token_uri + 94] = 'WsrT35oUx06xPrhG2q6ME3UO0lccZUs'
    assert [token_uri + 95] = 'TECQxJDRxTDKl3LIHr/abToshldfQxj'
    assert [token_uri + 96] = '6OWtRsFnifDCsG6t3kBo4NmBJmaUVTc'
    assert [token_uri + 97] = 'lyIQAJLjnr0B6Z8YFMn9k9ygp7RrxH6'
    assert [token_uri + 98] = 'vhwbJNAeKMUD659t8gFQJMSwe/CObHP'
    assert [token_uri + 99] = 'FvqHGFUNRf%2BsrEf3TXKBrZvgkci9i'
    assert [token_uri + 100] = 'rBmcD/tXagTGCXcNhC%2BO59uLpnfsy'
    assert [token_uri + 101] = 'oqLS1287ERwm8faeVOm8WcD78lZ6YB2'
    assert [token_uri + 102] = 'y98ZLlM9rUrd2LQNl2IVd4TrsvgQ960'
    assert [token_uri + 103] = 'y7usYe0hTPapWjqrl%2BX7xFeBNT%2B'
    assert [token_uri + 104] = '1ZdJJW%2BFxtW7XNwtcNzwag%2BRVej'
    assert [token_uri + 105] = 'mJh9emlIZKiiNciK8IUOM3UjJ7cBUNX'
    assert [token_uri + 106] = 'GPXS2lh%2BhwpgoH6VsHROcvEir3rXY'
    assert [token_uri + 107] = 'p4LwiCZw1vHlCb5R1Mhb5dSnO2mnoGZ'
    assert [token_uri + 108] = 'oXF1WeWGWmziJ1JUU4qPr0niJSlNBC1'
    assert [token_uri + 109] = 'ckKmJfWbXwUwutITzEmjwgpwaBu4dRP'
    assert [token_uri + 110] = 'ftj/N8ACRndak/FAgKgL70PXWx9vzkY'
    assert [token_uri + 111] = '2%2Bm45TsIkL07aopDNogh0SRbSZSO9'
    assert [token_uri + 112] = 'ztFWQj7nWLgbu6C%2BT7KjDqZ6gEnRw'
    assert [token_uri + 113] = 'gMx0kLZwyybQOvQA0w0Tx/5JBr/cYZd'
    assert [token_uri + 114] = 'SWOTjwDF6NoXkyj3VjHNGQINvBjZsJJ'
    assert [token_uri + 115] = '3wFaAQmoZWZYpAiaWOFnnhdURAvWkUz'
    assert [token_uri + 116] = 'wi0bgzZAXyoDUEqHcW0piELWOwqhw3e'
    assert [token_uri + 117] = 'vTxDIWrN2ISqRQQELAM26S4Hlr5HU/H'
    assert [token_uri + 118] = 'xJCChDBJkukcAW8VAT0gpTZTKNHgzDO'
    assert [token_uri + 119] = 'r41GQejO4gzAnkWpwFGRC3LbR1xzKCH'
    assert [token_uri + 120] = 'u6V5iFtgLpO8KQYmYeFxhL2d88sdiPj'
    assert [token_uri + 121] = '/v0kBzclQcyTsWf2MdE9ID8mXXWjrCK'
    assert [token_uri + 122] = '%2B5E2un3niveisRnriq1uHYMjjiiIE'
    assert [token_uri + 123] = '0KdfgMo1cGmkUrTbO05g2sv3GvsRYqv'
    assert [token_uri + 124] = '/aEw67TrdOpT5VzFA6A1Ay9cKoDfwbT'
    assert [token_uri + 125] = 'JdDWPRNWQsTyjm7rHbIsKFkoO/ZLCvs'
    assert [token_uri + 126] = 'YfxYs3whSC8aLI4KvVw77s3n4zHgipa'
    assert [token_uri + 127] = 'cJnCSbF9ErzS5pi8cCWvUYzOPd2zhJ/'
    assert [token_uri + 128] = 'GPCzShOE3xYlcO3PyadXjT3OkhphAXF'
    assert [token_uri + 129] = 'XSvheTNSURTFVVAHoJmyIrkjEKoQwFG'
    assert [token_uri + 130] = '005T3AXd95vN0Dm3mBs2xgFTl%2BQ5r'
    assert [token_uri + 131] = 'sAjntGhpzobd6B7NzRfNVe10DoNV947'
    assert [token_uri + 132] = 'SYdocRRbGvcmxTVxoa6zqwV7mAnw5D1'
    assert [token_uri + 133] = 'GETt2zH8%2BTvQBV5n7g/2aWht9yyNY'
    assert [token_uri + 134] = 'L9tOBtAg8HFCYE1mNwT2EB2Fu8TIhT7'
    assert [token_uri + 135] = 'vVRA4aXznk6pTZNgyiostwI6KeFU7Li'
    assert [token_uri + 136] = 'lpA%2B3B4GJyBwWM2pbFjHvsJ7GuOoa'
    assert [token_uri + 137] = 'kjmFtjY4LbT9l229%2BE6F7LDuWztLn'
    assert [token_uri + 138] = '37Ixk8j5lBVK3wLsi6/AfAuoj49lMkV'
    assert [token_uri + 139] = 'STPE9kpGd0LrEUSJIAA0pYlAxAMd/NO'
    assert [token_uri + 140] = 'FwoJDdXFi0zOWDB/TFJpVfWVBWOQbtr'
    assert [token_uri + 141] = 'JUb0clf3i%2BWPrDoYleTVtVOE0m6y5'
    assert [token_uri + 142] = 'dHtDrUQwoALtUR3eXSdDMNxXfejYFtv'
    assert [token_uri + 143] = 'LblrlJwwHK/EiWPJak2WK58nhNoLjaZ'
    assert [token_uri + 144] = 'UGXAuo2eoWwFEfa/DS4IiXqrFqGyc3H'
    assert [token_uri + 145] = 'ri9xQ2i2C5/s5vzBM0y7w3MDswM7Y2R'
    assert [token_uri + 146] = 'GBqrFMgx7Oic%2B0IzsmVxazTs0Rcfj'
    assert [token_uri + 147] = '2O34S/RV9P2iHoBulKIYBDfZFeLS5d9'
    assert [token_uri + 148] = 'rSyfJdSlgh2hdMr2OUR3KnlPnOAxTw1'
    assert [token_uri + 149] = 'J8LM2ZwnFqvZtZJlxx48swbCt2r1kfH'
    assert [token_uri + 150] = 'uD7VbH12aY88ICtVsKxKt/1rkalBAMt'
    assert [token_uri + 151] = 'x/oomCDPYbkUoLcDbKCjvuq9STDgtjX'
    assert [token_uri + 152] = 'GDqW5VK6hcGeOFizj6CqLOIqkWx4ws2'
    assert [token_uri + 153] = 'EPMDNsx%2Ba6aS208O9xL0RaFXo9BAd'
    assert [token_uri + 154] = 'U0pnE%2BLiSY3KSoJARYxdnziTZMpia'
    assert [token_uri + 155] = 'D/48Iii984DaQ5yvecxAFssWy/hbtim'
    assert [token_uri + 156] = 'c%2BpL8k5yopImJbyHq/a8yzll7roOz'
    assert [token_uri + 157] = 'XmxmAc3tYXScTkesMcD2I91Z63eI1/9'
    assert [token_uri + 158] = 'JbwUqk6sxc9KRgrwWMANeC1Nn9uGywT'
    assert [token_uri + 159] = 'spmU8q%2BlZmCqMgAS66bgHAGjQKsuJ'
    assert [token_uri + 160] = '3DQAjR54m5jLzZanTlbde0%2Brnf48Z'
    assert [token_uri + 161] = 'WA8Tl2g2wAGyBwHQn5R2%2BNjreBgxb'
    assert [token_uri + 162] = 'lsNFbuTwmhbAJHsz/rAoavLO41xtvzY'
    assert [token_uri + 163] = 'Gh3nLJBkAPjuxBJDRH30HBeu8UgCixF'
    assert [token_uri + 164] = 'NCyQ2/K%2B8QW7/e0%2BfO%2B46RNW0'
    assert [token_uri + 165] = 'eyLro9DjTgpJNM5G8Qy0lTdOumsw0fq'
    assert [token_uri + 166] = 'PEi96Fp%2BH0cMwNo7jxzYmnNfMZmdP'
    assert [token_uri + 167] = 'ly2poq2WPeGmgPq6GLxPN4SlKHnxpbO'
    assert [token_uri + 168] = 'iuLXQuX1UqP1gjo8Ba6SlU1OAmRgpzu'
    assert [token_uri + 169] = '1sTDXJPuM38To8q04L2Nwype872wwUg'
    assert [token_uri + 170] = 'AgZlp8dkQf9z8TMCbMkYk7XHCu35d7Z'
    assert [token_uri + 171] = 'ZAeo4kZKhxIS8iE5LTj3LOivHZrh9J8'
    assert [token_uri + 172] = 'p3zLZCjwcip5DRiKnWnIfL38kJhMtRw'
    assert [token_uri + 173] = 'jgU5%2BVrmqKlg90z7jds/B8DKdkFLv'
    assert [token_uri + 174] = 'H3S%2B7oH8alDZlbg4S1UX5tCMDSB2O'
    assert [token_uri + 175] = '6KulzA4Kv0g71BQd0TFKw3hSXinb7Nl'
    assert [token_uri + 176] = '0BXrXsQNcvCk8mo9Oxiex5YbzxVN/k7'
    assert [token_uri + 177] = '83oHTZIWw90yIZwvriqdGTsXnT8IepT'
    assert [token_uri + 178] = '7YyFCOJgA9Z0ByIEYVsTxR/ksak2Bh7'
    assert [token_uri + 179] = 'oKvp4vniU06MW1zBFrtehdz0kkXyQxj'
    assert [token_uri + 180] = 'BmyedV6dMYeE8aFxteuwsUFa6FllTDl'
    assert [token_uri + 181] = 'qd0pzRZwG6cFrfWMbp8G8XzjfbM%2B5'
    assert [token_uri + 182] = 'FXepv5oErsil64Xx6c7XAWbuim6f8sG'
    assert [token_uri + 183] = 'IMXfo3JiqGkp337hTSjgechb6OBG/2z'
    assert [token_uri + 184] = '17jomDiGm%2BGlb1FU0ienuRyiweLWg'
    assert [token_uri + 185] = 'gDzmFUvUEUjZo7sVTHwhOFPMkNsqFB9'
    assert [token_uri + 186] = 'wymkE0v9fmtwE8T7q58NYO7xu4b83vn'
    assert [token_uri + 187] = 'Fvl5uSxDlG%2BkOQgRIdO4jgzxjSHjK'
    assert [token_uri + 188] = 'Ls2t/lhOdwqva1AWDCprv3D4S4R7AbY'
    assert [token_uri + 189] = '4TCbfKF7tBe65T45Q4zzIqD31ayyuWq'
    assert [token_uri + 190] = 'ji%2BF6XS7ST9H9C1O4/iK6kGuvkQ/f'
    assert [token_uri + 191] = 'N57Hx7Ee3745b/vvn/bH/X%2B9/%2Bg'
    assert [token_uri + 192] = 'bemhOAmIpUvuQWusDvKQux9JDVNsKg6'
    assert [token_uri + 193] = 'QcmksQSADU04cGRLR7hFoZ2c7xUEfG%'
    assert [token_uri + 194] = '2BwkuTYGMvLjB/ePcI6AhGhnW5qzEAi'
    assert [token_uri + 195] = 'JXcwVEEwXieNpSl1zjErS%2BCS%2BHc'
    assert [token_uri + 196] = 'LoRPmva2MggA/iyLgSoTJUWgs4ByAIQ'
    assert [token_uri + 197] = 'O0OopZHvVbzhDILeUqUgzzHI/fyPGNx'
    assert [token_uri + 198] = 'ywsoylheSF9WvbySc3kEDqk2AV6ClCd'
    assert [token_uri + 199] = 'cU5SnlNnIc9KyMc8Lyb%2B8gHOJyQsF'
    assert [token_uri + 200] = 'lLbPRymm7JBt3ITZTAb1G2DBRIkQKQp'
    assert [token_uri + 201] = 'TQ9i9b6eCSS8zM6aaRSdTKVWRM3fcEJ'
    assert [token_uri + 202] = 'LdKatnsrIYwNJU%2Bs0H6Daux2wZ5hg'
    assert [token_uri + 203] = '3ple0BGHuk1kECsHYDdaImKp%2B3F5B'
    assert [token_uri + 204] = '1xYv7cHkqdDu0jKdRsez517mcV6AhQH'
    assert [token_uri + 205] = '4i1HN1svljRH6hEEFrh%2BnrrmG1n30'
    assert [token_uri + 206] = 'zM4gIwmiMwEbKhBTUdB1AHoX%2BKgAQ'
    assert [token_uri + 207] = 'zOHT9FIOqCkRNNb2s9qpIiCSOu1gWhh'
    assert [token_uri + 208] = 'IsCVJsvWqEqu5GbJQKNjaBte9LOigch'
    assert [token_uri + 209] = 'AJveGWs9C2203vonGlkwrRQ24ddg2yc'
    assert [token_uri + 210] = 'EdaWUDVsDAxUHsIww6eaR4FFe3mJAkf'
    assert [token_uri + 211] = 'BmZdR9RdwJHZmGdRyPCjpjbz1q/XJ4S'
    assert [token_uri + 212] = 'IIDkf8KKnn2ElKmyLiW4BQ86s1QUK/v'
    assert [token_uri + 213] = 'BhgRNweHvlYhhzr8pcgpKKmoaWjp6Bk'
    assert [token_uri + 214] = 'YOHDlx5sKVG3ceGE9evPnw5cdfgEBBg'
    assert [token_uri + 215] = 'oUIFSb8Xv2PES1GrDjxEiRKkixFqjTp'
    assert [token_uri + 216] = 'MmTKki1Hrjz5ChQqUqxEqTLlKlSqUq1'
    assert [token_uri + 217] = 'GrTr1GjRq0qxFqzbtOnSGe6h7JmbzIh'
    assert [token_uri + 218] = '5ZeDil1ZXSjt0wCuak3lnGoVUPoSsNf'
    assert [token_uri + 219] = '379K2jbtqmDgMiHZBfZlh2H9uw78ITi'
    assert [token_uri + 220] = '1JFjXVSf/C6cOUfz4o0dAx0TGwtHDhc'
    assert [token_uri + 221] = 'fj4CQmIiE1DMZBTklNZUpeVoaOnqv3s'
    assert [token_uri + 222] = '241NPP9evetYGhCZPWjIyts2pasCj%2'
    assert [token_uri + 223] = 'BpUjTYl3kaUt7OtKJa65XP9m5ncg6Nh'
    assert [token_uri + 224] = 'jhZXp2v%2BmWrCATZuJ03h1kjUuivPg'
    assert [token_uri + 225] = 'Ynjn5tKJOk2ncbp2QAEYXZi0KImP5kt'
    assert [token_uri + 226] = 'IaFn6kZ9wC%27%29%20format%28%27'
    assert [token_uri + 227] = 'woff2%27%29%3Bfont-weight%3A%20'
    assert [token_uri + 228] = 'normal%3Bfont-style%3A%20normal'
    assert [token_uri + 229] = '%3Bfont-display%3A%20swap%3B%7D'
    assert [token_uri + 230] = 'text%20%7Bfont-family%3A%20%27P'
    assert [token_uri + 231] = 'ress%20Start%202P%27%3Bfill%3A%'
    assert [token_uri + 232] = '20white%7D.value%20%7Bfont-size'
    assert [token_uri + 233] = '%3A%2010px%3B%7D.name%20%7Bfont'
    assert [token_uri + 234] = '-size%3A%204px%3B%7D%3C/style%3'
    assert [token_uri + 235] = 'E%3C/defs%3E%3Crect%20width%3D%'
    assert [token_uri + 236] = '2789%27%20height%3D%2755%27%20f'
    assert [token_uri + 237] = 'ill%3D%27black%27%20/%3E%3Crect'
    assert [token_uri + 238] = '%20x%3D%275.5%27%20y%3D%275.5%2'
    assert [token_uri + 239] = '7%20width%3D%2778%27%20height%3'
    assert [token_uri + 240] = 'D%2744%27%20fill%3D%27%230000FF'
    assert [token_uri + 241] = '%27%20/%3E%3Ctext%20text-anchor'
    assert [token_uri + 242] = '%3D%27middle%27%20x%3D%2744.5%2'
    assert [token_uri + 243] = '7%20y%3D%2733%27%20class%3D%27v'
    assert [token_uri + 244] = 'alue%27%3E'
    assert [token_uri + 245] = value_ascii
    assert [token_uri + 246] = '%3C/text%3E%3Crect%20x%3D%275.5'
    assert [token_uri + 247] = '%27%20y%3D%275.5%27%20width%3D%'
    assert [token_uri + 248] = '2778%27%20height%3D%2744%27%20s'
    assert [token_uri + 249] = 'troke%3D%27%23FF4F0A%27%20strok'
    assert [token_uri + 250] = 'e-width%3D%273%27%20/%3E%3Crect'
    assert [token_uri + 251] = '%20x%3D%2745.5%27%20y%3D%2745.5'
    assert [token_uri + 252] = '%27%20width%3D%2742%27%20height'
    assert [token_uri + 253] = '%3D%278%27%20fill%3D%27%23FF4F0'
    assert [token_uri + 254] = 'A%27%20/%3E%3Ctext%20text-ancho'
    assert [token_uri + 255] = 'r%3D%27end%27%20x%3D%2787%27%20'
    assert [token_uri + 256] = 'y%3D%2752%27%20class%3D%27name%'
    assert [token_uri + 257] = '27%3ESheet1%21'
    assert [token_uri + 258] = cell_index_ascii
    assert [token_uri + 259] = '%3C/text%3E%3C/svg%3E"}'

    let token_uri_len = 260
    return (token_uri_len, token_uri)
end
