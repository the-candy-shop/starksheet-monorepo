%lang starknet

from openzeppelin.token.erc721.library import ERC721_owners, ERC721
from openzeppelin.token.erc721_enumerable.library import ERC721_Enumerable
from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.bool import TRUE, FALSE
from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.cairo.common.default_dict import default_dict_new, default_dict_finalize
from starkware.cairo.common.dict import DictAccess, dict_write, dict_read
from starkware.cairo.common.math_cmp import is_le
from starkware.cairo.common.memcpy import memcpy
from starkware.cairo.common.uint256 import Uint256
from starkware.starknet.common.syscalls import call_contract, get_caller_address

from contracts.interfaces import ICellRenderer
from contracts.utils.merkle_tree import (
    merkle_verify,
    addresses_to_leafs,
    merkle_build,
    _hash_sorted,
)
from contracts.utils.string import str

const DEFAULT_VALUE = 2 ** 128 - 1

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

namespace Sheet:
    func set_cell{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
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

    func get_cell{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
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

    func render_cell{
        syscall_ptr : felt*,
        pedersen_ptr : HashBuiltin*,
        range_check_ptr,
        rendered_cells : DictAccess*,
    }(token_id : felt) -> (cell : CellRendered):
        let (value) = _render_cell(token_id)
        let token_id_256 = Uint256(token_id, 0)
        let (owner) = ERC721_owners.read(token_id_256)
        return (CellRendered(id=token_id, owner=owner, value=value))
    end

    # TODO: Merge rendered_cells and cells. At the moment not able to use only cells because
    # TODO: one wants to return the CellRendered struct and find_elements raise if a key is not found.
    # TODO: Thus using rendered_cells default_dict and dict_read for caching results
    func render_grid{
        syscall_ptr : felt*,
        pedersen_ptr : HashBuiltin*,
        range_check_ptr,
        cells : CellRendered*,
        rendered_cells : DictAccess*,
        stop : felt,
    }(index : felt):
        alloc_locals
        if index == stop:
            return ()
        end
        let (token_id) = ERC721_Enumerable.token_by_index(Uint256(index, 0))
        let (cell) = render_cell(token_id.low)
        assert [cells + CellRendered.SIZE * index] = cell
        return render_grid(index + 1)
    end

    func mint{pedersen_ptr : HashBuiltin*, syscall_ptr : felt*, range_check_ptr}(
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
            let (user_balance) = ERC721.balance_of(caller_address)
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
        ERC721_Enumerable._mint(caller_address, token_id)
        return ()
    end

    func token_uri{pedersen_ptr : HashBuiltin*, syscall_ptr : felt*, range_check_ptr}(
        token_id : Uint256
    ) -> (token_uri_len : felt, token_uri : felt*):
        alloc_locals
        let (exists) = ERC721._exists(token_id)
        with_attr error_message("ERC721: tokenURI query for nonexistent token"):
            assert exists = TRUE
        end

        let (local rendered_cells_start) = default_dict_new(default_value=DEFAULT_VALUE)
        let rendered_cells = rendered_cells_start

        let (value) = _render_cell{rendered_cells=rendered_cells}(token_id.low)
        let (finalized_rendered_cells_start, finalized_rendered_cells_end) = default_dict_finalize(
            rendered_cells_start, rendered_cells, DEFAULT_VALUE
        )
        tempvar pedersen_ptr = pedersen_ptr

        let (name) = ERC721.name()
        let (renderer_address) = Sheet_cell_renderer.read()
        let (token_uri_len, token_uri) = ICellRenderer.token_uri(
            renderer_address, token_id.low, value, name
        )
        return (token_uri_len, token_uri)
    end
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

func _render_cell{
    syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr, rendered_cells : DictAccess*
}(token_id : felt) -> (value : felt):
    alloc_locals

    let (stored_result) = dict_read{dict_ptr=rendered_cells}(token_id)
    if stored_result != DEFAULT_VALUE:
        return (stored_result)
    end

    let (contract_address, value, dependencies_len, dependencies) = Sheet.get_cell(token_id)
    if contract_address == 0:
        dict_write{dict_ptr=rendered_cells}(token_id, value)
        return (value)
    end

    let (local dependencies_rendered : felt*) = alloc()
    _render_cell_dependencies{
        dependencies_ids=dependencies,
        dependencies_rendered=dependencies_rendered,
        rendered_cells=rendered_cells,
        stop=dependencies_len,
    }(0)
    let (calldata : felt*) = alloc()
    assert calldata[0] = dependencies_len
    memcpy(calldata + 1, dependencies_rendered, dependencies_len)

    let (retdata_size : felt, retdata : felt*) = call_contract(
        contract_address, value, dependencies_len + 1, calldata
    )
    assert retdata_size = 1
    let value = retdata[0]

    dict_write{dict_ptr=rendered_cells}(token_id, value)
    return (value)
end

func _render_cell_dependencies{
    syscall_ptr : felt*,
    pedersen_ptr : HashBuiltin*,
    range_check_ptr,
    dependencies_ids : felt*,
    dependencies_rendered : felt*,
    rendered_cells : DictAccess*,
    stop : felt,
}(index : felt):
    if index == stop:
        return ()
    end
    let (result) = _render_cell{rendered_cells=rendered_cells}(dependencies_ids[index])
    assert dependencies_rendered[index] = result
    return _render_cell_dependencies(index + 1)
end
