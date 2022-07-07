%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.starknet.common.syscalls import call_contract, get_contract_address
from starkware.cairo.common.alloc import alloc
from onlydust.stream.default_implementation import stream

from contracts.math import sum, prod

# from contracts.math import sum

@event
func CellUpdated(id : felt, value : felt):
end

# Each token is a cell in the grid. Each cell has a number of dependencies and a value to execute.
# If there is no dependency, the value is a constant, otherwise it is a function identifier.
struct CellData:
    member dependencies_len : felt
    member value : felt
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

func Starksheet_renderCell{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    value : felt
) -> (result : felt):
    alloc_locals
    let (value, dependencies_len, dependencies) = Starksheet_getCell(value)
    let result = value
    if dependencies_len == 0:
        return (result)
    end
    # %{
    #     for i in range(ids.dependencies_len):
    #         print(f"{ids.dependencies[i]}=")
    # %}
    let (dependencies) = stream.map(Starksheet_renderCell, dependencies_len, dependencies)
    # %{
    #     for i in range(ids.dependencies_len):
    #         print(f"{ids.dependencies[i]}=")
    # %}

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
    if value == 1745323118234039575158332314383998379920114756853600128775583542343013246395:
        let (result) = sum(dependencies_len, dependencies)
    else:
        let (result) = prod(dependencies_len, dependencies)
    end

    return (result)
end
