import asyncio
from urllib.parse import parse_qs
from socketio import AsyncServer
import socketio
from redis_client.types import GameState
from services import web3_service
from utils.jwt import verify_token
from services.game_service import GameService
from models.game import GameResult
from services.user_service import UserService
from redis_client.client import RedisClient
from redis_client.enum import CardType, PlayerState
from schemas.game import GameSchemaUpdate
from redis_client.available_cards import (
    available_cards,
    common_cards,
    blank_card,
    simple_cards,
)
from random import sample, choice
from time import time


TURN_DURATION = 60


sio = AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=["http://localhost:4200", "http://localhost:8080"],
)
socket_app = socketio.ASGIApp(sio)


def _get_card_from_common_deck(game_state: GameState, is_first_player: bool):
    card = choice(list(common_cards.values()))
    if is_first_player:
        game_state.board1.append(card)
    else:
        game_state.board2.append(card)


async def _end_game_check(game_state: GameState):
    if game_state.roundPoint1 == 3 or game_state.roundPoint2 == 3:
        game_service = GameService()
        winner_side = None
        if game_state.roundPoint1 == 3:
            game_state.Player1State = PlayerState.Won
            game_state.Player2State = PlayerState.Lost
            await game_service.update_one(
                game_state.gameId, GameSchemaUpdate(result=GameResult.PLAYER1_WON)
            )
            winner_side = web3_service.WinnerSide.PLAYER1
        elif game_state.roundPoint2 == 3:
            game_state.Player2State = PlayerState.Won
            game_state.Player1State = PlayerState.Lost
            await game_service.update_one(
                game_state.gameId, GameSchemaUpdate(result=GameResult.PLAYER2_WON)
            )
            winner_side = web3_service.WinnerSide.PLAYER2

        if winner_side is not None:
            blockchain_service = web3_service.Web3Service()
            tx = await blockchain_service.finish_game(
                int(game_state.gameId),
                winner=winner_side,
                canceled=False,
            )
            print("Transaction ID:")
            print(tx)
            await blockchain_service.close_client()
        return True
    return False


async def _start_new_round(game_state: GameState, is_first_player: bool):
    game_state.board1 = []
    game_state.board2 = []
    game_state.turnEndTime = time() + TURN_DURATION
    if is_first_player:
        game_state.Player1State = PlayerState.ActiveTurn
        game_state.Player2State = PlayerState.WaitEnemyTurn
    else:
        game_state.Player1State = PlayerState.WaitEnemyTurn
        game_state.Player2State = PlayerState.ActiveTurn
    _get_card_from_common_deck(game_state, is_first_player)


async def _calculate_result(game_state: GameState):
    if game_state.board1sum > game_state.board2sum:
        game_state.roundPoint1 += 1
        if not await _end_game_check(game_state):
            await _start_new_round(game_state, False)
    elif game_state.board2sum > game_state.board1sum:
        game_state.roundPoint2 += 1
        if not await _end_game_check(game_state):
            await _start_new_round(game_state, True)
    else:
        await _start_new_round(game_state, choice([True, False]))


