from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.audit import router as audit_router
from app.routers.auth import router as auth_router
from app.routers.cart import router as cart_router
from app.routers.inventory import router as inventory_router
from app.routers.orders import router as orders_router
from app.routers.products import router as products_router
from app.routers.totem import router as totem_router
from app.routers.uploads import router as uploads_router


app = FastAPI(title="Gym Prime API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(audit_router)
app.include_router(auth_router)
app.include_router(cart_router)
app.include_router(inventory_router)
app.include_router(orders_router)
app.include_router(products_router)
app.include_router(totem_router)
app.include_router(uploads_router)


@app.get("/")
def read_root():
    return {"status": "ok", "service": "gym-prime-backend"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
