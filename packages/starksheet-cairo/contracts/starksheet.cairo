# Declare this file as a StarkNet contract.
%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.cairo.common.math_cmp import is_nn
from openzeppelin.token.erc721.ERC721_Mintable_Burnable import constructor

# Each token is a cell in the grid. Each cell has a number of dependencies and a function to execute.
# if there are no dependencies, the value is a constant, otherwise it is a function identifier.
struct TokenData:
    member dependencies_len : felt
    member value : felt
end

@storage_var
func Starksheet_cells(token_id : felt) -> (token_data : TokenData):
end

@storage_var
func Starksheet_cell_dependencies(token_id : felt, index : felt) -> (dependency : felt):
end

func set_cell_dependencies{
    syscall_ptr : felt*,
    pedersen_ptr : HashBuiltin*,
    range_check_ptr,
    token_id : felt,
    index : felt,
    dependencies_len : felt,
}(deps : felt*):
    tempvar remaining_deps = dependencies_len - index
    if remaining_deps == 0:
        return ()
    end
    Starksheet_cell_dependencies.write(token_id, index, [deps])
    let index_new = index + 1
    set_cell_dependencies{index=index_new}(deps + 1)
    return ()
end

@external
func setContent{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    tokenId : felt, value : felt, dependencies_len : felt, dependencies : felt*
):
    alloc_locals
    with_attr error_message("setContent: dependencies_len must be non-negative"):
        let (is_nn_deps) = is_nn(dependencies_len)
        assert is_nn_deps = 1
    end
    Starksheet_cells.write(tokenId, TokenData(dependencies_len, value))
    local index = 0
    with index, dependencies_len:
        set_cell_dependencies{token_id=tokenId}(dependencies)
    end

    return ()
end

@external
func getCell{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(tokenId : felt) -> (
    token_data : TokenData
):
    return Starksheet_cells.read(tokenId)
end

@external
func getCellDependenciesAtIndex{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    tokenId : felt, index : felt
) -> (dep : felt):
    let (dep) = Starksheet_cell_dependencies.read(tokenId, index)
    return (dep=dep)
end
