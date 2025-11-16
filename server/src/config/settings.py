from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    db_user: str = 'pazaak3_db'
    db_password: str = 'pazaak3_db'
    db_name: str = 'pazaak3_db'
    db_host: str = 'localhost'
    db_port: int = 5435
    jwt_secret_key: str = 'your-secret-key-change-in-production'
    jwt_algorithm: str = 'HS256'
    jwt_access_token_expire_minutes: int = 30

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.db_user}:"
            f"{self.db_password}@{self.db_host}:"
            f"{self.db_port}/{self.db_name}"
        )


settings = Settings()
