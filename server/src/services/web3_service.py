from solders.keypair import Keypair
from solders.pubkey import Pubkey

from solders.instruction import AccountMeta, Instruction
from solders.message import MessageV0

from solders.token.associated import get_associated_token_address

from solders.transaction import VersionedTransaction
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed
from config.settings import settings

from enum import StrEnum, Enum
import struct
from dataclasses import dataclass


class WinnerSide(StrEnum):
    PLAYER1 = "Player1"
    PLAYER2 = "Player2"
    NONE = "None"


class GameRoomStateKind(Enum):
    CREATED = 0
    BUSY = 1
    FINISHED = 2


class RequestAccountKind(Enum):
    PENDING = 0
    FULFILLED = 1


@dataclass
class RandomnessResponse:
    pubkey: Pubkey
    randomness: bytes  # 64 байта


@dataclass
class PendingRequest:
    client: Pubkey
    seed: bytes  # 32 байта
    responses: list[RandomnessResponse]


@dataclass
class FulfilledRequest:
    client: Pubkey
    seed: bytes  # 32 байта
    randomness: bytes  # 64 байта


RequestAccount = PendingRequest | FulfilledRequest


@dataclass
class RandomnessV2:
    kind: RequestAccountKind
    request: RequestAccount


@dataclass
class CreatedGameRoom:
    player1: Pubkey
    token_bid: int
    cards_permutation_hash: bytes  # 32 байта


@dataclass
class BusyGameRoom:
    player1: Pubkey
    player2: Pubkey
    token_bid: int
    cards_permutation_hash: bytes  # 32 байта
    vrf_seed: bytes  # 32 байта


@dataclass
class FinishedGameRoom:
    player1: Pubkey
    token_bid: int
    cards_permutation_hash: bytes  # 32 байта
    player2: Pubkey
    vrf_seed: bytes  # 32 байта
    winner: int  # индекс winnerSide (0/1/2)
    canceled: bool


@dataclass
class GameConfig:
    config_authority: Pubkey
    game_authority: Pubkey
    token_mint: Pubkey
    token_treasury: Pubkey
    token_minimal_bid: int
    token_fee: int


GameRoomState = CreatedGameRoom | BusyGameRoom | FinishedGameRoom


