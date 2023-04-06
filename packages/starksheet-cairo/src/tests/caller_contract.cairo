%lang starknet

from tests.caller_user import ICallerUser
from starkware.starknet.common.syscalls import call_contract
from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.cairo_builtins import HashBuiltin

@external
func fun_calling_a_fun_using_get_caller{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr
}(caller_user_address: felt, selector: felt) {
    ICallerUser.fun_with_get_caller(contract_address=caller_user_address);
    let (calldata: felt*) = alloc();
    call_contract(caller_user_address, selector, 0, calldata);
    return ();
}
