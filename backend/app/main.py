import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db, async_session
from app.api.device_routes import router as device_router
from app.api.telemetry_routes import router as telemetry_router
from app.api.control_routes import router as control_router
from app.api.websocket_routes import router as websocket_router
from app.services.device_service import check_offline_devices

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("novacontrol")


async def offline_checker_loop():
    while True:
        await asyncio.sleep(10)
        try:
            async with async_session() as db:
                await check_offline_devices(db)
        except Exception as e:
            logger.error("Offline checker error: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    task = asyncio.create_task(offline_checker_loop())
    yield
    task.cancel()


app = FastAPI(
    title="NovaControl",
    description="Universal IoT Telemetry & Control Dashboard API",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(device_router)
app.include_router(telemetry_router)
app.include_router(control_router)
app.include_router(websocket_router)
