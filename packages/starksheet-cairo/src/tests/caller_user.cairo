%lang starknet

from starkware.starknet.common.syscalls import get_caller_address, get_tx_info
from starkware.cairo.common.cairo_builtins import HashBuiltin

@contract_interface
namespace ICallerUser {
    func fun_with_get_caller() -> () {
    }
}

@external
func fun_with_get_caller{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() {
    alloc_locals;
    let (caller) = get_caller_address();
    %{ print(f"{ids.caller=}") %}
    let (local tx_info) = get_tx_info();
    let account_contract_address = tx_info.account_contract_address;
    %{ print(f"{ids.account_contract_address=}") %}
    return ();
}