async def _end_turn_for_player(game_state: GameState, is_first_player: bool):
    game_state.turnEndTime = time() + TURN_DURATION
    if is_first_player:
        if game_state.board1sum > 20:
            game_state.roundPoint2 += 1
            if not await _end_game_check(game_state):
                await _start_new_round(game_state, is_first_player)
        elif game_state.Player1State in [
            PlayerState.ActiveTurn,
            PlayerState.PlayedCard,
        ]:
            if game_state.Player2State == PlayerState.Stand:
                game_state.Player1State = PlayerState.ActiveTurn
                _get_card_from_common_deck(game_state, is_first_player)
            else:
                game_state.Player1State = PlayerState.WaitEnemyTurn
                game_state.Player2State = PlayerState.ActiveTurn
                _get_card_from_common_deck(game_state, not is_first_player)
        elif game_state.Player1State == PlayerState.Stand:
            if game_state.Player2State == PlayerState.Stand:
                await _calculate_result(game_state)
            else:
                game_state.Player2State = PlayerState.ActiveTurn
                _get_card_from_common_deck(game_state, not is_first_player)
    else:
        if game_state.board2sum > 20:
            game_state.roundPoint1 += 1
            if not await _end_game_check(game_state):
                await _start_new_round(game_state, is_first_player)
        elif game_state.Player2State in [
            PlayerState.ActiveTurn,
            PlayerState.PlayedCard,
        ]:
            if game_state.Player1State == PlayerState.Stand:
                game_state.Player2State = PlayerState.ActiveTurn
                _get_card_from_common_deck(game_state, is_first_player)
            else:
                game_state.Player2State = PlayerState.WaitEnemyTurn
                game_state.Player1State = PlayerState.ActiveTurn
                _get_card_from_common_deck(game_state, not is_first_player)
        elif game_state.Player2State == PlayerState.Stand:
            if game_state.Player1State == PlayerState.Stand:
                await _calculate_result(game_state)
            else:
                game_state.Player1State = PlayerState.ActiveTurn
                _get_card_from_common_deck(game_state, not is_first_player)


@sio.event
async def connect(sid, environ):
    query_string = environ.get("QUERY_STRING", "")
    query_params = parse_qs(query_string)

    room_id = int(query_params.get("room", [None])[0])
    jwt_token = query_params.get("jwt", [None])[0]

    user_data = verify_token(jwt_token)

    if not room_id or not jwt_token:
        await sio.disconnect(sid)
        return False

    user_data = verify_token(jwt_token)
    if not user_data:
        await sio.disconnect(sid)
        return False

    user_id = int(user_data["sub"])

    game_service = GameService()

    game = await game_service.get_one(room_id)
    if (
        game.player1_id != user_id and game.player2_id != user_id
    ) or game.result not in [GameResult.PENDING, GameResult.IN_PROGRESS]:
        await sio.disconnect(sid)
        return False

    user_service = UserService()
    user = await user_service.get_one(user_id)

    await sio.enter_room(sid, room_id)

    redis_client = RedisClient()
    raw_deck = redis_client.get_deck(user)
    if raw_deck:
        deck = []
        for card in raw_deck.cards:
            deck.append(available_cards[card.value])
    else:
        deck = list(simple_cards.values())

    if not redis_client.get_game_state(room_id):
        await sio.save_session(
            sid, {"room_id": room_id, "user_id": user_id, "is_first_player": True}
        )
        redis_client.create_game(
            room_id,
            user_id,
            user.nickname,
            user.walletId,
            sample(deck, 4),
            game.bid,
            game.reward,
        )
    elif not redis_client.get_game_state(room_id).player2Id:
        redis_client.connect_to_game(
            room_id, user_id, user.nickname, user.walletId, sample(deck, 4)
        )
        await sio.save_session(
            sid, {"room_id": room_id, "user_id": user_id, "is_first_player": False}
        )
        await game_service.update_one(
            room_id, GameSchemaUpdate(result=GameResult.IN_PROGRESS)
        )
        await sio.emit(
            "game_started",
            {
                "your_id": user_id,
                "game_state": redis_client.get_game_state(room_id).model_dump_json(),
            },
            room=room_id,
        )
        game_state = redis_client.get_game_state(room_id)
        await _start_new_round(game_state, True)
        redis_client.update_game_state(room_id, game_state)
        await sio.emit(
            "current_state",
            {"game_state": redis_client.get_game_state(room_id).model_dump_json()},
            room=room_id,
        )
    else:
        game_state = redis_client.get_game_state(room_id)
        is_first_player = game_state.player1Id == user_id
        await sio.save_session(
            sid,
            {
                "room_id": room_id,
                "user_id": user_id,
                "is_first_player": is_first_player,
            },
        )

        await sio.emit(
            "reconnected",
            {"user_id": user_id, "message": f"User {user_id} reconnected the game"},
            room=room_id,
            skip_sid=sid,
        )
        await sio.emit(
            "current_state",
            {"game_state": redis_client.get_game_state(room_id).model_dump_json()},
            to=sid,
        )

    print(f"Client {sid} connected to room {room_id}")


