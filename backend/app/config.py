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
    free_word_limit: int = 500
    admin_user_ids: str = ""
    resend_api_key: str = ""
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "echoic-audio"
    r2_public_url: str = ""

    model_config = {"env_file": ".env"}


settings = Settings()
