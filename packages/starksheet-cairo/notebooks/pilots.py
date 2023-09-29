# %% Imports
import json
from pathlib import Path
from urllib.parse import urlparse, urlunparse

import pandas as pd
import requests
from bs4 import BeautifulSoup
from ipfshttpclient import Client
from utils.deployment import invoke


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
        print(f"Failed to retrieve profile information for {profile_url}.")
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
            [p.stem for p in Path("dust_pilots/dusted/").glob("*.png")]
        )
    ]
    .assign(
        ipfs=lambda df: ("dust_pilots/dusted/" + df.gh + ".png").map(
            upload_image_to_ipfs
        ),
        dust=lambda df: df.projects.str.split(",", expand=True).loc[:, 0],
        total=lambda df: df.total.str.replace("$", "").str.replace(",", "").astype(int),
        threshold=lambda df: ((1 / df.total).cumsum() * 1e5).astype(int),
    )
    .assign(
        threshold=lambda df: ((df.threshold / df.threshold.max()) * 1000).astype(int),
        rarity=lambda df: df.threshold.diff().fillna(df.threshold.min()) / 1000,
    )
    .merge(pd.read_csv("dust_pilots/pilots.csv"), on="gh", how="outer")
    .filter(
        items=[
            "gh",
            "gh_profile",
            "ipfs",
            "pilot",
            "dust",
            "total",
            "threshold",
            "rarity",
        ]
    )
    .reset_index(drop=True)
)
dusted_pilots.to_csv("dust_pilots/dusted.csv")

# %% Dump token uris
(
    pd.read_csv("dust_pilots/dusted.csv", index_col=0)
    .assign(
        attributes=lambda df: df[["dust", "pilot"]].agg(
            lambda row: [
                {"trait_type": "Pilot", "value": row.pilot},
            ]
            + (
                [{"trait_type": "Dust", "value": row.dust}]
                if not isinstance(row.dust, float)
                else []
            ),
            axis=1,
        ),
    )
    .reset_index()
    .apply(
        lambda row: json.dump(
            {
                "description": "Be careful pilot, going crazy high in the sky can make you become quickly only dust",
                "external_url": row.gh_profile,
                "image": "ipfs://" + row.ipfs,
                "name": row.gh,
                "attributes": row.attributes,
            },
            open(f"dust_pilots/token_uris/{row['index'] + 1}.json", "w"),
            indent=2,
        ),
        axis=1,
    )
)

# %% Update contract parameters
DUSTY_PILOTS_ADDRESS = (
    0x00D1540FBE29ACB2522694E9E3D1D776F1AB70773D33149997A65D06CC8A816F
)
await invoke("DustyPilots", "setNRow", len(dusted_pilots), address=DUSTY_PILOTS_ADDRESS)
await invoke("DustyPilotRenderer", "setThresholds", dusted_pilots.threshold.to_list())
