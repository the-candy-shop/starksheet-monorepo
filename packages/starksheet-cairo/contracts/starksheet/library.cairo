%lang starknet

from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.starknet.common.syscalls import get_caller_address, deploy

from contracts.utils.string import str

@storage_var
func Starksheet_sheet_class_hash() -> (hash : felt):
end

@storage_var
func Starksheet_sheet_default_renderer_address() -> (address : felt):
end

@storage_var
func Starksheet_sheets(id : felt) -> (address : felt):
end

@storage_var
func Starksheet_sheets_count() -> (count : felt):
end

func Starksheet_getSheet{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    id : felt
) -> (address : felt):
    return Starksheet_sheets.read(id)
end

func Starksheet_getSheets{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}() -> (
    addresses_len : felt, addresses : felt*
):
    alloc_locals
    let (stop) = Starksheet_sheets_count.read()
    let (local addresses : felt*) = alloc()
    _get_sheets_loop{stop=stop, addresses=addresses}(0)
    return (addresses_len=stop, addresses=addresses)
end

func Starksheet_addSheet{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    name : felt, symbol : felt
) -> (address : felt):
    alloc_locals
    let (class_hash) = Starksheet_sheet_class_hash.read()
    let (local sheets_count) = Starksheet_sheets_count.read()
    let (owner) = get_caller_address()
    let (local constructor_calldata : felt*) = alloc()
    if name == 0:
        let (count_str) = str(sheets_count)
        tempvar sheet_name = 'Sheet ' * 256 * 256 + count_str
        tempvar sheet_symbol = 'SHT' * 256 * 256 + count_str
        tempvar syscall_ptr = syscall_ptr
        tempvar pedersen_ptr = pedersen_ptr
        tempvar range_check_ptr = range_check_ptr
    else:
        tempvar sheet_name = name
        tempvar sheet_symbol = symbol
        tempvar syscall_ptr = syscall_ptr
        tempvar pedersen_ptr = pedersen_ptr
        tempvar range_check_ptr = range_check_ptr
    end
    let (renderer) = Starksheet_sheet_default_renderer_address.read()
    assert constructor_calldata[0] = sheet_name
    assert constructor_calldata[1] = sheet_symbol
    assert constructor_calldata[2] = owner
    assert constructor_calldata[3] = 0
    assert constructor_calldata[4] = 0
    assert constructor_calldata[5] = renderer

    let (address) = deploy(
        class_hash=class_hash,
        contract_address_salt=sheets_count,
        constructor_calldata_size=6,
        constructor_calldata=constructor_calldata,
        deploy_from_zero=0,
    )

    Starksheet_sheets.write(sheets_count, address)
    Starksheet_sheets_count.write(sheets_count + 1)
    return (address)
end

func Starksheet_getSheetClassHash{
    syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr
}() -> (hash : felt):
    return Starksheet_sheet_class_hash.read()
end

func Starksheet_setSheetClassHash{
    syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr
}(hash : felt):
    Starksheet_sheet_class_hash.write(hash)
    return ()
end

func Starksheet_getSheetDefaultRendererAddress{
    syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr
}() -> (address : felt):
    return Starksheet_sheet_default_renderer_address.read()
end

func Starksheet_setSheetDefaultRendererAddress{
    syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr
}(address : felt):
    Starksheet_sheet_default_renderer_address.write(address)
    return ()
end

# Internal

func _get_sheets_loop{
    syscall_ptr : felt*,
    pedersen_ptr : HashBuiltin*,
    range_check_ptr,
    stop : felt,
    addresses : felt*,
}(index : felt):
    if index == stop:
        return ()
    end
    let (address) = Starksheet_sheets.read(index)
    assert [addresses + index] = address
    return _get_sheets_loop(index + 1)
end
