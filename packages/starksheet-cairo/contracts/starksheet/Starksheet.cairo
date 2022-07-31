%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin
from openzeppelin.access.ownable import Ownable

from contracts.starksheet.library import Starksheet

@external
func setSheetDefaultRendererAddress{
    syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr
}(address : felt):
    Ownable.assert_only_owner()
    Starksheet.set_sheet_default_renderer_address(address)
    return ()
end

@view
func getSheetDefaultRendererAddress{
    syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr
}() -> (address : felt):
    return Starksheet.get_sheet_default_renderer_address()
end

@external
func setSheetClassHash{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    hash : felt
):
    Ownable.assert_only_owner()
    Starksheet.set_sheet_class_hash(hash)
    return ()
end

@view
func getSheetClassHash{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}() -> (
    hash : felt
):
    return Starksheet.get_sheet_class_hash()
end

@view
func getSheets{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}() -> (
    addresses_len : felt, addresses : felt*
):
    let (addresses_len, addresses) = Starksheet.get_sheets()
    return (addresses_len, addresses)
end

@view
func getSheet{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(index : felt) -> (
    address : felt
):
    return Starksheet.get_sheet(index)
end

@external
func addSheet{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    name : felt, symbol : felt
) -> (address : felt):
    return Starksheet.add_sheet(name, symbol)
end

@constructor
func constructor{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    owner : felt, sheet_class_hash : felt, default_renderer_address : felt
):
    Ownable.initializer(owner)
    Starksheet.set_sheet_class_hash(sheet_class_hash)
    Starksheet.set_sheet_default_renderer_address(default_renderer_address)
    return ()
end
