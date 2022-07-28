import json

from nile.nre import NileRuntimeEnvironment
from starkware.starknet.public.abi import get_selector_from_name

from utils import deploy


def run(nre: NileRuntimeEnvironment) -> None:
    abi = deploy(nre, "math", [])
    json.dump(
        {
            func["name"]: str(get_selector_from_name(func["name"]))
            for func in json.load(open(abi))
        },
        open("selectors.json", "w"),
        indent=2,
    )
