from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.forecast import router
from app.ml.model_loader import model_container


@asynccontextmanager
async def lifespan(app: FastAPI):
    model_container.load()

    app.state.model_container = (
        model_container
    )

    yield


app = FastAPI(
    title="peak hour prediction",
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(router)


@app.get("/")
def root() -> dict:
    return {
        "message": (
            "Hospital Check-in Forecast API"
        )
    }