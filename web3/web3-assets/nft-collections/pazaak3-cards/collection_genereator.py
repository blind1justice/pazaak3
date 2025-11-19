#!python3

import os
import json
import random
import shutil


def main():
    amount = 500
    nft_covers = os.listdir("files/")
    nft_set = {}
    for cov_name in nft_covers:
        if cov_name.startswith("pm"):
            nft_set.update({cov_name: round(amount * 0.1417)})
        else:
            nft_set.update({cov_name: round(amount * 0.0375)})

    abilities = {
        "pm1.png": "PlusMinus1",
        "pm2.png": "PlusMinus2",
        "pm3.png": "PlusMinus3",
        "pm4.png": "PlusMinus4",
        "pm5.png": "PlusMinus5",
        "pm6.png": "PlusMinus6",
        "1or2.png": "OneOrTwoPlusMinus",
        "3or4.png": "ThreeOrFourPlusMinus",
        "5or6.png": "FiveOrSixPlusMinus",
        "any.png": "AnyValue",
    }
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
                "name": f"Pazaak3 #{idx}",
                "symbol": "PZK3",
                "description": "Pazaak3 game items",
                "seller_fee_basis_points": 100,
                "image": f"{idx}.png",
                "edition": idx,
                "external_url": "https://github.com/blind1justice/pazaak3",
                "attributes": [{"trait_type": "Ability", "value": abilities[cov_name]}],
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
