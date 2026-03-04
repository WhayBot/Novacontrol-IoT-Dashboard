from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import (
    DeviceRegisterRequest,
    DeviceRegisterResponse,
    DeviceResponse,
    DeviceTelemetryUpdateRequest,
    HeartbeatRequest,
    MessageResponse,
)
from app.services import device_service

router = APIRouter(prefix="/api", tags=["Devices"])


@router.post("/register", response_model=DeviceRegisterResponse)
async def register_device(data: DeviceRegisterRequest, db: AsyncSession = Depends(get_db)):
    device = await device_service.register_device(db, data)
    return device


@router.get("/devices", response_model=list[DeviceResponse])
async def list_devices(db: AsyncSession = Depends(get_db)):
    return await device_service.get_all_devices(db)


@router.get("/devices/{device_id}", response_model=DeviceResponse)
async def get_device(device_id: str, db: AsyncSession = Depends(get_db)):
    device = await device_service.get_device(db, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.delete("/devices/{device_id}", response_model=MessageResponse)
async def remove_device(device_id: str, db: AsyncSession = Depends(get_db)):
    deleted = await device_service.delete_device(db, device_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Device not found")
    return {"message": "Device deleted successfully"}


@router.delete("/devices", response_model=MessageResponse)
async def remove_all_devices(db: AsyncSession = Depends(get_db)):
    await device_service.delete_all_devices(db)
    return {"message": "All devices cleared"}


@router.post("/heartbeat", response_model=DeviceResponse)
async def heartbeat(
    data: HeartbeatRequest,
    db: AsyncSession = Depends(get_db),
    x_api_key: str = Header(None),
):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API key is required")

    auth = await device_service.validate_api_key(db, data.device_id, x_api_key)
    if auth is None:
        raise HTTPException(status_code=404, detail="Device not found")
    if auth is False:
        raise HTTPException(status_code=403, detail="Invalid API key")

    device = await device_service.process_heartbeat(db, data)
    return device


@router.post("/devices/{device_id}/telemetry", response_model=DeviceResponse)
async def update_telemetry(
    device_id: str,
    data: DeviceTelemetryUpdateRequest,
    db: AsyncSession = Depends(get_db),
    x_api_key: str = Header(None),
):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API key is required")

    auth = await device_service.validate_api_key(db, device_id, x_api_key)
    if auth is None:
        raise HTTPException(status_code=404, detail="Device not found")
    if auth is False:
        raise HTTPException(status_code=403, detail="Invalid API key")

    device = await device_service.update_device_telemetry(db, device_id, data)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device
