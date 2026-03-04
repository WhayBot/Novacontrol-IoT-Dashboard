import logging
import secrets
from datetime import datetime
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Device
from app.schemas import DeviceRegisterRequest, DeviceTelemetryUpdateRequest, HeartbeatRequest
from app.services.websocket_service import manager

logger = logging.getLogger("novacontrol")


async def register_device(db: AsyncSession, data: DeviceRegisterRequest) -> Device:
    result = await db.execute(select(Device).where(Device.device_id == data.device_id))
    device = result.scalar_one_or_none()

    if device:
        device.device_type = data.device_type
        device.controls = [c.model_dump() for c in data.controls]
        device.telemetry_schema = [t.model_dump() for t in data.telemetry]
        device.is_online = True
        device.last_heartbeat = datetime.utcnow()
    else:
        device = Device(
            device_id=data.device_id,
            device_type=data.device_type,
            controls=[c.model_dump() for c in data.controls],
            telemetry_schema=[t.model_dump() for t in data.telemetry],
            is_online=True,
            last_heartbeat=datetime.utcnow(),
            api_key=secrets.token_hex(32),
        )
        db.add(device)

    await db.commit()
    await db.refresh(device)

    await manager.broadcast({
        "event": "device_status_update",
        "device_id": device.device_id,
        "payload": {"status": "registered", "device_type": device.device_type},
    })

    return device


async def get_all_devices(db: AsyncSession) -> list[Device]:
    result = await db.execute(select(Device))
    return list(result.scalars().all())


async def get_device(db: AsyncSession, device_id: str) -> Device | None:
    result = await db.execute(select(Device).where(Device.device_id == device_id))
    return result.scalar_one_or_none()


async def validate_api_key(db: AsyncSession, device_id: str, api_key: str) -> Device | None:
    result = await db.execute(select(Device).where(Device.device_id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        return None
    if device.api_key != api_key:
        return False
    return device


async def process_heartbeat(db: AsyncSession, data: HeartbeatRequest) -> Device | None:
    result = await db.execute(select(Device).where(Device.device_id == data.device_id))
    device = result.scalar_one_or_none()

    if not device:
        return None

    device.last_heartbeat = datetime.utcnow()
    device.is_online = True
    await db.commit()
    await db.refresh(device)

    await manager.broadcast({
        "event": "device_status_update",
        "device_id": device.device_id,
        "payload": {"status": "online", "last_heartbeat": device.last_heartbeat.isoformat()},
    })

    return device


async def update_device_telemetry(db: AsyncSession, device_id: str, data: DeviceTelemetryUpdateRequest) -> Device | None:
    result = await db.execute(select(Device).where(Device.device_id == device_id))
    device = result.scalar_one_or_none()

    if not device:
        return None

    device.voltage = data.voltage
    device.is_online = data.status == "online"
    device.last_heartbeat = datetime.utcnow()
    await db.commit()
    await db.refresh(device)

    await manager.broadcast({
        "type": "telemetry_update",
        "device": {
            "id": device.device_id,
            "name": device.device_type,
            "status": "online" if device.is_online else "offline",
            "voltage": device.voltage,
            "lastSeen": device.last_heartbeat.isoformat() if device.last_heartbeat else None,
        },
    })

    return device


async def delete_device(db: AsyncSession, device_id: str) -> bool:
    result = await db.execute(select(Device).where(Device.device_id == device_id))
    device = result.scalar_one_or_none()

    if not device:
        return False

    await db.delete(device)
    await db.commit()

    await manager.broadcast({
        "event": "device_deleted",
        "device_id": device_id,
        "payload": {"message": "Device deleted"},
    })

    return True


async def delete_all_devices(db: AsyncSession) -> int:
    result = await db.execute(select(Device))
    devices = list(result.scalars().all())
    count = len(devices)

    await db.execute(delete(Device))
    await db.commit()

    await manager.broadcast({
        "event": "all_devices_cleared",
        "device_id": "*",
        "payload": {"count": count},
    })

    return count


async def check_offline_devices(db: AsyncSession):
    result = await db.execute(select(Device).where(Device.is_online == True))
    devices = list(result.scalars().all())
    now = datetime.utcnow()

    for device in devices:
        if not device.last_heartbeat:
            continue

        elapsed = (now - device.last_heartbeat).total_seconds()

        if elapsed > 30:
            device.is_online = False
            await db.commit()
            await db.refresh(device)

            logger.warning("Device %s marked offline. Last seen: %s (%.0fs ago)", device.device_id, device.last_heartbeat.isoformat(), elapsed)

            await manager.broadcast({
                "type": "device_status_update",
                "device": {
                    "id": device.device_id,
                    "name": device.device_type,
                    "status": "offline",
                    "voltage": device.voltage,
                    "lastSeen": device.last_heartbeat.isoformat() if device.last_heartbeat else None,
                },
            })
