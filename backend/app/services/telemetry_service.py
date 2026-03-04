from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Telemetry
from app.schemas import TelemetryRequest
from app.services.websocket_service import manager


async def store_telemetry(db: AsyncSession, data: TelemetryRequest) -> Telemetry:
    entry = Telemetry(
        device_id=data.device_id,
        timestamp=datetime.now(timezone.utc),
        payload=data.payload,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    await manager.broadcast({
        "event": "telemetry_update",
        "device_id": entry.device_id,
        "payload": entry.payload,
    })

    return entry
