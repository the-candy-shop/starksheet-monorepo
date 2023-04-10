%lang starknet

from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.cairo.common.bool import TRUE
from starkware.cairo.common.math_cmp import is_not_zero
from starkware.starknet.common.syscalls import get_caller_address, deploy, get_contract_address

from utils.string import str
from utils.merkle_tree import merkle_verify, addresses_to_leafs, merkle_build, _hash_sorted

@storage_var
func Starksheet_proxy_class_hash() -> (hash: felt) {
}

@storage_var
func Starksheet_sheet_class_hash() -> (hash: felt) {
}

@storage_var
func Starksheet_sheet_default_renderer_address() -> (address: felt) {
}

@storage_var
func Starksheet_sheets(id: felt) -> (address: felt) {
}

@storage_var
func Starksheet_sheets_count() -> (count: felt) {
}

@storage_var
func Starksheet_merkle_root() -> (hash: felt) {
}

@storage_var
func Starksheet_sheet_price() -> (price: felt) {
}

namespace Starksheet {
    func get_sheet{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(id: felt) -> (
        address: felt
    ) {
        return Starksheet_sheets.read(id);
    }

    func get_sheets{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
        addresses_len: felt, addresses: felt*
    ) {
        alloc_locals;
        let (stop) = Starksheet_sheets_count.read();
        let (local addresses: felt*) = alloc();
        _get_sheets_loop{stop=stop, addresses=addresses}(0);
        return (addresses_len=stop, addresses=addresses);
    }

    func add_sheet{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        name: felt, symbol: felt, proof_len: felt, proof: felt*
    ) -> (address: felt) {
        alloc_locals;
        let (sheet_class_hash) = Starksheet_sheet_class_hash.read();
        let (proxy_class_hash) = Starksheet_proxy_class_hash.read();
        let (local sheets_count) = Starksheet_sheets_count.read();
        let (owner) = get_caller_address();

        let (root) = Starksheet_merkle_root.read();
        let allow_list_enabled = is_not_zero(root);
        let (leaf) = _hash_sorted{hash_ptr=pedersen_ptr}(owner, owner);
        let (is_allow_list) = merkle_verify(leaf, root, proof_len, proof);
        with_attr error_message("addSheet: proof is not valid") {
            assert is_allow_list = allow_list_enabled;
        }

        let (local calldata_: felt*) = alloc();
        let (renderer) = Starksheet_sheet_default_renderer_address.read();
        assert calldata_[0] = sheet_class_hash;  // implementation
        assert calldata_[1] = 0x79dc0da7c54b95f10aa182ad0a46400db63156920adb65eca2654c0945a463;  // selector
        assert calldata_[2] = 6; // calldata_len
        assert calldata_[3] = name; // calldata*
        assert calldata_[4] = symbol;
        assert calldata_[5] = owner;
        assert calldata_[6] = 0;
        assert calldata_[7] = 0;
        assert calldata_[8] = renderer;

        let (address) = deploy(
            class_hash=proxy_class_hash,
            contract_address_salt=owner,
            constructor_calldata_size=9,
            constructor_calldata=calldata_,
            deploy_from_zero=0,
        );

        Starksheet_sheets.write(sheets_count, address);
        Starksheet_sheets_count.write(sheets_count + 1);
        return (address,);
    }

    func get_sheet_class_hash{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        ) -> (hash: felt) {
        return Starksheet_sheet_class_hash.read();
    }

    func set_sheet_class_hash{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        hash: felt
    ) {
        Starksheet_sheet_class_hash.write(hash);
        return ();
    }

    func get_proxy_class_hash{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        ) -> (hash: felt) {
        return Starksheet_proxy_class_hash.read();
    }

    func set_proxy_class_hash{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        hash: felt
    ) {
        Starksheet_proxy_class_hash.write(hash);
        return ();
    }

    func get_sheet_price{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
        price: felt
    ) {
        return Starksheet_sheet_price.read();
    }

    func set_sheet_price{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        price: felt
    ) {
        Starksheet_sheet_price.write(price);
        return ();
    }

    func get_sheet_default_renderer_address{
        syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr
    }() -> (address: felt) {
        return Starksheet_sheet_default_renderer_address.read();
    }

    func set_sheet_default_renderer_address{
        syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr
    }(address: felt) {
        Starksheet_sheet_default_renderer_address.write(address);
        return ();
    }

    func get_merkle_root{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
        hash: felt
    ) {
        return Starksheet_merkle_root.read();
    }

    func set_merkle_root{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        hash: felt
    ) {
        Starksheet_merkle_root.write(hash);
        return ();
    }
}

// Internal

func _get_sheets_loop{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr, stop: felt, addresses: felt*
}(index: felt) {
    if (index == stop) {
        return ();
    }
    let (address) = Starksheet_sheets.read(index);
    assert [addresses + index] = address;
    return _get_sheets_loop(index + 1);
}
