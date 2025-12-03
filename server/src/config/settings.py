from pydantic_settings import BaseSettings
from functools import cached_property
from pydantic import SecretStr


class Settings(BaseSettings):
    db_user: str = "pazaak3_db"
    db_password: str = "pazaak3_db"
    db_name: str = "pazaak3_db"
    db_host: str = "localhost"
    db_port: int = 5435
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60 * 24

    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = "pazaak3_redis"

    keypair_path: str = "data/server-keypair.json"
    game_program_id: str = "HGXYnpJBx4U3vbBY4UgrkkWYqyy7mVqAbnaby3sJuLFQ"
    solana_cluster_url: str = "https://api.devnet.solana.com"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.db_user}:"
            f"{self.db_password}@{self.db_host}:"
            f"{self.db_port}/{self.db_name}"
        )

    @cached_property
    def raw_keypair(self) -> SecretStr:
        with open(self.keypair_path, encoding="utf-8") as keypair_file:
            return SecretStr(keypair_file.read())


settings = Settings()
