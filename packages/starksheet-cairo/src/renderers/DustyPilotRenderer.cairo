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
func initialized() -> (res: felt) {
}

@storage_var
func _thresholds_len() -> (res: felt) {
}

@storage_var
func _thresholds(index: felt) -> (value: felt) {
}

@view
func getOwner{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (owner: felt) {
    return Ownable.owner();
}

@view
func getThresholds{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    thresholds_len: felt, thresholds: felt*
) {
    alloc_locals;
    let (thresholds) = alloc();
    let (final) = _thresholds_read(0, thresholds);
    let (thresholds_len) = _thresholds_len.read();
    return (thresholds_len, thresholds);
}

@external
func setThresholds{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    thresholds_len: felt, thresholds: felt*
) {
    Ownable.assert_only_owner();
    _thresholds_len.write(thresholds_len);
    _thresholds_write(0, thresholds_len, thresholds);
    return ();
}

func _thresholds_write{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    index: felt, thresholds_len: felt, thresholds: felt*
) {
    if (index == thresholds_len) {
        return ();
    }
    let current = thresholds[index];
    _thresholds.write(index, current);
    return _thresholds_write(index + 1, thresholds_len, thresholds);
}

func _thresholds_read{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    index: felt, thresholds: felt*
) -> (thresholds: felt*) {
    let (max_len) = _thresholds_len.read();
    if (index == max_len) {
        return (thresholds=thresholds);
    }
    let (current) = _thresholds.read(index);
    assert [thresholds] = current;
    return _thresholds_read(index + 1, thresholds + 1);
}

@external
func transferOwnership{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    new_owner: felt
) {
    Ownable.transfer_ownership(new_owner);
    return ();
}

@external
func initialize{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(owner: felt) {
    let (initialized_) = initialized.read();
    assert initialized_ = 0;
    Ownable.initializer(owner);
    initialized.write(1);
    return ();
}

func _find_index{pedersen_ptr: HashBuiltin*, syscall_ptr: felt*, range_check_ptr}(
    rarity: felt, arr_len: felt, arr: felt*
) -> (index: felt) {
    if (arr_len == 0) {
        return (index=2 ** 128);
    }
    let current = [arr];
    let index = is_le(rarity, current);
    if (index == 0) {
        return _find_index(rarity, arr_len - 1, arr + 1);
    }
    return (index=arr_len);
}

@view
func token_uri{pedersen_ptr: HashBuiltin*, syscall_ptr: felt*, range_check_ptr}(
    token_id: felt, value: felt, name: felt
) -> (token_uri_len: felt, token_uri: felt*) {
    alloc_locals;
    let (base_uri) = get_label_location(base_uri_dw);
    let (token_uri) = alloc();
    local token_uri_len = 123;
    memcpy(token_uri, base_uri, token_uri_len);

    let (thresholds) = alloc();
    _thresholds_read(0, thresholds);
    let (local thresholds_len) = _thresholds_len.read();

    let (rarity) = hash2{hash_ptr=pedersen_ptr}(token_id, value);
    let (_, rarity) = split_felt(rarity);
    let (_, rarity) = unsigned_div_rem(rarity, thresholds[thresholds_len - 1]);
    let (token_id) = _find_index(rarity, thresholds_len, thresholds);
    let token_id = thresholds_len - token_id + 1;
    let (token_id_ascii) = str(token_id);

    // return (token_uri_len, token_uri);
    assert [token_uri + token_uri_len] = token_id_ascii;
    assert [token_uri + token_uri_len + 1] = '.json';
    return (token_uri_len + 2, token_uri);

    base_uri_dw:
    dw 104;
    dw 116;
    dw 116;
    dw 112;
    dw 115;
    dw 58;
    dw 47;
    dw 47;
    dw 114;
    dw 97;
    dw 119;
    dw 46;
    dw 103;
    dw 105;
    dw 116;
    dw 104;
    dw 117;
    dw 98;
    dw 117;
    dw 115;
    dw 101;
    dw 114;
    dw 99;
    dw 111;
    dw 110;
    dw 116;
    dw 101;
    dw 110;
    dw 116;
    dw 46;
    dw 99;
    dw 111;
    dw 109;
    dw 47;
    dw 116;
    dw 104;
    dw 101;
    dw 45;
    dw 99;
    dw 97;
    dw 110;
    dw 100;
    dw 121;
    dw 45;
    dw 115;
    dw 104;
    dw 111;
    dw 112;
    dw 47;
    dw 115;
    dw 116;
    dw 97;
    dw 114;
    dw 107;
    dw 115;
    dw 104;
    dw 101;
    dw 101;
    dw 116;
    dw 45;
    dw 109;
    dw 111;
    dw 110;
    dw 111;
    dw 114;
    dw 101;
    dw 112;
    dw 111;
    dw 47;
    dw 109;
    dw 97;
    dw 105;
    dw 110;
    dw 47;
    dw 112;
    dw 97;
    dw 99;
    dw 107;
    dw 97;
    dw 103;
    dw 101;
    dw 115;
    dw 47;
    dw 115;
    dw 116;
    dw 97;
    dw 114;
    dw 107;
    dw 115;
    dw 104;
    dw 101;
    dw 101;
    dw 116;
    dw 45;
    dw 99;
    dw 97;
    dw 105;
    dw 114;
    dw 111;
    dw 47;
    dw 100;
    dw 117;
    dw 115;
    dw 116;
    dw 95;
    dw 112;
    dw 105;
    dw 108;
    dw 111;
    dw 116;
    dw 115;
    dw 47;
    dw 116;
    dw 111;
    dw 107;
    dw 101;
    dw 110;
    dw 95;
    dw 117;
    dw 114;
    dw 105;
    dw 115;
    dw 47;
}
