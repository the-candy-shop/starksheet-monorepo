%lang starknet
from starkware.cairo.common.uint256 import Uint256

@contract_interface
namespace ICellRenderer {
    func token_uri(token_id: felt, value: felt, name: felt) -> (
        data_uri_len: felt, data_uri: felt*
    ) {
    }
}

@contract_interface
namespace IERC20 {
    func transferFrom(sender: felt, recipient: felt, amount: Uint256) -> (success: felt) {
    }
}
