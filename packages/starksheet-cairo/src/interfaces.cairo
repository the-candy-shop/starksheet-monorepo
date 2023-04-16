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

@contract_interface
namespace INaming {
    // View functions

    func domain_to_address(domain_len: felt, domain: felt*) -> (address: felt) {
    }

    func domain_to_expiry(domain_len: felt, domain: felt*) -> (address: felt) {
    }

    func address_to_domain(address: felt) -> (domain_len: felt, domain: felt*) {
    }

    func domain_to_token_id(domain_len: felt, domain: felt*) -> (owner: felt) {
    }

    // Setters

    func set_domain_to_address(domain_len: felt, domain: felt*, address: felt) {
    }

    func set_address_to_domain(domain_len: felt, domain: felt*) {
    }

    func book_domain(domain_hash: felt) {
    }

    func buy(token_id: felt, domain: felt, days: felt, resolver: felt, address: felt) {
    }

    func renew(domain: felt, days: felt) {
    }

    func transfer_domain(domain_len: felt, domain: felt*, target_token_id: felt) {
    }

    func reset_subdomains(domain_len: felt, domain: felt*) {
    }

    // Admin setters

    func set_admin(address: felt) {
    }

    func set_domain_owner(domain_len: felt, domain: felt*, token_id: felt) {
    }

    func set_pricing_contract(address: felt) {
    }

    func transfer_balance(erc20: felt, amount: Uint256) {
    }

    func whitelisted_mint(domain, expiry, starknet_id, receiver_address, sig: (felt, felt)) {
    }

    func end_whitelist() {
    }

    func set_l1_contract(l1_contract) {
    }

    func upgrade(new_implementation: felt) {
    }
}

@contract_interface
namespace IStarknetId {
    func name() -> (name: felt) {
    }

    func symbol() -> (symbol: felt) {
    }

    func balanceOf(owner: felt) -> (balance: Uint256) {
    }

    func ownerOf(token_id: Uint256) -> (owner: felt) {
    }

    func owner_of(token_id: felt) -> (owner: felt) {
    }

    func getApproved(token_id: Uint256) -> (approved: felt) {
    }

    func isApprovedForAll(owner: felt, operator: felt) -> (is_approved: felt) {
    }

    func tokenURI(tokenId: Uint256) -> (tokenURI_len: felt, tokenURI: felt*) {
    }

    func get_user_data(token_id: felt, field: felt) -> (data: felt) {
    }

    func get_verifier_data(token_id: felt, field: felt, address: felt) -> (data: felt) {
    }

    func get_confirmed_data(token_id: felt, field: felt, address: felt) -> (data: felt) {
    }

    func approve(to: felt, token_id: Uint256) {
    }

    func setApprovalForAll(operator: felt, approved: felt) {
    }

    func transferFrom(_from: felt, to: felt, token_id: Uint256) {
    }

    func safeTransferFrom(_from: felt, to: felt, token_id: Uint256, data_len: felt, data: felt*) {
    }

    func mint(token_id: felt) {
    }

    func set_user_data(token_id: felt, field: felt, data: felt) {
    }

    func set_verifier_data(token_id: felt, field: felt, data: felt) {
    }
}

@contract_interface
namespace ISheet {
    func getCell(tokenId: felt) -> (
        contractAddress: felt, value: felt, cell_calldata_len: felt, cell_calldata: felt*
    ) {
    }

    func getOwner() -> (owner: felt) {
    }
}
