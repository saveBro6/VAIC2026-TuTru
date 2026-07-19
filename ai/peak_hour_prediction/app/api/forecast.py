from __future__ import annotations

from pathlib import Path

import pandas as pd
from fastapi import APIRouter, HTTPException, Request

from ..schemas.forecast import (
    ForecastRequest,
    ForecastResponse,
)
from ..services.forecast_service import (
    forecast_multiple_days,
)


router = APIRouter(
    prefix="/api/v1",
    tags=["Forecast"],
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_PATH = (
    PROJECT_ROOT
    / "data"
    / "checkin_slots_12_months_2025_07_to_2026_06.csv"
)


@router.get("/health")
def health_check(request: Request) -> dict:
    container = request.app.state.model_container
    routing_service = getattr(
        request.app.state,
        "routing_service",
        None,
    )

    return {
        "status": "ok",
        "services": {
            "peak_hour_prediction": container.is_ready(),
            "symptom_routing": routing_service is not None,
        },
    }


@router.post(
    "/forecasts",
    response_model=ForecastResponse,
)
def create_forecast(
    payload: ForecastRequest,
    request: Request,
) -> ForecastResponse:
    try:
        container = request.app.state.model_container

        if not container.is_ready():
            raise HTTPException(
                status_code=503,
                detail="Model chưa sẵn sàng",
            )

        if not DATA_PATH.exists():
            raise HTTPException(
                status_code=500,
                detail="Không tìm thấy dữ liệu check-in",
            )

        history = pd.read_csv(DATA_PATH)

        history["checkin_time"] = pd.to_datetime(
            history["checkin_time"]
        )

        metadata = container.metadata
        latest_history_date = history["checkin_time"].dt.date.max()
        forecast_days = payload.days
        forecast_date = payload.date

        if forecast_date is not None:
            forecast_days = (forecast_date - latest_history_date).days
            if forecast_days < 1:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        "date must be after the latest history date "
                        f"({latest_history_date.isoformat()})"
                    ),
                )
            if forecast_days > 7:
                raise HTTPException(
                    status_code=422,
                    detail="date must be within 7 days after the latest history date",
                )

        result = forecast_multiple_days(
            history=history,
            model=container.model,
            features=metadata["features"],
            peak_threshold=float(
                metadata["peak_threshold"]
            ),
            days=forecast_days,
        )

        if forecast_date is not None:
            result = result[
                result["checkin_time"].dt.date
                == forecast_date
            ]

        forecasts = []

        for row in result.to_dict(
            orient="records"
        ):
            forecasts.append(
                {
                    "checkin_time": row[
                        "checkin_time"
                    ],
                    "slot_index": int(
                        row["slot_index"]
                    ),
                    "predicted_checkin_count": float(
                        row[
                            "predicted_checkin_count"
                        ]
                    ),
                    "is_peak": bool(
                        row["is_peak"]
                    ),
                    "peak_level": row[
                        "peak_level"
                    ],
                }
            )

        return ForecastResponse(
            forecast_days=1 if forecast_date is not None else forecast_days,
            forecast_date=forecast_date,
            peak_threshold=float(
                metadata["peak_threshold"]
            ),
            forecasts=forecasts,
        )

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error
