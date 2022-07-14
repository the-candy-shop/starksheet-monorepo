%lang starknet

from starkware.cairo.common.alloc import alloc
from starkware.starknet.common.syscalls import get_caller_address
from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.cairo.common.math_cmp import is_not_zero
from openzeppelin.token.erc721.ERC721_Mintable_Burnable import constructor
from openzeppelin.token.erc721.library import _exists, ERC721_ownerOf
from starkware.cairo.common.uint256 import split_64, Uint256
from openzeppelin.utils.constants import TRUE

from contracts.library import (
    Starksheet_getCell,
    Starksheet_setCell,
    Starksheet_renderCell,
    Starksheet_renderGrid,
    Starksheet_mint,
    Starksheet_mintBatch,
    CellRendered,
)
from contracts.constants import GRID_SIZE

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

    with_attr error_message("setCell: caller is not owner"):
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
) -> (cell : CellRendered):
    let (cell) = Starksheet_renderCell(tokenId)
    return (cell)
end

@view
func renderGrid{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}() -> (
    cells_len : felt, cells : CellRendered*
):
    alloc_locals
    let (local cells : CellRendered*) = alloc()
    let stop = GRID_SIZE
    Starksheet_renderGrid{cells=cells, stop=stop}(0)
    return (GRID_SIZE, cells)
end

@external
func mintPublic{pedersen_ptr : HashBuiltin*, syscall_ptr : felt*, range_check_ptr}(
    tokenId : Uint256
):
    # TODO: add some value / payment checks in prod
    Starksheet_mint(tokenId)
    return ()
end

@external
func mintBatchPublic{pedersen_ptr : HashBuiltin*, syscall_ptr : felt*, range_check_ptr}(
    tokenIds_len : felt, tokenIds : Uint256*
):
    # TODO: add some value / payment checks in prod
    Starksheet_mintBatch(tokenIds_len, tokenIds)
    return ()
end
