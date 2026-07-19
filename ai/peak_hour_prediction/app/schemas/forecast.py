from __future__ import annotations

from datetime import date as Date
from datetime import datetime

from pydantic import BaseModel, Field


class ForecastRequest(BaseModel):
    days: int = Field(
        default=1,
        ge=1,
        le=7,
        description="Số ngày cần dự báo",
    )
    date: Date | None = Field(
        default=None,
        description="Forecast date. When provided, only this day is returned.",
    )


class ForecastItem(BaseModel):
    checkin_time: datetime
    slot_index: int
    predicted_checkin_count: float
    is_peak: bool
    peak_level: str


class ForecastResponse(BaseModel):
    forecast_days: int
    forecast_date: Date | None = None
    peak_threshold: float
    forecasts: list[ForecastItem]
