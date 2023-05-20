%lang starknet
from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.cairo_builtins import HashBuiltin
from openzeppelin.access.ownable.library import Ownable
from utils.string import str
from starkware.cairo.common.hash import hash2
from starkware.cairo.common.math import unsigned_div_rem, split_felt
from starkware.cairo.common.math_cmp import is_le
from starkware.cairo.common.registers import get_label_location
from starkware.cairo.common.memcpy import memcpy

@storage_var
func _uris_len() -> (res: felt) {
}

@storage_var
func _uris(index: felt) -> (value: felt) {
}

@view
func getOwner{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (owner: felt) {
    return Ownable.owner();
}

@view
func getUris{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    uris_len: felt, uris: felt*
) {
    alloc_locals;
    let (uris) = alloc();
    _uris_read(index=0, uris=uris);
    let (uris_len) = _uris_len.read();
    return (uris_len, uris);
}

@view
func getUri{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(index: felt) -> (
    uri_len: felt, uri: felt*
) {
    return _get_uri(index);
}

@view
func testUris{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    encoded_uris_len: felt, encoded_uris: felt*, index: felt
) -> (uri_len: felt, uri: felt*) {
    alloc_locals;
    let pos = [encoded_uris + index];
    let uri_len = [encoded_uris + pos];
    let start = pos + 1;
    let (uri: felt*) = alloc();
    memcpy(uri, encoded_uris + start, uri_len);
    return (uri_len, uri);
}

@external
func setUris{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    uris_len: felt, uris: felt*
) {
    Ownable.assert_only_owner();
    _uris_len.write(uris_len);
    _uris_write(index=0, uris_len=uris_len, uris=uris);
    return ();
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
    owner: felt, uris_len: felt, uris: felt*
) {
    Ownable.initializer(owner);
    _uris_len.write(uris_len);
    _uris_write(index=0, uris_len=uris_len, uris=uris);
    return ();
}

@view
func token_uri{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    token_id: felt, value: felt, name: felt
) -> (token_uri_len: felt, token_uri: felt*) {
    alloc_locals;
    let (rarity) = hash2{hash_ptr=pedersen_ptr}(token_id, value);
    let (_, rarity) = split_felt(rarity);
    let (uri_count) = _uris.read(0);
    let (_, index) = unsigned_div_rem(rarity, uri_count);
    let (token_uri_len, token_uri) = _get_uri(index);
    return (token_uri_len, token_uri);
}

func _uris_write{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    index: felt, uris_len: felt, uris: felt*
) {
    if (index == uris_len) {
        return ();
    }
    let current = uris[index];
    _uris.write(index, current);
    return _uris_write(index + 1, uris_len, uris);
}

func _uris_read{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    index: felt, uris: felt*
) -> (uris: felt*) {
    let (max_len) = _uris_len.read();
    if (index == max_len) {
        return (uris=uris);
    }
    let (current) = _uris.read(index);
    assert [uris] = current;
    return _uris_read(index + 1, uris + 1);
}

func _get_uri{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(index: felt) -> (
    uri_len: felt, uri: felt*
) {
    alloc_locals;
    let (pos) = _uris.read(index);
    let (uri_len) = _uris.read(pos);
    let start = pos + 1;
    let (uri: felt*) = alloc();
    _read_into_array(start, start + uri_len, uri);
    return (uri_len, uri);
}

func _read_into_array{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    start: felt, stop: felt, arr: felt*
) {
    let _break = is_le(stop, start);
    if (_break == 1) {
        return ();
    }
    let (current) = _uris.read(start);
    assert [arr] = current;
    return _read_into_array(start + 1, stop, arr + 1);
}
