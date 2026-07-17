from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str
    app_version: str
    app_env: str
    debug: bool

    api_prefix: str
    host: str
    port: int

    model_path: str
    model_metadata_path: str
    checkin_data_path: str

    forecast_max_days: int = Field(
        ge=1,
        le=30,
    )

    cors_origins: str

    # Cho phép không cấu hình database trong giai đoạn dùng CSV
    database_url: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def model_file(self) -> Path:
        return PROJECT_ROOT / self.model_path

    @property
    def metadata_file(self) -> Path:
        return PROJECT_ROOT / self.model_metadata_path

    @property
    def checkin_data_file(self) -> Path:
        return PROJECT_ROOT / self.checkin_data_path

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()