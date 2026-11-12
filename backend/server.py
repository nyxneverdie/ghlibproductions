import json
import os

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes_auth import router as auth_router
from routes_public import router as public_router
from routes_client import router as client_router
from routes_admin import router as admin_router
from routes_membership import router as membership_router

ROOT = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(ROOT, ".env"))

app = FastAPI(title="ghlibproduction API")

app.include_router(auth_router)
app.include_router(public_router)
app.include_router(client_router)
app.include_router(admin_router)
app.include_router(membership_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


PROFILE_SEED = {
    "studio_name": "ghlibproduction",
    "tagline": "Studio fotografi & film yang mengabadikan momen dengan sentuhan sinematik.",
    "bio": "ghlibproduction adalah studio kreatif yang berfokus pada fotografi portrait, wedding, event, product, dan film pendek. Setiap proyek dikerjakan dengan kurasi warna, cahaya, dan komposisi yang khas.",
    "location": "Jakarta, Indonesia",
    "email": "hello@ghlibproduction.id",
    "phone": "+62 812-3456-7890",
    "instagram": "https://instagram.com/ghlibproduction",
    "youtube": "https://youtube.com/@ghlibproduction",
    "categories": ["Portrait", "Wedding", "Event", "Product", "Graduation", "Film"],
    "services": [
        {"name": "Portrait Session", "desc": "Sesi portrait personal 1-2 jam, 15 foto editan terpilih, galeri proofing online.", "price": "Rp 1.500.000"},
        {"name": "Wedding Story", "desc": "Dokumentasi wedding penuh, 300+ foto, film sinematik 3 menit, galeri keluarga.", "price": "Rp 12.000.000"},
        {"name": "Event Coverage", "desc": "Dokumentasi event 4-8 jam, 100+ foto editan, highlight reel.", "price": "Rp 4.500.000"},
        {"name": "Product Film", "desc": "Foto & video product untuk katalog dan iklan, art direction lengkap.", "price": "Rp 6.000.000"},
        {"name": "Graduation", "desc": "Sesi foto wisuda dengan styling, 20 foto editan, cetak siap frame.", "price": "Rp 1.200.000"},
    ],
}

PORTFOLIO_SEED = [
    {"title": "Veil Study", "category": "Portrait", "url": "https://images.unsplash.com/photo-1762504013915-c1faf57f291b?crop=entropy&cs=srgb&fm=jpg&q=85", "featured": True, "visible": True, "order": 0},
    {"title": "Golden Vow", "category": "Wedding", "url": "https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?crop=entropy&cs=srgb&fm=jpg&q=85", "featured": True, "visible": True, "order": 1},
    {"title": "Emerald Room", "category": "Portrait", "url": "https://images.unsplash.com/photo-1720022785516-9653ead7180c?crop=entropy&cs=srgb&fm=jpg&q=85", "featured": True, "visible": True, "order": 2},
    {"title": "City Rain Reel", "category": "Film", "url": "https://images.unsplash.com/photo-1544259342-306eccfec481?crop=entropy&cs=srgb&fm=jpg&q=85", "featured": True, "visible": True, "order": 3},
    {"title": "Bouquet Light", "category": "Wedding", "url": "https://images.unsplash.com/photo-1519741497674-611481863552?crop=entropy&cs=srgb&fm=jpg&q=85", "featured": True, "visible": True, "order": 4},
    {"title": "Halo Podium", "category": "Product", "url": "https://images.unsplash.com/photo-1760860992203-85ca32536788?crop=entropy&cs=srgb&fm=jpg&q=85", "featured": True, "visible": True, "order": 5},
    {"title": "Hallway Shadow", "category": "Portrait", "url": "https://images.unsplash.com/photo-1769650795529-18ad9d78cd5a?crop=entropy&cs=srgb&fm=jpg&q=85", "featured": False, "visible": True, "order": 6},
    {"title": "Confetti Night", "category": "Event", "url": "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?crop=entropy&cs=srgb&fm=jpg&q=85", "featured": False, "visible": True, "order": 7},
    {"title": "Cap in the Sky", "category": "Graduation", "url": "https://images.unsplash.com/photo-1639765766830-d829d2fe4219?crop=entropy&cs=srgb&fm=jpg&q=85", "featured": False, "visible": True, "order": 8},
    {"title": "Street Fog", "category": "Film", "url": "https://images.unsplash.com/photo-1517328894681-0f5dfabd463c?crop=entropy&cs=srgb&fm=jpg&q=85", "featured": False, "visible": True, "order": 9},
]


@app.on_event("startup")
async def on_startup():
    from models import create_tables
    from database import get_conn
    from helpers import new_id, now_iso

    await create_tables()

    async with get_conn() as conn:
        # Seed profile settings
        existing_profile = await conn.fetchrow("SELECT key FROM settings WHERE key = 'profile'")
        if not existing_profile:
            await conn.execute(
                "INSERT INTO settings (key, data) VALUES ('profile', $1::jsonb)",
                json.dumps(PROFILE_SEED),
            )

        # Seed portfolio items
        count = await conn.fetchval("SELECT COUNT(*) FROM portfolio_items")
        if count == 0:
            for item in PORTFOLIO_SEED:
                item_id = f"pf_{abs(hash(item['title'])) % 10**10}"
                await conn.execute(
                    """
                    INSERT INTO portfolio_items
                        (item_id, title, category, url, media_type, featured, visible, sort_order, created_at)
                    VALUES ($1, $2, $3, $4, 'photo', $5, $6, $7, $8)
                    ON CONFLICT (item_id) DO NOTHING
                    """,
                    item_id, item["title"], item["category"], item["url"],
                    item["featured"], item["visible"], item["order"], "2024-01-01T00:00:00+00:00",
                )


@app.get("/api/health")
async def health():
    return {"ok": True}