# после загрузки страницы игры
@sio.event
async def game_ready_to_start(sid):

    session = await sio.get_session(sid)
    room_id = session.get("room_id")
    user_id = session.get("user_id")

    if not room_id or not user_id:
        print(f"[SIO] Invalid session in game_ready_to_start: {sid}")
        return

    redis_client = RedisClient()
    game_state = redis_client.get_game_state(room_id)

    # Помечаем игрока как "готов"
    if (
        game_state.player1Id == user_id
        and game_state.Player1State == PlayerState.Initial
    ):
        game_state.Player1State = PlayerState.ReadyToStartGame
    elif (
        game_state.player2Id == user_id
        and game_state.Player2State == PlayerState.Initial
    ):
        game_state.Player2State = PlayerState.ReadyToStartGame

    redis_client.update_game_state(room_id, game_state)

    print(f"[SIO] Player {user_id} ready in room {room_id}")

    # Если оба готовы — шлём состояние
    if (
        game_state.Player1State == PlayerState.ReadyToStartGame
        and game_state.Player2State == PlayerState.ReadyToStartGame
    ):
        print(f"[SIO] Both players ready! Starting game in room {room_id}")

        await sio.emit(
            "game_started", {"game_state": game_state.model_dump_json()}, room=room_id
        )


@sio.event
async def disconnect(sid):
    session = await sio.get_session(sid)
    room_id = session.get("room_id")
    user_id = session.get("user_id")

    if room_id:
        await sio.emit(
            "user_left",
            {"user_id": user_id, "message": f"User {user_id} left the game"},
            room=room_id,
            skip_sid=sid,
        )

        await sio.leave_room(sid, room_id)

    print(f"Client {sid} disconnected")


@sio.event
async def play_card(sid, data):
    try:
        session = await sio.get_session(sid)
        room_id = session.get("room_id")
        user_id = session.get("user_id")
        is_first_player = session.get("is_first_player")

        if not room_id:
            return

        redis_client = RedisClient()
        game_state = redis_client.get_game_state(room_id)

        if is_first_player and game_state.Player1State != PlayerState.ActiveTurn:
            return

        if not is_first_player and game_state.Player2State != PlayerState.ActiveTurn:
            return

        card_index = int(data.get("index"))
        if card_index > 3 or card_index < 0:
            return
        if is_first_player and game_state.hand1[card_index].type == CardType.UsedCard:
            return
        if (
            not is_first_player
            and game_state.hand2[card_index].type == CardType.UsedCard
        ):
            return

        if is_first_player:
            card = game_state.hand1[card_index]
            game_state.hand1[card_index] = blank_card
            game_state.board1.append(card)
            game_state.Player1State = PlayerState.PlayedCard
            redis_client.update_game_state(room_id, game_state)
        else:
            card = game_state.hand2[card_index]
            game_state.hand2[card_index] = blank_card
            game_state.board2.append(card)
            game_state.Player2State = PlayerState.PlayedCard
            redis_client.update_game_state(room_id, game_state)

        await sio.emit(
            "current_state",
            {"game_state": redis_client.get_game_state(room_id).model_dump_json()},
            room=room_id,
        )

    except Exception as e:
        print(f"Play card error: {e}")


@sio.event
async def end_turn(sid, data=None):
    try:
        session = await sio.get_session(sid)
        room_id = session.get("room_id")
        user_id = session.get("user_id")
        is_first_player = session.get("is_first_player")

        if not room_id:
            return

        redis_client = RedisClient()
        game_state = redis_client.get_game_state(room_id)

        if is_first_player and game_state.Player1State not in [
            PlayerState.ActiveTurn,
            PlayerState.PlayedCard,
        ]:
            return

        if not is_first_player and game_state.Player2State not in [
            PlayerState.ActiveTurn,
            PlayerState.PlayedCard,
        ]:
            return

        await _end_turn_for_player(game_state, is_first_player)
        redis_client.update_game_state(room_id, game_state)

        await sio.emit(
            "current_state",
            {"game_state": redis_client.get_game_state(room_id).model_dump_json()},
            room=room_id,
        )

    except Exception as e:
        print(f"End turn error: {e}")


