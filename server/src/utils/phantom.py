import base58
from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError
from fastapi import HTTPException, status


def verify_phantom_signature(
    message: str,
    signature: str,
    public_key: str
) -> bool:
    """
    Проверяет подпись сообщения от Phantom кошелька.
    
    Args:
        message: Исходное сообщение, которое было подписано
        signature: Подпись в формате base58
        public_key: Публичный ключ кошелька (walletId) в формате base58
    
    Returns:
        True если подпись валидна, иначе False
    """
    try:
        # Декодируем публичный ключ и подпись из base58
        public_key_bytes = base58.b58decode(public_key)
        signature_bytes = base58.b58decode(signature)
        
        # Создаем объект для проверки подписи
        verify_key = VerifyKey(public_key_bytes)
        
        # Проверяем подпись
        # В Solana сообщение обычно кодируется как UTF-8 байты
        message_bytes = message.encode('utf-8')
        
        try:
            verify_key.verify(message_bytes, signature_bytes)
            return True
        except BadSignatureError:
            return False
            
    except Exception as e:
        # Если произошла ошибка при декодировании или проверке
        return False


def verify_phantom_auth(
    message: str,
    signature: str,
    public_key: str
) -> None:
    """
    Проверяет подпись и выбрасывает исключение, если она невалидна.
    
    Raises:
        HTTPException: Если подпись невалидна
    """
    if not verify_phantom_signature(message, signature, public_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature"
        )

