from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib


PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    PROJECT_ROOT
    / "models"
    / "checkin_forecast_model.joblib"
)

METADATA_PATH = (
    PROJECT_ROOT
    / "models"
    / "model_metadata.json"
)


class ModelContainer:
    def __init__(self) -> None:
        self.model: Any | None = None
        self.metadata: dict | None = None

    def load(self) -> None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Không tìm thấy model tại {MODEL_PATH}"
            )

        if not METADATA_PATH.exists():
            raise FileNotFoundError(
                f"Không tìm thấy metadata tại {METADATA_PATH}"
            )

        self.model = joblib.load(MODEL_PATH)

        self.metadata = json.loads(
            METADATA_PATH.read_text(encoding="utf-8")
        )

    def is_ready(self) -> bool:
        return (
            self.model is not None
            and self.metadata is not None
        )


model_container = ModelContainer()