# %% Imports
import json
import random
from pathlib import Path
from urllib.parse import urlparse, urlunparse

import pandas as pd
import requests
from bs4 import BeautifulSoup
from ipfshttpclient import Client


# %% Download all pp
def download_profile_picture(profile_url):
    response = requests.get(profile_url)
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, "html.parser")
        img_tag = soup.find("img", {"class": "avatar-user"})
        if img_tag and "src" in img_tag.attrs:
            image_url = img_tag["src"]
            parsed_url = urlparse(image_url)
            cleaned_url = urlunparse(parsed_url._replace(query=""))

            username = profile_url.split("/")[-1]
            image_path = f"dust_pilots/pilots/{username}.png"

            response = requests.get(cleaned_url)
            if response.status_code == 200:
                with open(image_path, "wb") as file:
                    file.write(response.content)
                print(f"Profile picture for {username} downloaded successfully.")
                return True
            else:
                print(f"Failed to download profile picture for {username}.")
    else:
        print("Failed to retrieve profile information.")
    return False


def upload_image_to_ipfs(image_path):
    try:
        client = Client()  # Connect to the local IPFS node
        res = client.add(image_path)
        ipfs_hash = res["Hash"]
        return ipfs_hash
    except Exception as e:
        print(f"Failed to upload image to IPFS: {e}")
        return None


pilots = pd.read_csv("./notebooks/people.csv")

# %% Download gh pp
pilots.gh_profile.map(download_profile_picture)


# %% Read data
dusted_pilots = (
    pilots.loc[
        lambda df: df.gh.isin(
            [p.stem for p in Path(f"dust_pilots/dusted/").glob("*.png")]
        )
    ]
    .assign(
        ipfs=lambda df: ("dust_pilots/dusted/" + df.gh + ".png").map(
            upload_image_to_ipfs
        ),
        dust=lambda df: df.projects.str.split(",", expand=True).loc[:, 0],
        pilot=lambda df: list(random.randbytes(len(df))),
        attributes=lambda df: df[["dust", "pilot"]].agg(
            lambda row: [
                {"trait_type": "Pilot", "trait_value": row.pilot},
                {"trait_type": "Dust", "trait_value": row.dust},
            ],
            axis=1,
        ),
        rarity=lambda df: (
            (
                1 / df.total.str.replace("$", "").str.replace(",", "").astype(int)
            ).cumsum()
            * 1e5
        ).astype(int),
    )
    .assign(rarity=lambda df: ((df.rarity / df.rarity.max()) * 1000).astype(int))
    .filter(items=["gh", "attributes", "ipfs", "rarity"])
    .reset_index(drop=True)
)
dusted_pilots[["gh", "ipfs", "rarity"]].to_csv("dust_pilots/dusted.csv")

(
    dusted_pilots.reset_index().apply(
        lambda row: json.dump(
            {
                "description": "Be careful pilot, going crazy high in the sky can make you become quickly only dust",
                "external_url": "https://app.starksheet.xyz/0xd1540fbe29acb2522694e9e3d1d776f1ab70773d33149997a65d06cc8a816f",
                "image": "ipfs://" + row.ipfs,
                "name": row.gh,
                "attributes": row.attributes,
            },
            open(f"dust_pilots/token_uris/{row['index']}.json", "w"),
            indent=4,
        ),
        axis=1,
    )
)

# %%
