%lang starknet

from onlydust.stream.default_implementation import stream
from openzeppelin.token.erc721.library import ERC721_owners, _exists, ERC721_balanceOf, ERC721_name
from openzeppelin.token.erc721_enumerable.library import ERC721_Enumerable_mint
from openzeppelin.utils.constants import TRUE, FALSE
from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.cairo.common.math_cmp import is_le
from starkware.cairo.common.uint256 import Uint256
from starkware.cairo.common.memcpy import memcpy
from starkware.starknet.common.syscalls import call_contract, get_caller_address

from contracts.interfaces import ICellRenderer
from contracts.utils.merkle_tree import (
    merkle_verify,
    addresses_to_leafs,
    merkle_build,
    _hash_sorted,
)
from contracts.utils.string import str

@event
func CellUpdated(id : felt, value : felt, contract_address : felt):
end

# Each token is a cell in the grid. Each cell has a number of dependencies and a value to execute.
# If there is no dependency, the value is a constant, otherwise it is a function identifier.
struct CellData:
    member dependencies_len : felt
    member value : felt
    member contract_address : felt
end

struct CellRendered:
    member id : felt
    member owner : felt
    member value : felt
end

@storage_var
func Sheet_cell_renderer() -> (address : felt):
end

@storage_var
func Sheet_merkle_root() -> (root : felt):
end

@storage_var
func Sheet_max_per_wallet() -> (max : felt):
end

@storage_var
func Sheet_cell(id : felt) -> (cell_data : CellData):
end

@storage_var
func Sheet_cell_dependencies(id : felt, index : felt) -> (value : felt):
end

func Sheet_setCell{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    contract_address : felt,
    token_id : felt,
    value : felt,
    dependencies_len : felt,
    dependencies : felt*,
):
    alloc_locals
    Sheet_cell.write(
        token_id,
        CellData(dependencies_len=dependencies_len, value=value, contract_address=contract_address),
    )
    local index = 0
    with token_id, index, dependencies_len:
        _set_dependencies(dependencies)
    end
    CellUpdated.emit(token_id, value, contract_address)
    return ()
end

func Sheet_getCell{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    token_id : felt
) -> (contract_address : felt, value : felt, dependencies_len : felt, dependencies : felt*):
    alloc_locals
    local index = 0
    let (cell_data) = Sheet_cell.read(token_id)
    let dependencies_len = cell_data.dependencies_len

    let (local dependencies : felt*) = alloc()
    with token_id, dependencies, dependencies_len:
        _get_dependencies(index)
    end
    return (cell_data.contract_address, cell_data.value, dependencies_len, dependencies)
end

func Sheet_renderCell{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
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
func Sheet_renderGrid{
    syscall_ptr : felt*,
    pedersen_ptr : HashBuiltin*,
    range_check_ptr,
    cells : CellRendered*,
    stop : felt,
}(index : felt):
    if index == stop:
        return ()
    end
    let (cell) = Sheet_renderCell(index)
    assert [cells + CellRendered.SIZE * index] = cell
    return Sheet_renderGrid(index + 1)
end

func Sheet_mint{pedersen_ptr : HashBuiltin*, syscall_ptr : felt*, range_check_ptr}(
    token_id : Uint256, proof_len : felt, proof : felt*
):
    alloc_locals
    let (local caller_address) = get_caller_address()
    let (root) = Sheet_merkle_root.read()
    if root != 0:
        let (leaf) = _hash_sorted{hash_ptr=pedersen_ptr}(caller_address, caller_address)
        let (is_allow_list) = merkle_verify(leaf, root, proof_len, proof)
        with_attr error_message("mint: proof is not valid"):
            assert is_allow_list = TRUE
        end
        tempvar pedersen_ptr = pedersen_ptr
        tempvar syscall_ptr = syscall_ptr
        tempvar range_check_ptr = range_check_ptr
    else:
        tempvar pedersen_ptr = pedersen_ptr
        tempvar syscall_ptr = syscall_ptr
        tempvar range_check_ptr = range_check_ptr
    end
    let (max_per_wallet) = Sheet_max_per_wallet.read()
    if max_per_wallet != 0:
        let (user_balance) = ERC721_balanceOf(caller_address)
        let (remaining_allocation) = is_le(user_balance.low, max_per_wallet - 1)
        with_attr error_message("mint: tokens already claimed"):
            assert remaining_allocation = TRUE
        end
        tempvar pedersen_ptr = pedersen_ptr
        tempvar syscall_ptr = syscall_ptr
        tempvar range_check_ptr = range_check_ptr
    else:
        tempvar pedersen_ptr = pedersen_ptr
        tempvar syscall_ptr = syscall_ptr
        tempvar range_check_ptr = range_check_ptr
    end
    ERC721_Enumerable_mint(caller_address, token_id)
    return ()
end

func Sheet_tokenURI{pedersen_ptr : HashBuiltin*, syscall_ptr : felt*, range_check_ptr}(
    token_id : Uint256
) -> (token_uri_len : felt, token_uri : felt*):
    let (exists) = _exists(token_id)
    with_attr error_message("ERC721: tokenURI query for nonexistent token"):
        assert exists = TRUE
    end

    let (value) = _render_cell(token_id.low)
    tempvar pedersen_ptr = pedersen_ptr

    let (name) = ERC721_name()
    let (renderer_address) = Sheet_cell_renderer.read()
    let (token_uri_len, token_uri) = ICellRenderer.token_uri(
        renderer_address, token_id.low, value, name
    )
    return (token_uri_len, token_uri)
end

# Internals

func _set_dependencies{
    syscall_ptr : felt*,
    pedersen_ptr : HashBuiltin*,
    range_check_ptr,
    token_id : felt,
    index : felt,
    dependencies_len : felt,
}(dependencies : felt*):
    tempvar remaining_data = dependencies_len - index
    if remaining_data == 0:
        return ()
    end
    Sheet_cell_dependencies.write(token_id, index, [dependencies])
    let index_new = index + 1
    _set_dependencies{index=index_new}(dependencies + 1)
    return ()
end

func _get_dependencies{
    syscall_ptr : felt*,
    pedersen_ptr : HashBuiltin*,
    range_check_ptr,
    token_id : felt,
    dependencies_len : felt,
    dependencies : felt*,
}(index : felt):
    tempvar remaining_data = dependencies_len - index
    if remaining_data == 0:
        return ()
    end
    let (current_data) = Sheet_cell_dependencies.read(token_id, index)
    assert dependencies[index] = current_data
    _get_dependencies(index + 1)
    return ()
end

func _render_cell{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    value : felt
) -> (result : felt):
    alloc_locals
    let (contract_address, value, dependencies_len, dependencies) = Sheet_getCell(value)
    let result = value
    if contract_address == 0:
        return (result)
    end
    let (dependencies) = stream.map(_render_cell, dependencies_len, dependencies)
    let (calldata : felt*) = alloc()
    assert calldata[0] = dependencies_len
    memcpy(calldata + 1, dependencies, dependencies_len)

    let (retdata_size : felt, retdata : felt*) = call_contract(
        contract_address, value, dependencies_len + 1, calldata
    )
    assert retdata_size = 1
    let result = retdata[0]

    return (result)
end
