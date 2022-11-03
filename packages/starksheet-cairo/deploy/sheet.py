import json
import logging
from asyncio import run

from constants import ALLOW_LIST
from deploy.cli import call, invoke, wait_for_transaction
from utils import address_to_leaf, merkle_proofs, merkle_root

logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


async def main():
    logger.info("Computing Merkle proofs...")
    json.dump(
        {
            hex(address): [str(p) for p in proof]
            for address, proof in merkle_proofs(ALLOW_LIST).items()
        },
        open("allow_list.json", "w"),
        indent=2,
    )

    logger.info("Computing Merkle root...")
    leafs = [address_to_leaf(address) for address in ALLOW_LIST]
    root = merkle_root(leafs)
    logger.info(f"Merkle root: {root}")

    (sheet,) = await call("Starksheet", "getSheet", 0)
    await invoke("Sheet", "setMerkleRoot", root, address=sheet)
    (max_per_wallet,) = await call("Sheet", "getMaxPerWallet", address=sheet)
    logger.info(f"Current max per wallet: {max_per_wallet}")
    if max_per_wallet != 10:
        logger.info(f"Setting max per wallet to 10")
        await invoke("Sheet", "setMaxPerWallet", 10, address=sheet)
    logger.info(f"Sheet {sheet} ready to be used!")


if __name__ == "__main__":
    run(main())
