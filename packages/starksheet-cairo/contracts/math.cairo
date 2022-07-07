%lang starknet

func sum(arr_len : felt, arr : felt*) -> (res : felt):
    if arr_len == 0:
        return (0)
    end

    let (sum_of_rest) = sum(arr_len=arr_len - 1, arr=arr + 1)
    return ([arr] + sum_of_rest)
end

func prod(arr_len : felt, arr : felt*) -> (res : felt):
    if arr_len == 0:
        return (1)
    end

    let (prod_of_rest) = prod(arr_len=arr_len - 1, arr=arr + 1)
    return ([arr] * prod_of_rest)
end
