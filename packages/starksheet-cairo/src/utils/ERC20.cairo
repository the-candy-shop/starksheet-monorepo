%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.cairo.common.uint256 import Uint256, uint256_le
from starkware.starknet.common.syscalls import get_caller_address
from starkware.cairo.common.bool import TRUE

from openzeppelin.token.erc20.library import ERC20

from openzeppelin.access.ownable.library import Ownable

@constructor
func constructor{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    name: felt, symbol: felt, initial_supply: Uint256, owner_address: felt
) {
    ERC20.initializer(name, symbol, 18);
    ERC20._mint(owner_address, initial_supply);
    Ownable.initializer(owner_address);

    return ();
}

//
// Getters
//

@view
func name{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (name: felt) {
    let (name) = ERC20.name();

    return (name,);
}

@view
func symbol{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (symbol: felt) {
    let (symbol) = ERC20.symbol();

    return (symbol,);
}

@view
func totalSupply{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    totalSupply: Uint256
) {
    let (totalSupply: Uint256) = ERC20.total_supply();

    return (totalSupply,);
}

@view
func decimals{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    decimals: felt
) {
    let (decimals) = ERC20.decimals();

    return (decimals,);
}

@view
func balanceOf{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    account_address: felt
) -> (balance: Uint256) {
    let (balance: Uint256) = ERC20.balance_of(account_address);

    return (balance,);
}

@view
func allowance{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    owner_address: felt, spender_address: felt
) -> (remaining: Uint256) {
    let (remaining: Uint256) = ERC20.allowance(owner_address, spender_address);

    return (remaining,);
}

@view
func get_owner{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    owner_address: felt
) {
    let (owner_address) = Ownable.owner();

    return (owner_address,);
}

//
// Externals
//

@external
func transfer{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    recipient_address: felt, amount: Uint256
) -> (success: felt) {
    ERC20.transfer(recipient_address, amount);

    return (TRUE,);
}

@external
func transferFrom{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    sender_address: felt, recipient_address: felt, amount: Uint256
) -> (success: felt) {
    ERC20.transfer_from(sender_address, recipient_address, amount);

    return (TRUE,);
}

@external
func approve{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    spender_address: felt, amount: Uint256
) -> (success: felt) {
    ERC20.approve(spender_address, amount);

    return (TRUE,);
}

@external
func increaseAllowance{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    spender_address: felt, added_value: Uint256
) -> (success: felt) {
    ERC20.increase_allowance(spender_address, added_value);

    return (TRUE,);
}

@external
func decreaseAllowance{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    spender_address: felt, subtracted_value: Uint256
) -> (success: felt) {
    ERC20.decrease_allowance(spender_address, subtracted_value);

    return (TRUE,);
}

@external
func transfer_ownership{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    new_owner_address: felt
) -> (new_owner_address: felt) {
    Ownable.transfer_ownership(new_owner_address);

    return (new_owner_address,);
}

// For testnet only
// Let user mint some tokens freely
@external
func freeMint{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(amount: Uint256) -> (
    success: felt
) {
    // Limit to 1k token per call
    let (is_amount_less_than_1000) = uint256_le(amount, Uint256(1000 * 10 ** 18, 0));
    assert is_amount_less_than_1000 = TRUE;

    // Mint tokens to call address
    let (caller_address) = get_caller_address();
    ERC20._mint(caller_address, amount);

    return (TRUE,);
}
