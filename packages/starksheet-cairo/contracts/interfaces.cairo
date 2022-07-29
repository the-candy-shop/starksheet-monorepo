%lang starknet

@contract_interface
namespace ICellRenderer:
    func token_uri(token_id : felt, value : felt, name : felt) -> (
        data_uri_len : felt, data_uri : felt*
    ):
    end
end
