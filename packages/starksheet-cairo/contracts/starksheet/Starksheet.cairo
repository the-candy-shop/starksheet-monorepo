%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin
from openzeppelin.access.ownable import Ownable_only_owner, Ownable_initializer

from contracts.starksheet.library import (
    Starksheet_getSheetClassHash,
    Starksheet_setSheetClassHash,
    Starksheet_getSheetDefaultRendererAddress,
    Starksheet_setSheetDefaultRendererAddress,
    Starksheet_getSheet,
    Starksheet_getSheets,
    Starksheet_addSheet,
)

@external
func setSheetDefaultRendererAddress{
    syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr
}(address : felt):
    Ownable_only_owner()
    Starksheet_setSheetDefaultRendererAddress(address)
    return ()
end

@view
func getSheetDefaultRendererAddress{
    syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr
}() -> (address : felt):
    return Starksheet_getSheetDefaultRendererAddress()
end

@external
func setSheetClassHash{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    hash : felt
):
    Ownable_only_owner()
    Starksheet_setSheetClassHash(hash)
    return ()
end

@view
func getSheetClassHash{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}() -> (
    hash : felt
):
    return Starksheet_getSheetClassHash()
end

@view
func getSheets{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}() -> (
    addresses_len : felt, addresses : felt*
):
    let (addresses_len, addresses) = Starksheet_getSheets()
    return (addresses_len, addresses)
end

@view
func getSheet{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(index : felt) -> (
    address : felt
):
    return Starksheet_getSheet(index)
end

@external
func addSheet{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    name : felt, symbol : felt
) -> (address : felt):
    return Starksheet_addSheet(name, symbol)
end

@constructor
func constructor{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    owner : felt, sheet_class_hash : felt, default_renderer_address : felt
):
    Ownable_initializer(owner)
    Starksheet_setSheetClassHash(sheet_class_hash)
    Starksheet_setSheetDefaultRendererAddress(default_renderer_address)
    return ()
end
