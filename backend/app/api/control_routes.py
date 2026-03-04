from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import ControlCommandRequest, ControlCommandResponse
from app.services import control_service

router = APIRouter(prefix="/api", tags=["Control"])


@router.post("/control", response_model=ControlCommandResponse)
async def create_control(data: ControlCommandRequest, db: AsyncSession = Depends(get_db)):
    return await control_service.create_command(db, data)


@router.get("/commands/{device_id}", response_model=list[ControlCommandResponse])
async def get_commands(device_id: str, db: AsyncSession = Depends(get_db)):
    return await control_service.get_pending_commands(db, device_id)
