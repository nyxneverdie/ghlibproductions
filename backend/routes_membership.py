"""Manual QRIS payment verification and 30-day membership access."""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel

from auth_core import get_admin_user, get_current_user
from database import get_conn, row, rows
from helpers import new_id, notify, notify_admins

router = APIRouter(prefix="/api", tags=["membership"])
MAX_PROOF_BYTES = 3 * 1024 * 1024


def proof_media_type(data: bytes):
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    return None


def next_period(expires_at, now):
    """Extend an active membership; otherwise start the new period now."""
    start = max(expires_at, now) if expires_at else now
    return start, start + timedelta(days=30)


@router.get("/membership")
async def membership_status(request: Request):
    user = await get_current_user(request)
    async with get_conn() as conn:
        expiry = await conn.fetchval("SELECT expires_at FROM memberships WHERE user_id = $1", user["user_id"])
        history = await conn.fetch(
            "SELECT payment_id, amount, status, submitted_at, reviewed_at, rejection_reason, starts_at, ends_at "
            "FROM membership_payments WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT 30", user["user_id"]
        )
    return {"plan": "pro" if expiry and expiry > datetime.now(timezone.utc) else "free",
            "expires_at": expiry, "payments": rows(history)}


@router.post("/membership/payments")
async def submit_payment(request: Request, proof: UploadFile = File(...)):
    user = await get_current_user(request)
    data = await proof.read(MAX_PROOF_BYTES + 1)
    if len(data) > MAX_PROOF_BYTES:
        raise HTTPException(status_code=413, detail="Ukuran bukti maksimal 3 MB.")
    media_type = proof_media_type(data)
    if not media_type:
        raise HTTPException(status_code=400, detail="Bukti harus berupa gambar JPG atau PNG.")
    async with get_conn() as conn:
        async with conn.transaction():
            await conn.execute("SELECT pg_advisory_xact_lock(hashtext($1))", "membership:" + user["user_id"])
            pending = await conn.fetchval("SELECT EXISTS(SELECT 1 FROM membership_payments WHERE user_id=$1 AND status='pending')", user["user_id"])
            if pending:
                raise HTTPException(status_code=409, detail="Bukti sebelumnya masih menunggu verifikasi.")
            payment_id = new_id("pay")
            await conn.execute("INSERT INTO membership_payments(payment_id,user_id,proof,proof_type) VALUES($1,$2,$3,$4)",
                               payment_id, user["user_id"], data, media_type)
            await notify_admins(conn, "membership_payment", "Bukti pembayaran Pro baru",
                                f"{user['name']} mengirim bukti pembayaran membership.", "/admin/membership")
    return {"payment_id": payment_id, "status": "pending"}


@router.get("/admin/membership/payments")
async def list_membership_payments(request: Request):
    await get_admin_user(await get_current_user(request))
    async with get_conn() as conn:
        payments = await conn.fetch(
            "SELECT p.payment_id,p.user_id,p.amount,p.status,p.submitted_at,p.reviewed_at,"
            "p.rejection_reason,p.starts_at,p.ends_at,u.name,u.email "
            "FROM membership_payments p JOIN users u ON u.user_id=p.user_id "
            "ORDER BY (p.status = 'pending') DESC,p.submitted_at DESC LIMIT 200"
        )
    return {"payments": rows(payments)}


@router.get("/admin/membership/payments/{payment_id}/proof")
async def payment_proof(payment_id: str, request: Request):
    await get_admin_user(await get_current_user(request))
    async with get_conn() as conn:
        proof = await conn.fetchrow("SELECT proof,proof_type FROM membership_payments WHERE payment_id=$1", payment_id)
    if not proof:
        raise HTTPException(status_code=404, detail="Bukti tidak ditemukan.")
    return Response(content=proof["proof"], media_type=proof["proof_type"], headers={
        "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
    })


class ReviewIn(BaseModel):
    decision: str
    reason: str = ""


@router.post("/admin/membership/payments/{payment_id}/review")
async def review_payment(payment_id: str, body: ReviewIn, request: Request):
    admin = await get_admin_user(await get_current_user(request))
    if body.decision not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="Keputusan tidak valid.")
    reason = body.reason.strip()
    if body.decision == "reject" and not reason:
        raise HTTPException(status_code=400, detail="Alasan penolakan harus diisi.")
    if len(reason) > 500:
        raise HTTPException(status_code=400, detail="Alasan maksimal 500 karakter.")
    async with get_conn() as conn:
        async with conn.transaction():
            payment = await conn.fetchrow("SELECT payment_id,user_id,status FROM membership_payments WHERE payment_id=$1 FOR UPDATE", payment_id)
            if not payment:
                raise HTTPException(status_code=404, detail="Pembayaran tidak ditemukan.")
            if payment["status"] != "pending":
                raise HTTPException(status_code=409, detail="Pembayaran sudah ditinjau.")
            now = datetime.now(timezone.utc)
            start = end = None
            if body.decision == "approve":
                await conn.execute("SELECT pg_advisory_xact_lock(hashtext($1))", "membership:" + payment["user_id"])
                expiry = await conn.fetchval("SELECT expires_at FROM memberships WHERE user_id=$1", payment["user_id"])
                start, end = next_period(expiry, now)
                await conn.execute("INSERT INTO memberships(user_id,expires_at,updated_at) VALUES($1,$2,$3) "
                                   "ON CONFLICT(user_id) DO UPDATE SET expires_at=EXCLUDED.expires_at,updated_at=EXCLUDED.updated_at",
                                   payment["user_id"], end, now)
            status = "approved" if body.decision == "approve" else "rejected"
            await conn.execute("UPDATE membership_payments SET status=$1,reviewed_at=$2,reviewed_by=$3,"
                               "rejection_reason=$4,starts_at=$5,ends_at=$6 WHERE payment_id=$7",
                               status, now, admin["user_id"], reason if status == "rejected" else None, start, end, payment_id)
            await notify(conn, payment["user_id"], "membership_review", "Pembayaran Pro " + ("disetujui" if status == "approved" else "ditolak"),
                         "Membership Pro telah diperbarui." if status == "approved" else reason, "/dashboard/membership")
    return {"status": status, "starts_at": start, "ends_at": end}
