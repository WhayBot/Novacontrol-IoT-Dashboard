from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import ControlCommand
from app.schemas import ControlCommandRequest
from app.services.websocket_service import manager


async def create_command(db: AsyncSession, data: ControlCommandRequest) -> ControlCommand:
    command = ControlCommand(
        device_id=data.device_id,
        command=data.command,
        value=data.value,
        executed=False,
    )
    db.add(command)
    await db.commit()
    await db.refresh(command)

    await manager.broadcast({
        "event": "control_created",
        "device_id": command.device_id,
        "payload": {"command": command.command, "value": command.value},
    })

    return command


async def get_pending_commands(db: AsyncSession, device_id: str) -> list[ControlCommand]:
    result = await db.execute(
        select(ControlCommand).where(
            ControlCommand.device_id == device_id,
            ControlCommand.executed == False,
        )
    )
    commands = list(result.scalars().all())

    for cmd in commands:
        cmd.executed = True

    await db.commit()
    return commands
