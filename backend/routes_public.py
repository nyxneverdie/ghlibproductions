import json

from fastapi import APIRouter
from pydantic import BaseModel

from database import get_conn, row, rows
from helpers import new_id, now_iso, notify_admins

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/home")
async def public_home():
    async with get_conn() as conn:
        settings_row = await conn.fetchrow("SELECT data FROM settings WHERE key = 'profile'")
        profile = {}
        if settings_row:
            d = settings_row["data"]
            profile = d if isinstance(d, dict) else json.loads(d)
            profile["key"] = "profile"

        portfolio_rows = await conn.fetch(
            "SELECT * FROM portfolio_items WHERE visible = TRUE ORDER BY sort_order ASC LIMIT 100"
        )
        portfolio = rows(portfolio_rows)

    return {
        "profile": profile,
        "portfolio": portfolio,
        "categories": profile.get("categories", []),
        "services": profile.get("services", []),
    }


class BookingIn(BaseModel):
    name: str
    email: str
    phone: str = ""
    service_type: str
    requested_date: str = ""
    requested_time: str = ""
    location: str = ""
    notes: str = ""
    request_id: str | None = None


@router.post("/bookings")
async def create_public_booking(input: BookingIn):
    session_id = new_id("ses")
    async with get_conn() as conn:
        async with conn.transaction():
            if input.request_id:
                await conn.execute("SELECT pg_advisory_xact_lock(hashtext($1))", "booking:" + input.request_id)
                previous = await conn.fetchval("SELECT session_id FROM booking_sessions WHERE request_id=$1", input.request_id)
                if previous:
                    return {"ok": True, "session_id": previous}
            await conn.execute(
                """
                INSERT INTO booking_sessions
                    (session_id, user_id, name, email, phone, service_type,
                     requested_date, requested_time, location, notes, status, proposed_date, created_at, request_id)
                VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', NULL, $10, $11)
                """,
                session_id, input.name, input.email, input.phone, input.service_type,
                input.requested_date, input.requested_time, input.location, input.notes, now_iso(), input.request_id,
            )
            await notify_admins(
                conn, "session_request", "Permintaan sesi baru",
                f"{input.name} mengajukan sesi {input.service_type} pada {input.requested_date or '-' }.",
                "/admin/sessions",
            )
    return {"ok": True, "session_id": session_id}
