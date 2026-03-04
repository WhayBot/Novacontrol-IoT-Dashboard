from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, JSON
from app.database import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, index=True, nullable=False)
    device_type = Column(String, nullable=False)
    controls = Column(JSON, default=list)
    telemetry_schema = Column(JSON, default=list)
    last_heartbeat = Column(DateTime, default=None)
    is_online = Column(Boolean, default=False)
    voltage = Column(Float, default=0.0)
    api_key = Column(String, nullable=True)


class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    payload = Column(JSON, nullable=False)


class ControlCommand(Base):
    __tablename__ = "control_commands"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, index=True, nullable=False)
    command = Column(String, nullable=False)
    value = Column(String, nullable=True)
    executed = Column(Boolean, default=False)
