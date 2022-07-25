%lang starknet

from onlydust.stream.default_implementation import stream
from openzeppelin.token.erc721.library import ERC721_owners, _exists
from openzeppelin.token.erc721_enumerable.library import ERC721_Enumerable_mint
from openzeppelin.utils.constants import TRUE, FALSE
from starkware.cairo.common.registers import get_label_location
from starkware.cairo.common.hash import hash2
from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.starknet.common.syscalls import (
    call_contract,
    get_contract_address,
    get_caller_address,
)
from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.uint256 import Uint256

from contracts.math import sum, prod, div, sub
from contracts.constants import SUM_VALUE, PROD_VALUE, DIV_VALUE, SUB_VALUE
from contracts.rendering import Starksheet_render_token_uri
from contracts.merkle_tree import merkle_verify

@event
func CellUpdated(id : felt, value : felt):
end

# Each token is a cell in the grid. Each cell has a number of dependencies and a value to execute.
# If there is no dependency, the value is a constant, otherwise it is a function identifier.
struct CellData:
    member dependencies_len : felt
    member value : felt
end

struct CellRendered:
    member id : felt
    member owner : felt
    member value : felt
end

@storage_var
func Starksheet_merkle_root() -> (root : felt):
end

@storage_var
func Starksheet_claimed(leaf : felt) -> (claimed : felt):
end

@storage_var
func Starksheet_cell(id : felt) -> (cell_data : CellData):
end

@storage_var
func Starksheet_cell_dependencies(id : felt, index : felt) -> (value : felt):
end

func _set_dependencies{
    syscall_ptr : felt*,
    pedersen_ptr : HashBuiltin*,
    range_check_ptr,
    id : felt,
    index : felt,
    dependencies_len : felt,
}(dependencies : felt*):
    tempvar remaining_data = dependencies_len - index
    if remaining_data == 0:
        return ()
    end
    Starksheet_cell_dependencies.write(id, index, [dependencies])
    let index_new = index + 1
    _set_dependencies{index=index_new}(dependencies + 1)
    return ()
end

func _get_dependencies{
    syscall_ptr : felt*,
    pedersen_ptr : HashBuiltin*,
    range_check_ptr,
    id : felt,
    dependencies_len : felt,
    dependencies : felt*,
}(index : felt):
    tempvar remaining_data = dependencies_len - index
    if remaining_data == 0:
        return ()
    end
    let (current_data) = Starksheet_cell_dependencies.read(id, index)
    assert dependencies[index] = current_data
    _get_dependencies(index + 1)
    return ()
end

func Starksheet_setCell{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    id : felt, value : felt, dependencies_len : felt, dependencies : felt*
):
    alloc_locals
    Starksheet_cell.write(id, CellData(dependencies_len, value))
    local index = 0
    with id, index, dependencies_len:
        _set_dependencies(dependencies)
    end
    CellUpdated.emit(id, value)
    return ()
end

func Starksheet_getCell{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    id : felt
) -> (value : felt, dependencies_len : felt, dependencies : felt*):
    alloc_locals
    local index = 0
    let (cell_data) = Starksheet_cell.read(id)
    let dependencies_len = cell_data.dependencies_len

    let (local dependencies : felt*) = alloc()
    with id, dependencies, dependencies_len:
        _get_dependencies(index)
    end
    return (cell_data.value, dependencies_len, dependencies)
end

# Signature has to be the following to use stream.map, hence the "value" and "result" kwargs
func _render_cell{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    value : felt
) -> (result : felt):
    alloc_locals
    let (value, dependencies_len, dependencies) = Starksheet_getCell(value)
    let result = value
    if dependencies_len == 0:
        return (result)
    end
    let (dependencies) = stream.map(_render_cell, dependencies_len, dependencies)

    # TODO: store address in cell to be able to call any function from any contract (math/ml lib for instance)
    # let (contract_address) = get_contract_address()
    # %{
    #     print(f"{contract_address=}")
    #     print(f"{value=}")
    #     breakpoint()
    # %}
    # let (retdata_size : felt, retdata : felt*) = call_contract(
    #     contract_address, value, dependencies_len, dependencies
    # )
    # assert retdata_size = 1
    # let result = retdata[0]

    # TODO: can't make the call_contract work, for now this is a workaround to plug the FE
    if value == SUM_VALUE:
        let (result) = sum(dependencies_len, dependencies)
        return (result)
    end
    if value == PROD_VALUE:
        let (result) = prod(dependencies_len, dependencies)
        return (result)
    end
    if value == SUB_VALUE:
        let (result) = sub(dependencies_len, dependencies)
        return (result)
    end
    if value == DIV_VALUE:
        let (result) = div(dependencies_len, dependencies)
        return (result)
    end
    with_attr error_message("renderCell: formula {value} not found"):
        assert 0 = 1
    end
    return (0)
end

func Starksheet_renderCell{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    value : felt
) -> (cell : CellRendered):
    let (result) = _render_cell(value)
    let token_id = Uint256(value, 0)
    let (owner) = ERC721_owners.read(token_id)
    return (CellRendered(id=value, owner=owner, value=result))
end

# TODO: This method is inefficient because it probably (depending on the content of the sheet)
# TODO: render some cells several times.
# TODO: Rework by storing all the results of the intermediate _render_cell
func Starksheet_renderGrid{
    syscall_ptr : felt*,
    pedersen_ptr : HashBuiltin*,
    range_check_ptr,
    cells : CellRendered*,
    stop : felt,
}(index : felt):
    # alloc_locals
    if index == stop:
        return ()
    end
    let (cell) = Starksheet_renderCell(index)
    assert [cells + CellRendered.SIZE * index] = cell
    return Starksheet_renderGrid(index + 1)
end

func Starksheet_mint{pedersen_ptr : HashBuiltin*, syscall_ptr : felt*, range_check_ptr}(
    token_id : Uint256, proof_len : felt, proof : felt*
):
    alloc_locals
    let (local caller_address) = get_caller_address()
    let (leaf) = hash2{hash_ptr=pedersen_ptr}(caller_address, caller_address)
    let (root) = Starksheet_merkle_root.read()
    let (is_allow_list) = merkle_verify(leaf, root, proof_len, proof)
    with_attr error_message("mint: proof is not valid"):
        assert is_allow_list = TRUE
    end
    let (claimed) = Starksheet_claimed.read(leaf)
    with_attr error_message("mint: token already claimed"):
        assert claimed = FALSE
    end
    ERC721_Enumerable_mint(caller_address, token_id)
    Starksheet_claimed.write(leaf, TRUE)
    return ()
end

func Starksheet_tokenURI{pedersen_ptr : HashBuiltin*, syscall_ptr : felt*, range_check_ptr}(
    token_id : Uint256
) -> (token_uri_len : felt, token_uri : felt*):
    let (exists) = _exists(token_id)
    with_attr error_message("ERC721: tokenURI query for nonexistent token"):
        assert exists = TRUE
    end

    let (value) = _render_cell(token_id.low)
    tempvar pedersen_ptr = pedersen_ptr

    let (token_uri_len, token_uri) = Starksheet_render_token_uri(token_id.low, value)
    return (token_uri_len, token_uri)
end
