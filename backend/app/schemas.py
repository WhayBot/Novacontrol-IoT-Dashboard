from datetime import datetime
from typing import Any, Literal, Optional
from pydantic import BaseModel


class ControlDefinition(BaseModel):
    id: str
    type: str


class TelemetryDefinition(BaseModel):
    id: str
    type: str


class DeviceRegisterRequest(BaseModel):
    device_id: str
    device_type: str
    controls: list[ControlDefinition] = []
    telemetry: list[TelemetryDefinition] = []


class DeviceResponse(BaseModel):
    id: int
    device_id: str
    device_type: str
    controls: Any
    telemetry_schema: Any
    last_heartbeat: Optional[datetime] = None
    is_online: bool
    voltage: float = 0.0

    class Config:
        from_attributes = True


class DeviceRegisterResponse(DeviceResponse):
    api_key: str


class TelemetryRequest(BaseModel):
    device_id: str
    payload: dict[str, Any]


class TelemetryResponse(BaseModel):
    id: int
    device_id: str
    timestamp: datetime
    payload: Any

    class Config:
        from_attributes = True


class ControlCommandRequest(BaseModel):
    device_id: str
    command: str
    value: Optional[str] = None


class ControlCommandResponse(BaseModel):
    id: int
    device_id: str
    command: str
    value: Optional[str] = None
    executed: bool

    class Config:
        from_attributes = True


class HeartbeatRequest(BaseModel):
    device_id: str


class WebSocketMessage(BaseModel):
    event: str
    device_id: str
    payload: dict[str, Any] = {}


class DeviceTelemetryUpdateRequest(BaseModel):
    voltage: float
    status: Literal["online", "offline"]


class MessageResponse(BaseModel):
    message: str