class Web3Service:
    GAME_CONFIG_SEED = b"pazaak-config"
    GAME_ROOM_SEED = b"pazaak-room"
    ROOM_TREASURY_SEED = b"pazaak-room-treasury"
    ORAO_RANDOMNESS_SEED = b"orao-vrf-randomness-request"
    ORAO_PROGRAM_ID = Pubkey.from_string("VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y")

    def __init__(self):
        self.__keypair = Keypair.from_json(settings.raw_keypair.get_secret_value())
        self.__game_program_id = Pubkey.from_string(settings.game_program_id)
        self.__client = AsyncClient(
            settings.solana_cluster_url,
            commitment=Confirmed,
        )

    async def __onchain_game_config(self):
        game_config_pda, _ = Pubkey.find_program_address(
            [self.GAME_CONFIG_SEED],
            self.__game_program_id,
        )
        resp = await self.__client.get_account_info(game_config_pda)

        acc = resp.value
        if acc is None:
            raise RuntimeError("gameConfig account not found")

        data = bytes(acc.data)

        if len(data) < 145:
            raise RuntimeError(f"gameConfig data too short: {len(data)} bytes")

        offset = 8

        def read_pubkey(off: int) -> tuple[Pubkey, int]:
            return Pubkey.from_bytes(data[off : off + 32]), off + 32

        config_authority, offset = read_pubkey(offset)
        game_authority, offset = read_pubkey(offset)
        token_mint, offset = read_pubkey(offset)
        token_treasury, offset = read_pubkey(offset)

        token_minimal_bid = struct.unpack_from("<Q", data, offset)[0]
        offset += 8

        token_fee = struct.unpack_from("<B", data, offset)[0]
        offset += 1

        return GameConfig(
            config_authority=config_authority,
            game_authority=game_authority,
            token_mint=token_mint,
            token_treasury=token_treasury,
            token_minimal_bid=token_minimal_bid,
            token_fee=token_fee,
        )

    async def __onchain_game_room_state(
        self,
        room_id: int,
    ) -> tuple[GameRoomStateKind, GameRoomState]:
        room_id_bytes = struct.pack("<Q", room_id)

        game_room_pda, _ = Pubkey.find_program_address(
            [self.GAME_ROOM_SEED, room_id_bytes],
            self.__game_program_id,
        )
        resp = await self.__client.get_account_info(game_room_pda)

        acc = resp.value
        if acc is None:
            raise RuntimeError("gameRoomState account not found")

        data = bytes(acc.data)[8:]

        if len(data) < 1:
            raise ValueError("gameRoomState data too short")

        discr = data[0]
        offset = 1

        def read_pubkey(off: int) -> tuple[Pubkey, int]:
            return Pubkey.from_bytes(data[off : off + 32]), off + 32

        def read_u64(off: int) -> tuple[int, int]:
            return struct.unpack_from("<Q", data, off)[0], off + 8

        def read_32(off: int) -> tuple[bytes, int]:
            return data[off : off + 32], off + 32

        if discr == GameRoomStateKind.CREATED.value:
            kind = GameRoomStateKind.CREATED

            player1, offset = read_pubkey(offset)
            token_bid, offset = read_u64(offset)
            cards_perm_hash, offset = read_32(offset)

            state = CreatedGameRoom(
                player1=player1,
                token_bid=token_bid,
                cards_permutation_hash=cards_perm_hash,
            )

        elif discr == GameRoomStateKind.BUSY.value:
            kind = GameRoomStateKind.BUSY

            player1, offset = read_pubkey(offset)
            player2, offset = read_pubkey(offset)
            token_bid, offset = read_u64(offset)
            cards_perm_hash, offset = read_32(offset)
            vrf_seed, offset = read_32(offset)

            state = BusyGameRoom(
                player1=player1,
                player2=player2,
                token_bid=token_bid,
                cards_permutation_hash=cards_perm_hash,
                vrf_seed=vrf_seed,
            )

        elif discr == GameRoomStateKind.FINISHED.value:
            kind = GameRoomStateKind.FINISHED

            player1, offset = read_pubkey(offset)
            token_bid, offset = read_u64(offset)
            cards_perm_hash, offset = read_32(offset)
            player2, offset = read_pubkey(offset)
            vrf_seed, offset = read_32(offset)

            # winnerSide: такой же enum‑байт, как выше (0/1/2)
            if len(data) < offset + 1:
                raise ValueError("winnerSide byte missing")
            winner = data[offset]
            offset += 1

            # canceled: bool (u8)
            if len(data) < offset + 1:
                raise ValueError("canceled byte missing")
            canceled = data[offset] != 0
            offset += 1

            state = FinishedGameRoom(
                player1=player1,
                token_bid=token_bid,
                cards_permutation_hash=cards_perm_hash,
                player2=player2,
                vrf_seed=vrf_seed,
                winner=winner,
                canceled=canceled,
            )
        else:
            raise ValueError(f"unknown gameRoomState discriminator: {discr}")

        return kind, state

    @staticmethod
    def __encode_winner_side(winner: WinnerSide) -> bytes:
        mapping = {
            WinnerSide.NONE: 0,
            WinnerSide.PLAYER1: 1,
            WinnerSide.PLAYER2: 2,
        }
        return struct.pack("<B", mapping[winner])

    async def finish_game(
        self,
        room_id: int,
        winner: WinnerSide = WinnerSide.NONE,
        canceled: bool = False,
    ) -> str:
        if (winner == WinnerSide.NONE and not canceled) or (
            winner != WinnerSide.NONE and canceled
        ):
            raise Exception("Invalid finish game parameters")

        game_config = await self.__onchain_game_config()
        game_room_state, game_room_state_data = await self.__onchain_game_room_state(
            room_id
        )
        if game_room_state != GameRoomStateKind.BUSY:
            raise Exception("Game is not finishable!")

        # config: seeds = ["pazaak-config"]
        config_pda, _ = Pubkey.find_program_address(
            [self.GAME_CONFIG_SEED],
            self.__game_program_id,
        )
        # gameRoom: seeds = ["pazaak-room", roomId]
        game_room_id_bytes = struct.pack("<Q", room_id)  # u64 little-endian
        game_room_pda, _ = Pubkey.find_program_address(
            [self.GAME_ROOM_SEED, game_room_id_bytes],
            self.__game_program_id,
        )
        # roomTreasury: seeds = ["pazaak-room-treasury", roomId]
        room_treasury_pda, _ = Pubkey.find_program_address(
            [self.ROOM_TREASURY_SEED, game_room_id_bytes],
            self.__game_program_id,
        )

        token_mint = game_config.token_mint
        game_authority, token_treasury = (
            game_config.game_authority,
            game_config.token_treasury,
        )

        player1_token_account, player2_token_account = (
            get_associated_token_address(game_room_state_data.player1, token_mint),
            get_associated_token_address(game_room_state_data.player2, token_mint),
        )

        token_program = Pubkey.from_string(
            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        )

        # 3. Собираем данные инструкции по IDL:
        # discriminator (8 байт) + roomId (u64) + winnerSide + canceled (bool)
        discriminator = bytes([168, 120, 86, 113, 64, 116, 2, 146])

        winner_bytes = self.__encode_winner_side(winner)
        canceled_byte = b"\x01" if canceled else b"\x00"

        data = (
            discriminator
            + struct.pack("<Q", room_id)  # roomId
            + winner_bytes
            + canceled_byte
        )

        # 4. Accounts list из IDL (все PDA уже посчитаны выше)
        accounts = [
            AccountMeta(pubkey=config_pda, is_signer=False, is_writable=False),
            AccountMeta(pubkey=game_room_pda, is_signer=False, is_writable=True),
            AccountMeta(pubkey=room_treasury_pda, is_signer=False, is_writable=True),
            AccountMeta(pubkey=token_treasury, is_signer=False, is_writable=True),
            AccountMeta(
                pubkey=player1_token_account, is_signer=False, is_writable=True
            ),
            AccountMeta(
                pubkey=player2_token_account, is_signer=False, is_writable=True
            ),
            AccountMeta(pubkey=game_authority, is_signer=True, is_writable=False),
            AccountMeta(pubkey=token_program, is_signer=False, is_writable=False),
        ]

        ix = Instruction(
            program_id=self.__game_program_id,
            accounts=accounts,
            data=data,
        )

        # 5. Собираем и шлём транзакцию
        latest_blockhash_resp = await self.__client.get_latest_blockhash()
        blockhash = latest_blockhash_resp.value.blockhash

        msg = MessageV0.try_compile(
            payer=game_authority,
            instructions=[ix],
            address_lookup_table_accounts=[],
            recent_blockhash=blockhash,
        )

        tx = VersionedTransaction(msg, [self.__keypair])

        sig = await self.__client.send_transaction(tx)

        return str(sig.value)

    async def get_randomness(self, room_id: int) -> bytes:
        game_room_state, game_room_state_data = await self.__onchain_game_room_state(
            room_id
        )
        if game_room_state == GameRoomStateKind.CREATED:
            raise Exception("Invalid web3 Room State")

        vrf_seed = game_room_state_data.vrf_seed

        randomness_pda, _ = Pubkey.find_program_address(
            [self.ORAO_RANDOMNESS_SEED, vrf_seed],
            self.ORAO_PROGRAM_ID,
        )
        resp = await self.__client.get_account_info(randomness_pda)

        acc = resp.value
        if acc is None:
            raise RuntimeError("Randomness account not found")

        data = bytes(acc.data)[8:]

        def _read_pubkey(data: bytes, off: int) -> tuple[Pubkey, int]:
            return Pubkey.from_bytes(data[off : off + 32]), off + 32

        def _read_u32(data: bytes, off: int) -> tuple[int, int]:
            return struct.unpack_from("<I", data, off)[0], off + 4

        def _read_32(data: bytes, off: int) -> tuple[bytes, int]:
            return data[off : off + 32], off + 32

        def _read_64(data: bytes, off: int) -> tuple[bytes, int]:
            return data[off : off + 64], off + 64

        discr = data[0]
        offset = 1

        if discr == RequestAccountKind.PENDING.value:
            kind = RequestAccountKind.PENDING

            # PendingRequest:
            # client(pubkey) + seed[32] + Vec<RandomnessResponse>
            client, offset = _read_pubkey(data, offset)
            seed, offset = _read_32(data, offset)

            # Vec<RandomnessResponse> — стандартный Borsh Vec:
            # u32 length (LE) + length * RandomnessResponse
            length, offset = _read_u32(data, offset)

            responses: list[RandomnessResponse] = []
            for _ in range(length):
                resp_pubkey, offset = _read_pubkey(data, offset)
                randomness, offset = _read_64(data, offset)
                responses.append(
                    RandomnessResponse(pubkey=resp_pubkey, randomness=randomness)
                )

            request = PendingRequest(client=client, seed=seed, responses=responses)

        elif discr == RequestAccountKind.FULFILLED.value:
            kind = RequestAccountKind.FULFILLED

            # FulfilledRequest:
            # client(pubkey) + seed[32] + randomness[64]
            client, offset = _read_pubkey(data, offset)
            seed, offset = _read_32(data, offset)
            randomness, offset = _read_64(data, offset)

            request = FulfilledRequest(client=client, seed=seed, randomness=randomness)

        else:
            raise ValueError(f"Unknown RequestAccount discriminator: {discr}")

        if kind == RequestAccountKind.PENDING:
            raise Exception("Randomness Not Fulfilled Yet")

        return request.randomness

    async def close_client(self):
        await self.__client.close()
