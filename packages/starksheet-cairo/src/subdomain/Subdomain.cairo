%lang starknet

from openzeppelin.upgrades.library import Proxy
from starkware.cairo.common.bool import TRUE, FALSE
from starkware.cairo.common.cairo_builtins import HashBuiltin, SignatureBuiltin
from starkware.cairo.common.hash import hash2
from starkware.cairo.common.signature import verify_ecdsa_signature
from starkware.cairo.common.uint256 import Uint256
from starkware.cairo.common.math_cmp import is_not_zero, is_le
from starkware.cairo.common.math import unsigned_div_rem, assert_le_felt, assert_le, split_felt
from starkware.starknet.common.syscalls import get_caller_address, get_contract_address, get_tx_info
from starkware.cairo.common.alloc import alloc
from interfaces import IStarknetId, INaming, ISheet

// Storage
@storage_var
func _naming_contract() -> (address: felt) {
}

@storage_var
func _starknetid_contract() -> (address: felt) {
}

@storage_var
func _admin_address() -> (address: felt) {
}

@storage_var
func _is_registration_open() -> (boolean: felt) {
}

// Proxy

@external
func initializer{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    proxy_admin_address: felt, starknetid_contract: felt, naming_contract: felt
) {
    // Can only be called if there is no admin
    let (current_admin) = _admin_address.read();
    assert current_admin = 0;

    _admin_address.write(proxy_admin_address);
    _naming_contract.write(naming_contract);
    _starknetid_contract.write(starknetid_contract);

    return ();
}

// External functions
@external
func claim_domain_back{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    domain_len: felt, domain: felt*
) {
    alloc_locals;

    // Check that the caller is the admin
    with_attr error_message("You are not the admin") {
        _check_admin();
    }

    // Get contracts addresses
    let (caller) = get_caller_address();
    let (current_contract, starknetid_contract, naming_contract) = _get_contracts_addresses();

    // Transfer back the starknet identity of the domain to the caller address
    let (token_id) = INaming.domain_to_token_id(naming_contract, domain_len, domain);
    let token_id_uint = Uint256(token_id, 0);
    IStarknetId.transferFrom(starknetid_contract, current_contract, caller, token_id_uint);

    return ();
}

@external
func register{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr, ecdsa_ptr: SignatureBuiltin*
}(domain_ascii: felt) -> (starknet_id_token: felt, domain_len: felt, domain: felt*) {
    alloc_locals;

    // Check if the registration is open
    let (is_registration_open) = _is_registration_open.read();
    with_attr error_message("The registration is closed") {
        assert is_registration_open = 1;
    }

    let (caller) = get_caller_address();
    let (tx_info) = get_tx_info();
    // Caller should be a Sheet, so using ISheet on caller is ok
    // Account caller should be sheet owner
    let (sheet_owner) = ISheet.owner(caller);
    assert sheet_owner = tx_info.account_contract_address;

    let (local domain_full) = alloc();
    let (local domain) = _basic_encoding(domain_ascii, 0);
    assert [domain_full] = domain;
    assert [domain_full + 1] = 57533483116;  // "onsheet" encoded
    with_attr error_message("Name {domain} is not available") {
        let (naming_contract) = _naming_contract.read();
        let (address) = INaming.domain_to_address(naming_contract, 2, domain_full);
        let is_name_taken = is_not_zero(address);
        assert is_name_taken = FALSE;
    }

    let (starknet_id_contract) = _starknetid_contract.read();
    // Somehow random starknet token id <= 2**64 based on sheet address + tx_nonce to avoid collision
    let (_, low) = split_felt(caller);
    let (_, token_id) = unsigned_div_rem(low, 2 ** 64);
    let token_id = token_id + tx_info.nonce;
    let (current_contract) = get_contract_address();
    with_attr error_message("token_id = {token_id}") {
        IStarknetId.mint(starknet_id_contract, token_id);
        INaming.transfer_domain(naming_contract, 2, domain_full, token_id);
        INaming.set_domain_to_address(
            naming_contract, 2, domain_full, tx_info.account_contract_address
        );
        let token_id_u256 = Uint256(token_id, 0);
        IStarknetId.transferFrom(
            starknet_id_contract, current_contract, tx_info.account_contract_address, token_id_u256
        );
    }

    return (token_id, 2, domain_full);
}

//
// Admin functions
//

@external
func open_registration{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> () {
    _check_admin();
    _is_registration_open.write(1);

    return ();
}

@external
func close_registration{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> () {
    _check_admin();
    _is_registration_open.write(0);

    return ();
}

//
// View functions
//

@view
func is_registration_open{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    is_registration_open: felt
) {
    let (is_registration_open) = _is_registration_open.read();

    return (is_registration_open,);
}

@view
func basic_encoding{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    domain_ascii: felt
) -> (domain_encoded: felt) {
    assert_le_felt(domain_ascii, 2 ** 128);
    return _basic_encoding(domain_ascii, 0);
}
//
// Utils
//

func _check_admin{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> () {
    let (caller) = get_caller_address();
    let (admin) = _admin_address.read();
    with_attr error_message("You can not call this function cause you are not the admin.") {
        assert caller = admin;
    }

    return ();
}

func _get_contracts_addresses{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    ) -> (current_contract: felt, starknetid_contract: felt, naming_contract: felt) {
    let (current_contract) = get_contract_address();
    let (starknetid_contract) = _starknetid_contract.read();
    let (naming_contract) = _naming_contract.read();

    return (current_contract, starknetid_contract, naming_contract);
}

// @notice following the basic encoding scheme described here https://docs.starknet.id/for-devs/encoding-algorithm
// @dev the encoding writes down a word in base 38 with symbols being in this order abcdefghijklmnopqrstuvwxyz0123456789-
// @dev this simple version considers that only a-z0-9- char will be used and that
// @dev domain_ascii is no longer than 16 char
func _basic_encoding{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    domain_ascii: felt, domain_encoded: felt
) -> (domain_encoded: felt) {
    alloc_locals;
    let non_final_step = is_le(256, domain_ascii);
    // ie. this is the final step, comparing to FALSE for saving one step
    if (non_final_step == 0) {
        let base_38 = _ascii_to_starknet_id_base(domain_ascii);
        return (domain_encoded=domain_encoded * 38 + base_38);
    }

    let (local str, char) = unsigned_div_rem(domain_ascii, 256);
    let base_38 = _ascii_to_starknet_id_base(char);
    return _basic_encoding(str, domain_encoded * 38 + base_38);
}

func _ascii_to_starknet_id_base{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    ascii: felt
) -> felt {
    // in ascii, a = 0x61, 0 = 0x30, - = 0x2d
    if (ascii == 0x2d) {
        return 36;
    }
    let is_letter = is_le(0x61, ascii);
    if (is_letter == 0) {
        // assume this is a number in 0-9
        // -30 <=> 0 = 0, then + 26 for position of 0 in starknetid base
        let index = ascii - 0x30 + 26;
        assert_le(index, 35);
        assert_le(26, index);
        return index;
    }
    let index = ascii - 0x61;
    assert_le(index, 25);
    return index;
}
