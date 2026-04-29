from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    gemini_api_key: str = ""
    upload_dir: str = "uploads"
    output_dir: str = "output"
    max_file_size_mb: int = 50
    allowed_origins: list[str] = ["http://localhost:3000", "http://localhost:3001", "https://echoic.studio"]
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    frontend_url: str = "http://localhost:3001"
    free_word_limit: int = 5000

    model_config = {"env_file": ".env"}


settings = Settings()
