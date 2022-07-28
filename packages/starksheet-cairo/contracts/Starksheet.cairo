%lang starknet

from starkware.cairo.common.alloc import alloc
from starkware.starknet.common.syscalls import get_caller_address
from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.cairo.common.math_cmp import is_not_zero
from openzeppelin.token.erc721.library import _exists, ERC721_ownerOf, ERC721_balanceOf
from starkware.cairo.common.uint256 import split_64, Uint256
from openzeppelin.utils.constants import TRUE

from contracts.constants import GRID_SIZE
from openzeppelin.access.ownable import Ownable_only_owner
from contracts.ERC721_Enumerable import constructor
from contracts.library import (
    Starksheet_getCell,
    Starksheet_setCell,
    Starksheet_renderCell,
    Starksheet_renderGrid,
    Starksheet_mint,
    Starksheet_tokenURI,
    CellRendered,
    Starksheet_merkle_root,
    Starksheet_addressesToLeafs,
    Starksheet_merkleBuild,
    Starksheet_max_per_wallet,
)

@external
func setMaxPerWallet{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(max : felt):
    Ownable_only_owner()
    Starksheet_max_per_wallet.write(max)
    return ()
end

@view
func getMaxPerWallet{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}() -> (
    max : felt
):
    return Starksheet_max_per_wallet.read()
end

@external
func setMerkleRoot{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(root : felt):
    Ownable_only_owner()
    Starksheet_merkle_root.write(root)
    return ()
end

@view
func getMerkleRoot{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}() -> (
    root : felt
):
    let (root) = Starksheet_merkle_root.read()
    return (root)
end

@view
func getMerkleRootFromList{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    allow_list_len : felt, allow_list : felt*
) -> (res : felt):
    alloc_locals
    let (leafs_len, leafs) = Starksheet_addressesToLeafs(allow_list_len, allow_list)
    return Starksheet_merkleBuild(leafs_len, leafs)
end

@external
func setCell{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    contractAddress : felt,
    tokenId : felt,
    value : felt,
    dependencies_len : felt,
    dependencies : felt*,
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

    Starksheet_setCell(contractAddress, tokenId, value, dependencies_len, dependencies)
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
    tokenId : Uint256, proof_len : felt, proof : felt*
):
    Starksheet_mint(tokenId, proof_len, proof)
    return ()
end

@view
func tokenURI{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    tokenId : Uint256
) -> (token_uri_len : felt, token_uri : felt*):
    let (token_uri_len, token_uri) = Starksheet_tokenURI(tokenId)
    return (token_uri_len, token_uri)
end
