%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin
from openzeppelin.access.ownable.library import Ownable
from openzeppelin.token.erc20.IERC20 import IERC20
from starkware.starknet.common.syscalls import get_caller_address, get_contract_address
from starkware.cairo.common.uint256 import Uint256

from constants import ETH_ADDRESS
from starksheet.library import Starksheet

@external
func setSheetDefaultRendererAddress{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr
}(address: felt) {
    Ownable.assert_only_owner();
    Starksheet.set_sheet_default_renderer_address(address);
    return ();
}

@view
func getSheetDefaultRendererAddress{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr
}() -> (address: felt) {
    return Starksheet.get_sheet_default_renderer_address();
}

@external
func setSheetClassHash{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    hash: felt
) {
    Ownable.assert_only_owner();
    Starksheet.set_sheet_class_hash(hash);
    return ();
}

@view
func getSheetClassHash{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    hash: felt
) {
    return Starksheet.get_sheet_class_hash();
}

@external
func setProxyClassHash{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    hash: felt
) {
    Ownable.assert_only_owner();
    Starksheet.set_proxy_class_hash(hash);
    return ();
}

@view
func getProxyClassHash{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    hash: felt
) {
    return Starksheet.get_proxy_class_hash();
}

@external
func setSheetPrice{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(price: felt) {
    Ownable.assert_only_owner();
    Starksheet.set_sheet_price(price);
    return ();
}

@view
func getSheetPrice{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    price: felt
) {
    return Starksheet.get_sheet_price();
}

@external
func setMerkleRoot{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(hash: felt) {
    Ownable.assert_only_owner();
    Starksheet.set_merkle_root(hash);
    return ();
}

@view
func getMerkleRoot{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    hash: felt
) {
    return Starksheet.get_merkle_root();
}

@view
func getSheets{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    addresses_len: felt, addresses: felt*
) {
    let (addresses_len, addresses) = Starksheet.get_sheets();
    return (addresses_len, addresses);
}

@view
func getSheet{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(index: felt) -> (
    address: felt
) {
    return Starksheet.get_sheet(index);
}

@external
func addSheet{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    name: felt, symbol: felt, proof_len: felt, proof: felt*
) -> (address: felt) {
    let (sheet_price) = Starksheet.get_sheet_price();
    let (sender) = get_caller_address();
    let (recipient) = get_contract_address();
    IERC20.transferFrom(
        contract_address=ETH_ADDRESS,
        sender=sender,
        recipient=recipient,
        amount=Uint256(sheet_price, 0),
    );
    return Starksheet.add_sheet(name, symbol, proof_len, proof);
}

@external
func withdraw{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() {
    Ownable.assert_only_owner();
    let (contract_address) = get_contract_address();
    let (amount) = IERC20.balanceOf(contract_address=ETH_ADDRESS, account=contract_address);
    let (recipient) = Ownable.owner();
    IERC20.transfer(contract_address=ETH_ADDRESS, recipient=recipient, amount=amount);
    return ();
}

@constructor
func constructor{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    owner: felt,
    sheet_class_hash: felt,
    proxy_class_hash: felt,
    default_renderer_address: felt,
    sheet_price: felt,
) {
    Ownable.initializer(owner);
    Starksheet.set_sheet_class_hash(sheet_class_hash);
    Starksheet.set_proxy_class_hash(proxy_class_hash);
    Starksheet.set_sheet_default_renderer_address(default_renderer_address);
    Starksheet.set_sheet_price(sheet_price);
    return ();
}
