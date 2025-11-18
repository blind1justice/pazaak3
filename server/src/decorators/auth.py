from functools import wraps
import inspect
from fastapi import Depends
from api.dependencies import get_current_user
from schemas.user import UserSchemaRead


def require_auth(func):
    """
    Декоратор для проверки авторизации через Phantom.
    Автоматически добавляет параметр current_user с проверкой подписи Phantom.
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        return await func(*args, **kwargs)
    
    # Модифицируем сигнатуру функции, добавляя current_user
    sig = inspect.signature(func)
    params = list(sig.parameters.values())
    
    # Проверяем, есть ли уже current_user в параметрах
    param_names = [p.name for p in params]
    if 'current_user' not in param_names:
        # Добавляем параметр current_user с Depends
        new_param = inspect.Parameter(
            'current_user',
            inspect.Parameter.KEYWORD_ONLY,
            default=Depends(get_current_user),
            annotation=UserSchemaRead
        )
        params.append(new_param)
        wrapper.__signature__ = sig.replace(parameters=params)
    
    return wrapper

