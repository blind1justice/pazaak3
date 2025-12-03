from typing import List
from fastapi import APIRouter, Depends
from schemas.user import UserSchemaRead
from redis_client.enum import AnotherCardType
from services.collection_service import CollectionService
from api.dependencies import get_current_user, collection_service


router = APIRouter(prefix='/api/collection', tags=['Collection'])


@router.get('')
async def get_collection(
    current_user: UserSchemaRead = Depends(get_current_user),
    collection_service: CollectionService = Depends(collection_service)
):
    res = await collection_service.get_collection(current_user)
    return res


@router.post('/deck')
async def change_deck(
    cards: List[AnotherCardType],
    current_user: UserSchemaRead = Depends(get_current_user),
    collection_service: CollectionService = Depends(collection_service),
):
    res = await collection_service.change_deck(current_user, cards)
    return res
    

@router.get('/deck')
async def get_deck(
    current_user: UserSchemaRead = Depends(get_current_user),
    collection_service: CollectionService = Depends(collection_service),
):
    return await collection_service.get_deck(current_user)