@sio.event
async def stand(sid, data=None):
    try:
        session = await sio.get_session(sid)
        room_id = session.get("room_id")
        user_id = session.get("user_id")
        is_first_player = session.get("is_first_player")

        if not room_id:
            return

        redis_client = RedisClient()
        game_state = redis_client.get_game_state(room_id)

        if is_first_player and game_state.Player1State not in [
            PlayerState.ActiveTurn,
            PlayerState.PlayedCard,
        ]:
            return

        if not is_first_player and game_state.Player2State not in [
            PlayerState.ActiveTurn,
            PlayerState.PlayedCard,
        ]:
            return

        if is_first_player:
            game_state.Player1State = PlayerState.Stand
        else:
            game_state.Player2State = PlayerState.Stand

        await _end_turn_for_player(game_state, is_first_player)
        redis_client.update_game_state(room_id, game_state)

        await sio.emit(
            "current_state",
            {"game_state": redis_client.get_game_state(room_id).model_dump_json()},
            room=room_id,
        )

    except Exception as e:
        print(f"Stand error: {e}")


@sio.event
async def change_card_state(sid, data):
    try:
        session = await sio.get_session(sid)
        room_id = session.get("room_id")
        user_id = session.get("user_id")
        is_first_player = session.get("is_first_player")

        if not room_id:
            return

        redis_client = RedisClient()
        game_state = redis_client.get_game_state(room_id)

        card_index = int(data.get("index"))
        if card_index > 3 or card_index < 0:
            return
        if is_first_player and game_state.hand1[card_index].type == CardType.UsedCard:
            return
        if (
            not is_first_player
            and game_state.hand2[card_index].type == CardType.UsedCard
        ):
            return

        if is_first_player:
            game_state.hand1[card_index].change_state()
            redis_client.update_game_state(room_id, game_state)
        else:
            game_state.hand2[card_index].change_state()
            redis_client.update_game_state(room_id, game_state)

        await sio.emit(
            "current_state",
            {"game_state": redis_client.get_game_state(room_id).model_dump_json()},
            room=room_id,
        )

    except Exception as e:
        print(f"Change card error: {e}")


@sio.event
async def concede(sid, data=None):
    try:
        session = await sio.get_session(sid)
        room_id = session.get("room_id")
        user_id = session.get("user_id")
        is_first_player = session.get("is_first_player")

        if not room_id:
            return

        redis_client = RedisClient()
        game_state = redis_client.get_game_state(room_id)

        game_state.Player1State = PlayerState.WaitEnemyTurn
        game_state.Player2State = PlayerState.WaitEnemyTurn
        if is_first_player:
            game_state.roundPoint2 = 3
            game_state.Player2State = PlayerState.Won
            game_state.Player1State = PlayerState.Lost
        else:
            game_state.roundPoint1 = 3
            game_state.Player1State = PlayerState.Won
            game_state.Player2State = PlayerState.Lost
        redis_client.update_game_state(room_id, game_state)

        await sio.emit(
            "current_state",
            {"game_state": redis_client.get_game_state(room_id).model_dump_json()},
            room=room_id,
        )

        game_service = GameService()

        if is_first_player:
            await game_service.update_one(
                room_id, GameSchemaUpdate(result=GameResult.PLAYER2_WON)
            )
        else:
            await game_service.update_one(
                room_id, GameSchemaUpdate(result=GameResult.PLAYER1_WON)
            )
        blockchain_service: web3_service.Web3Service = web3_service.Web3Service()
        tx = await blockchain_service.finish_game(
            int(room_id),
            winner=(
                web3_service.WinnerSide.PLAYER2
                if is_first_player
                else web3_service.WinnerSide.PLAYER1
            ),
            canceled=False,
        )
        print("Transaction ID:")
        print(tx)
        await blockchain_service.close_client()

    except Exception as e:
        print(f"Concede error: {e}")
