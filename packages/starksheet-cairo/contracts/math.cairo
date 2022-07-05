%lang starknet

func sum(arr : felt*, size : felt) -> (res : felt):
    if size == 0:
        return (0)
    end

    let (sum_of_rest) = sum(arr=arr + 1, size=size - 1)
    return ([arr] + sum_of_rest)
end

func prod(arr : felt*, size) -> (res : felt):
    if size == 0:
        return (1)
    end

    let (prod_of_rest) = prod(arr=arr + 1, size=size - 1)
    return ([arr] * prod_of_rest)
end
