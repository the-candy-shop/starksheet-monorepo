%lang starknet

from starkware.starknet.common.syscalls import get_caller_address, get_tx_info
from starkware.cairo.common.cairo_builtins import HashBuiltin

// Since Starknet doesn't prevent @view entrypoint to be called during a
// tx, this utils lets ensure that not tx can be made by asserting that
// tx_info is 0
func assert_view_call{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() {
    alloc_locals;

    let (tx_info) = get_tx_info();
    with_attr error_mesage("Attempting to execute a @view") {
        assert tx_info.account_contract_address = 0;
        assert tx_info.signature_len = 0;
    }

    return ();
}
