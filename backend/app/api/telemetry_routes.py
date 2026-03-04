from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import TelemetryRequest, TelemetryResponse
from app.services import telemetry_service

router = APIRouter(prefix="/api", tags=["Telemetry"])


@router.post("/telemetry", response_model=TelemetryResponse)
async def post_telemetry(data: TelemetryRequest, db: AsyncSession = Depends(get_db)):
    return await telemetry_service.store_telemetry(db, data)
