%lang starknet
from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.cairo_builtins import HashBuiltin
from openzeppelin.access.ownable.library import Ownable
from utils.string import str
from starkware.starknet.common.syscalls import get_caller_address

@storage_var
func _use_token_id() -> (res: felt) {
}

@storage_var
func _base_uri_len() -> (res: felt) {
}

@storage_var
func _base_uri(index: felt) -> (value: felt) {
}

@view
func getUseTokenId{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    res: felt
) {
    return _use_token_id.read();
}

@external
func setUseTokenId{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(use: felt) {
    Ownable.assert_only_owner();
    _use_token_id.write(use);
    return ();
}

@view
func getOwner{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (owner: felt) {
    return Ownable.owner();
}

@external
func transferOwnership{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    new_owner: felt
) {
    Ownable.transfer_ownership(new_owner);
    return ();
}

@constructor
func constructor{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    owner: felt, base_uri_len: felt, base_uri: felt*
) {
    Ownable.initializer(owner);
    _base_uri_len.write(base_uri_len);
    _base_uri_write(0, base_uri_len, base_uri);
    _use_token_id.write(1);
    return ();
}

@view
func getBaseUri{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    base_uri_len: felt, base_uri: felt*
) {
    alloc_locals;
    let (base_uri) = alloc();
    let (final) = _base_uri_read(0, base_uri);
    let (base_uri_len) = _base_uri_len.read();
    return (base_uri_len, base_uri);
}

@external
func setBaseUri{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    base_uri_len: felt, base_uri: felt*
) {
    Ownable.assert_only_owner();
    _base_uri_len.write(base_uri_len);
    _base_uri_write(0, base_uri_len, base_uri);
    return ();
}

@view
func token_uri{pedersen_ptr: HashBuiltin*, syscall_ptr: felt*, range_check_ptr}(
    token_id: felt, value: felt, name: felt
) -> (token_uri_len: felt, token_uri: felt*) {
    alloc_locals;
    let (token_uri) = alloc();
    let (final) = _base_uri_read(0, token_uri);
    let (token_uri_len) = _base_uri_len.read();
    let (use) = _use_token_id.read();
    if (use == 0) {
        return (token_uri_len, token_uri);
    }
    let (token_id_ascii) = str(token_id);
    assert [final] = '/';
    assert [final + 1] = token_id_ascii;
    assert [final + 2] = '.json';
    return (token_uri_len + 3, token_uri);
}

func _base_uri_write{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    index: felt, base_uri_len: felt, base_uri: felt*
) {
    if (index == base_uri_len) {
        return ();
    }
    let current = base_uri[index];
    _base_uri.write(index, current);
    return _base_uri_write(index + 1, base_uri_len, base_uri);
}

func _base_uri_read{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    index: felt, base_uri: felt*
) -> (base_uri: felt*) {
    let (max_len) = _base_uri_len.read();
    if (index == max_len) {
        return (base_uri=base_uri);
    }
    let (current) = _base_uri.read(index);
    assert [base_uri] = current;
    return _base_uri_read(index + 1, base_uri + 1);
}
