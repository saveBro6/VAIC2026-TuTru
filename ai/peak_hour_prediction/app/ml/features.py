from __future__ import annotations

import pandas as pd


def create_features(
    df: pd.DataFrame,
) -> pd.DataFrame:
    result = df.copy()

    result["checkin_time"] = pd.to_datetime(
        result["checkin_time"]
    )

    result = result.sort_values(
        "checkin_time"
    ).reset_index(drop=True)

    result["hour"] = (
        result["checkin_time"].dt.hour
    )

    result["minute"] = (
        result["checkin_time"].dt.minute
    )

    result["day_of_week"] = (
        result["checkin_time"].dt.dayofweek
    )

    result["day_of_month"] = (
        result["checkin_time"].dt.day
    )

    result["month"] = (
        result["checkin_time"].dt.month
    )

    result["week_of_year"] = (
        result["checkin_time"]
        .dt.isocalendar()
        .week.astype(int)
    )

    result["is_weekend"] = (
        result["day_of_week"] >= 5
    ).astype(int)

    result["is_monday"] = (
        result["day_of_week"] == 0
    ).astype(int)

    grouped = result.groupby(
        "slot_index"
    )["checkin_count"]

    result["lag_1_day"] = grouped.shift(1)

    result["lag_7_days"] = grouped.shift(7)

    result["rolling_mean_same_slot_3_days"] = (
        result.groupby(
            "slot_index"
        )["checkin_count"]
        .transform(
            lambda values:
            values.shift(1).rolling(3).mean()
        )
    )

    result["rolling_std_same_slot_3_days"] = (
        result.groupby(
            "slot_index"
        )["checkin_count"]
        .transform(
            lambda values:
            values.shift(1).rolling(3).std()
        )
    )

    return result