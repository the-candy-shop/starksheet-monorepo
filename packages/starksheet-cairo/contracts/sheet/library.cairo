%lang starknet

from openzeppelin.token.erc721.library import ERC721_owners, ERC721
from openzeppelin.token.erc721.enumerable.library import ERC721Enumerable
from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.bool import TRUE, FALSE
from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.cairo.common.default_dict import default_dict_new, default_dict_finalize
from starkware.cairo.common.dict import DictAccess, dict_write, dict_read
from starkware.cairo.common.math_cmp import is_le, is_not_zero, is_nn, RC_BOUND
from starkware.cairo.common.math import signed_div_rem
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

const DEFAULT_VALUE = 2 ** 128 - 1;
const SHOULD_RENDER_FLAG = 2;

@event
func CellUpdated(id: felt, value: felt, contract_address: felt) {
}

// Each token is a cell in the grid. Each cell has a number of calldata and a value to execute.
// If there is no dependency, the value is a constant, otherwise it is a function identifier.
struct CellData {
    contract_address: felt,
    value: felt,
    calldata_len: felt,
}

struct CellRendered {
    id: felt,
    owner: felt,
    value: felt,
}

@storage_var
func Sheet_cell_renderer() -> (address: felt) {
}

@storage_var
func Sheet_merkle_root() -> (root: felt) {
}

@storage_var
func Sheet_max_per_wallet() -> (max: felt) {
}

@storage_var
func Sheet_cell(id: felt) -> (cell_data: CellData) {
}

@storage_var
func Sheet_cell_calldata(id: felt, index: felt) -> (value: felt) {
}

namespace Sheet {
    func set_cell{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        token_id: felt,
        contract_address: felt,
        value: felt,
        cell_calldata_len: felt,
        cell_calldata: felt*,
    ) {
        alloc_locals;
        Sheet_cell.write(
            token_id,
            CellData(contract_address=contract_address, value=value, calldata_len=cell_calldata_len),
        );
        local index = 0;
        _set_calldata{token_id=token_id, index=index, calldata_len=cell_calldata_len}(
            cell_calldata
        );
        CellUpdated.emit(token_id, value, contract_address);
        return ();
    }

    func get_cell{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        token_id: felt
    ) -> (contract_address: felt, value: felt, calldata_len: felt, calldata: felt*) {
        alloc_locals;
        let token_id_256 = Uint256(token_id, 0);
        let exists = ERC721._exists(token_id_256);
        if (exists == FALSE) {
            let calldata: felt* = alloc();
            return (RC_BOUND, 0, 0, calldata);
        }
        let (cell_data) = Sheet_cell.read(token_id);
        let calldata_len = cell_data.calldata_len;

        let (local calldata: felt*) = alloc();
        with token_id, calldata, calldata_len {
            _get_calldata(0);
        }
        return (cell_data.contract_address, cell_data.value, calldata_len, calldata);
    }

    func render_cell{
        syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr, rendered_cells: DictAccess*
    }(token_id: felt) -> (cell: CellRendered) {
        let true = TRUE;
        let (value) = _render_cell{value_is_token_id=true}(token_id);
        let token_id_256 = Uint256(token_id, 0);
        let (owner) = ERC721_owners.read(token_id_256);
        return (CellRendered(id=token_id, owner=owner, value=value),);
    }

    // TODO: Merge rendered_cells and cells. At the moment not able to use only cells because
    // TODO: one wants to return the CellRendered struct and find_elements raise if a key is not found.
    // TODO: Thus using rendered_cells default_dict and dict_read for caching results
    func render_grid{
        syscall_ptr: felt*,
        pedersen_ptr: HashBuiltin*,
        range_check_ptr,
        cells: CellRendered*,
        rendered_cells: DictAccess*,
        stop: felt,
    }(index: felt) {
        alloc_locals;
        if (index == stop) {
            return ();
        }
        let (token_id) = ERC721Enumerable.token_by_index(Uint256(index, 0));
        let (cell) = render_cell(token_id.low);
        assert [cells + CellRendered.SIZE * index] = cell;
        return render_grid(index + 1);
    }

    func mint{pedersen_ptr: HashBuiltin*, syscall_ptr: felt*, range_check_ptr}(
        token_id: Uint256, proof_len: felt, proof: felt*
    ) {
        let (address) = get_caller_address();
        with address {
            _assert_is_allowed(proof_len, proof);
            let (max_per_wallet) = Sheet_max_per_wallet.read();
            _assert_does_not_exceed_allocation(max_per_wallet);
        }

        ERC721Enumerable._mint(address, token_id);
        return ();
    }

