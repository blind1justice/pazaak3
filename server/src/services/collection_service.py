import httpx
from redis_client.available_cards import available_cards
from redis_client.types import Collection
from redis_client.client import RedisClient


class CollectionService:
    async def get_collection(self, user):
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.post(
                'https://api.devnet.solana.com/', 
                json={
                "jsonrpc": "2.0",
                "id": 1,
                "method": "searchAssets",
                "params": {
                    "grouping": ["collection", "GZPjAZnG5LmZAmpKrpBZmidAM4KsqCAzp8h5FCJNSgUL"],
                    "ownerAddress": user.walletId,
                    "limit": 100,
                    "burnt": False
                }
            })
            data = response.json()
            collection = Collection(player1Id=user.id, player1Name=user.nickname, player1WalletId=user.walletId)
            for item in data['result']['items']:
                metadata = await client.get(item['content']['json_uri'])
                collection.cards.append(metadata.json()['attributes'][0]['value'])
            return collection
        
    async def change_deck(self, user, cards):
        client = RedisClient()
        return client.update_deck(user, cards)

    async def get_deck(self, user):
        client = RedisClient()
        return client.get_deck(user)
