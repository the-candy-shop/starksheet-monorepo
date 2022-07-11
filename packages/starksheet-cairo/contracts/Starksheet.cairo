%lang starknet

from starkware.cairo.common.alloc import alloc
from starkware.starknet.common.syscalls import get_caller_address
from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.cairo.common.math_cmp import is_nn
from openzeppelin.token.erc721.ERC721_Mintable_Burnable import constructor
from openzeppelin.token.erc721.library import _exists, ERC721_ownerOf, ERC721_mint
from starkware.cairo.common.uint256 import split_64, Uint256
from openzeppelin.utils.constants import TRUE

from contracts.library import Starksheet_getCell, Starksheet_setCell, Starksheet_renderCell

@external
func setCell{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    tokenId : felt, value : felt, dependencies_len : felt, dependencies : felt*
):
    alloc_locals
    let (low, high) = split_64(tokenId)
    let token_id = Uint256(low, high)

    with_attr error_message("setCell: tokenId does not exist"):
        let (exist) = _exists(token_id)
        assert exist = TRUE
    end

    with_attr error_message("setCell: sender is not owner"):
        let (owner) = ERC721_ownerOf(token_id)
        let (caller) = get_caller_address()
        assert owner = caller
    end

    Starksheet_setCell(tokenId, value, dependencies_len, dependencies)
    return ()
end

@view
func getCell{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(tokenId : felt) -> (
    value : felt, dependencies_len : felt, dependencies : felt*
):
    let res = Starksheet_getCell(tokenId)
    return (res.value, res.dependencies_len, res.dependencies)
end

@view
func renderCell{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    tokenId : felt
) -> (value : felt):
    let (res) = Starksheet_renderCell(tokenId)
    return (res)
end

@external
func mintPublic{pedersen_ptr : HashBuiltin*, syscall_ptr : felt*, range_check_ptr}(
    tokenId : Uint256
):
    let (to) = get_caller_address()
    ERC721_mint(to, tokenId)
    return ()
end
