from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf_8")

    cosmos_endpoint: str
    cosmos_key: str
    cosmos_database: str
    cosmos_conaitner: str

settings = Settings()