    func token_uri{pedersen_ptr: HashBuiltin*, syscall_ptr: felt*, range_check_ptr}(
        token_id: Uint256
    ) -> (token_uri_len: felt, token_uri: felt*) {
        alloc_locals;
        let exists = ERC721._exists(token_id);
        with_attr error_message("ERC721: tokenURI query for nonexistent token") {
            assert exists = TRUE;
        }

        let (local rendered_cells_start) = default_dict_new(default_value=DEFAULT_VALUE);
        let rendered_cells = rendered_cells_start;

        let true = TRUE;
        let (value) = _render_cell{rendered_cells=rendered_cells, value_is_token_id=true}(
            token_id.low
        );
        let (finalized_rendered_cells_start, finalized_rendered_cells_end) = default_dict_finalize(
            rendered_cells_start, rendered_cells, DEFAULT_VALUE
        );
        tempvar pedersen_ptr = pedersen_ptr;

        let (name) = ERC721.name();
        let (renderer_address) = Sheet_cell_renderer.read();
        let (token_uri_len, token_uri) = ICellRenderer.token_uri(
            renderer_address, token_id.low, value, name
        );
        return (token_uri_len, token_uri);
    }
}

// Internals

func _set_calldata{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr,
    token_id: felt,
    index: felt,
    calldata_len: felt,
}(calldata: felt*) {
    tempvar remaining_data = calldata_len - index;
    if (remaining_data == 0) {
        return ();
    }
    Sheet_cell_calldata.write(token_id, index, [calldata]);
    let index_new = index + 1;
    _set_calldata{index=index_new}(calldata + 1);
    return ();
}

func _get_calldata{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr,
    token_id: felt,
    calldata_len: felt,
    calldata: felt*,
}(index: felt) {
    tempvar remaining_data = calldata_len - index;
    if (remaining_data == 0) {
        return ();
    }
    let (current_data) = Sheet_cell_calldata.read(token_id, index);
    assert calldata[index] = current_data;
    _get_calldata(index + 1);
    return ();
}

func _render_cell{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr,
    rendered_cells: DictAccess*,
    value_is_token_id: felt,
}(value: felt) -> (result: felt) {
    alloc_locals;
    if (value_is_token_id == FALSE) {
        return (value,);
    }

    let (stored_result) = dict_read{dict_ptr=rendered_cells}(value);
    if (stored_result != DEFAULT_VALUE) {
        return (stored_result,);
    }

    let (contract_address, result, calldata_len, calldata) = Sheet.get_cell(value);
    if (contract_address == RC_BOUND) {
        dict_write{dict_ptr=rendered_cells}(value, result);
        return (result,);
    }

    let contract_address_is_token_id = is_nn(contract_address);
    let (local rendered_contract_address) = _render_cell{
        value_is_token_id=contract_address_is_token_id
    }(contract_address);
    let (local calldata_rendered: felt*) = alloc();
    _render_cell_calldata{
        calldata_ids=calldata,
        calldata_rendered=calldata_rendered,
        rendered_cells=rendered_cells,
        stop=calldata_len,
    }(0);

    let (retdata_size: felt, retdata: felt*) = call_contract(
        rendered_contract_address, result, calldata_len, calldata_rendered
    );
    let result = retdata[0];

    dict_write{dict_ptr=rendered_cells}(value, result);
    return (result,);
}

func _render_cell_calldata{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr,
    calldata_ids: felt*,
    calldata_rendered: felt*,
    rendered_cells: DictAccess*,
    stop: felt,
}(index: felt) {
    if (index == stop) {
        return ();
    }
    let value = calldata_ids[index];
    // TODO: "value + 1" is a hard-fix because of "AssertionError: 0 / 2 = 0 is out of the range [0, 0)" in the range checker.
    let (value, value_is_token_id) = signed_div_rem(value, SHOULD_RENDER_FLAG, value + 1);
    with rendered_cells, value_is_token_id {
        let (result) = _render_cell(value);
    }

    assert calldata_rendered[index] = result;
    return _render_cell_calldata(index + 1);
}

// Caller checks

func _assert_is_allowed{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr, address: felt
}(proof_len: felt, proof: felt*) {
    alloc_locals;
    let (leaf) = _hash_sorted{hash_ptr=pedersen_ptr}(address, address);
    let (local root) = Sheet_merkle_root.read();
    let use_proof = is_not_zero(root);
    let (is_allow_list) = merkle_verify(leaf, root, proof_len, proof);
    with_attr error_message("mint: {address} is not allowed") {
        assert is_allow_list * use_proof + (1 - use_proof) = TRUE;
    }
    return ();
}

func _assert_does_not_exceed_allocation{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr, address: felt
}(allocation: felt) {
    alloc_locals;
    local use_allocation = is_not_zero(allocation);
    let (user_balance) = ERC721.balance_of(address);
    let remaining_allocation = is_le(user_balance.low, allocation - 1);
    with_attr error_message("mint: user {address} exceeds allocation {allocation}") {
        assert remaining_allocation * use_allocation + (1 - use_allocation) = TRUE;
    }
    return ();
}
