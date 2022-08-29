%lang starknet

from starkware.cairo.common.bool import TRUE
from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.cairo.common.dict import DictAccess, dict_read
from starkware.cairo.common.default_dict import default_dict_new, default_dict_finalize
from starkware.cairo.common.math import unsigned_div_rem, sign, abs_value
from starkware.cairo.common.math_cmp import is_le, RC_BOUND

from contracts.interfaces import CellData, CellRendered

@view
func render_grid{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    cells_len : felt, cells : CellData*, cells_calldata_len : felt, cells_calldata : felt*
) -> (cells_rendered_len : felt, cells_rendered : CellRendered*):
    alloc_locals
    let (local cells_rendered : CellRendered*) = alloc()
    let (local cells_cache_start) = default_dict_new(default_value=RC_BOUND - 1)
    let cells_cache = cells_cache_start
    _render_grid{
        cells=cells, cells_rendered=cells_rendered, cells_cache=cells_cache, stop=cells_len
    }(0)

    let (finalized_rendered_cells_start, finalized_rendered_cells_end) = default_dict_finalize(
        cells_cache, cells_cache, RC_BOUND - 1
    )

    return (cells_len, cells_rendered)
end

# TODO: Merge cells_cache and cells_rendered. At the moment not able to use only cells_rendered because
# TODO: one wants to return the CellRendered struct and find_elements raise if a key is not found.
# TODO: Thus using cells_cache default_dict and dict_read for caching results
func _render_grid{
    syscall_ptr : felt*,
    pedersen_ptr : HashBuiltin*,
    range_check_ptr,
    cells : CellData*,
    cells_rendered : CellRendered*,
    cells_cache : DictAccess*,
    stop : felt,
}(index : felt):
    alloc_locals
    if index == stop:
        return ()
    end
    let true = TRUE
    let (cell) = _render_cell{value_is_token_id=true}(cells[index].id)
    assert [cells_rendered + CellRendered.SIZE * index] = cell
    return render_grid(index + 1)
end

func _render_cell{
    syscall_ptr : felt*,
    pedersen_ptr : HashBuiltin*,
    range_check_ptr,
    cells : CellData*,
    cells_cache : DictAccess*,
    value_is_token_id : felt,
}(value : felt) -> (result : felt):
    alloc_locals
    if value_is_token_id == FALSE:
        return (value)
    end

    let (stored_result) = dict_read{dict_ptr=cells_cache}(value)
    if stored_result != DEFAULT_VALUE:
        return (stored_result)
    end

    let (contract_address, result, calldata_len, calldata) = Sheet.get_cell(value)
    if contract_address == RC_BOUND:
        dict_write{dict_ptr=cells_cache}(value, result)
        return (result)
    end

    let (contract_address_is_token_id) = is_nn(contract_address)
    let (local rendered_contract_address) = _render_cell{
        value_is_token_id=contract_address_is_token_id
    }(contract_address)
    let (local calldata_rendered : felt*) = alloc()
    _render_cell_calldata{
        calldata_ids=calldata,
        calldata_rendered=calldata_rendered,
        cells_cache=cells_cache,
        stop=calldata_len,
    }(0)

    let (retdata_size : felt, retdata : felt*) = call_contract(
        rendered_contract_address, result, calldata_len, calldata_rendered
    )
    let result = retdata[0]

    dict_write{dict_ptr=cells_cache}(value, result)
    return (result)
end

func _render_cell_calldata{
    syscall_ptr : felt*,
    pedersen_ptr : HashBuiltin*,
    range_check_ptr,
    calldata_ids : felt*,
    calldata_rendered : felt*,
    cells_cache : DictAccess*,
    stop : felt,
}(index : felt):
    if index == stop:
        return ()
    end
    let value = calldata_ids[index]
    # TODO: "value + 1" is a hard-fix because of "AssertionError: 0 / 2 = 0 is out of the range [0, 0)" in the range checker.
    let (value, value_is_token_id) = signed_div_rem(value, SHOULD_RENDER_FLAG, value + 1)
    with cells_cache, value_is_token_id:
        let (result) = _render_cell(value)
    end

    assert calldata_rendered[index] = result
    return _render_cell_calldata(index + 1)
end
