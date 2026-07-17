from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ForecastRequest(BaseModel):
    days: int = Field(
        default=1,
        ge=1,
        le=7,
        description="Số ngày cần dự báo",
    )


class ForecastItem(BaseModel):
    checkin_time: datetime
    slot_index: int
    predicted_checkin_count: float
    is_peak: bool
    peak_level: str


class ForecastResponse(BaseModel):
    forecast_days: int
    peak_threshold: float
    forecasts: list[ForecastItem]