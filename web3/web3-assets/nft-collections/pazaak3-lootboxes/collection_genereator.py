#!python3

import os
import json
import random
import shutil


def main():
    amount = 100
    nft_covers = os.listdir("files/")
    nft_set = {}
    for cov_name in nft_covers:
        nft_set.update({cov_name: round(amount * 0.5)})

    generated_metadata = []

    os.mkdir("./generated/")
    os.mkdir("./generated/assets/")
    jdx = 0
    indexes = list(range(sum([v for _, v in nft_set.items()])))
    random.shuffle(indexes)

    for cov_name, set in nft_set.items():
        for _ in range(set):
            idx = indexes[jdx]
            shutil.copyfile(f"files/{cov_name}", f"generated/assets/{idx}.png")
            cur_json = {
                "name": f"Pazaak3 Case #{idx}",
                "symbol": "PZK3-CASE",
                "description": "Pazaak3 game cases",
                "seller_fee_basis_points": 10,
                "image": f"{idx}.png",
                "edition": idx,
                "external_url": "https://github.com/blind1justice/pazaak3",
                "attributes": [],
                "properties": {
                    "files": [
                        {
                            "uri": f"{idx}.png",
                            "type": "image/png",
                        }
                    ],
                    "category": "image",
                },
            }
            generated_metadata.append(cur_json)
            with open(f"generated/assets/{idx}.json", "w", encoding="utf-8") as f:
                json.dump(cur_json, f, indent=2)
            jdx += 1

    shutil.copyfile(
        "collections-files/collection.png", "generated/assets/collection.png"
    )
    shutil.copyfile(
        "collections-files/collection.json", "generated/assets/collection.json"
    )


if __name__ == "__main__":
    main()
