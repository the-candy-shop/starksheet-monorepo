import os

import pandas as pd
import tweepy
from dotenv import load_dotenv

load_dotenv()

client = tweepy.Client(os.environ["TWITTER_TOKEN"])

starksheet_account = client.get_user(username="Starksheet")
response = client.get_users_followers(starksheet_account[0].id, max_results=1000)
last = client.get_users_followers(
    starksheet_account[0].id,
    max_results=1000,
    pagination_token=response[3]["next_token"],
)
pd.DataFrame(response[0] + last[0]).sample(n=20, replace=False).assign(
    username=lambda df: "@" + df.username
)["username"].to_csv("followers_drawn.csv", index=False)
