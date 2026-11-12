from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from database import get_conn, row, rows
from auth_core import get_current_user
from helpers import new_id, now_iso, notify, notify_admins, log_activity

router = APIRouter(prefix="/api/me", tags=["client"])


async def my_client_record(conn, user, *, required=True):
    rec = await conn.fetchrow("SELECT * FROM clients WHERE user_id = $1", user["user_id"])
    if not rec and required:
        raise HTTPException(status_code=404, detail="Akun Anda belum terhubung ke data klien. Hubungi studio.")
    return row(rec)


async def owned_project(conn, user, project_id):
    client_rec = await my_client_record(conn, user)
    project = await conn.fetchrow(
        "SELECT * FROM projects WHERE project_id = $1 AND client_id = $2",
        project_id, client_rec["client_id"],
    )
    if not project:
        raise HTTPException(status_code=404, detail="Proyek tidak ditemukan")
    return row(project)


@router.get("/overview")
async def overview(request: Request):
    user = await get_current_user(request)
    async with get_conn() as conn:
        client_rec = await my_client_record(conn, user, required=False)
        projects = []
        if client_rec:
            project_rows = await conn.fetch(
                "SELECT * FROM projects WHERE client_id = $1 ORDER BY created_at DESC LIMIT 200",
                client_rec["client_id"],
            )
            projects = rows(project_rows)
        notif_count = await conn.fetchval(
            "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL", user["user_id"]
        )
        session_rows = await conn.fetch(
            "SELECT * FROM booking_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50", user["user_id"]
        )
        sessions = rows(session_rows)
        notif_rows = await conn.fetch(
            "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 6", user["user_id"]
        )
        notifs = rows(notif_rows)

    return {
        "projects": projects,
        "stats": {
            "active_projects": len([p for p in projects if p["status"] not in ("completed", "archived")]),
            "galleries_awaiting": len([p for p in projects if p["status"] == "proofing"]),
            "revisions_open": len([p for p in projects if p["status"] in ("revision_requested", "client_review")]),
            "finals_available": len([p for p in projects if p["status"] in ("final_delivered", "completed")]),
        },
        "upcoming_sessions": [s for s in sessions if s["status"] in ("pending", "approved")][:5],
        "recent_notifications": notifs,
        "unread_notifications": notif_count,
    }


@router.get("/projects")
async def my_projects(request: Request):
    user = await get_current_user(request)
    async with get_conn() as conn:
        client_rec = await my_client_record(conn, user, required=False)
        if not client_rec:
            return {"projects": []}
        project_rows = await conn.fetch(
            "SELECT * FROM projects WHERE client_id = $1 ORDER BY created_at DESC LIMIT 200",
            client_rec["client_id"],
        )
        projects = rows(project_rows)
        for p in projects:
            p["photo_count"] = await conn.fetchval(
                "SELECT COUNT(*) FROM assets WHERE project_id = $1", p["project_id"]
            )
    return {"projects": projects}


@router.get("/projects/{project_id}")
async def project_detail(project_id: str, request: Request):
    user = await get_current_user(request)
    async with get_conn() as conn:
        project = await owned_project(conn, user, project_id)
        sel_rows = await conn.fetch(
            "SELECT * FROM photo_selections WHERE project_id = $1 AND client_id = $2",
            project_id, project["client_id"],
        )
        selections = rows(sel_rows)
        revision_count = await conn.fetchval(
            "SELECT COUNT(*) FROM revision_requests WHERE project_id = $1", project_id
        )
    return {"project": project, "selections": selections, "revision_count": revision_count}


@router.get("/projects/{project_id}/assets")
async def project_assets(project_id: str, stage: str = "proofing", request: Request = None):
    user = await get_current_user(request)
    async with get_conn() as conn:
        await owned_project(conn, user, project_id)
        asset_rows = await conn.fetch(
            "SELECT * FROM assets WHERE project_id = $1 AND stage = $2 ORDER BY sort_order ASC LIMIT 1000",
            project_id, stage,
        )
    return {"assets": rows(asset_rows)}


@router.get("/assets/{asset_id}/versions")
async def client_asset_versions(asset_id: str, request: Request):
    from datetime import datetime, timezone
    user = await get_current_user(request)
    async with get_conn() as conn:
        asset = await conn.fetchrow("SELECT * FROM assets WHERE asset_id=$1", asset_id)
        if not asset:
            raise HTTPException(status_code=404, detail="Media tidak ditemukan")
        await owned_project(conn, user, asset["project_id"])
        expiry = await conn.fetchval("SELECT expires_at FROM memberships WHERE user_id=$1", user["user_id"])
        is_pro = bool(expiry and expiry > datetime.now(timezone.utc))
        versions = await conn.fetch(
            "SELECT version_id,version_number,url,version_notes,created_at FROM asset_versions "
            "WHERE asset_id=$1 ORDER BY version_number DESC LIMIT $2", asset_id, 1000 if is_pro else 2,
        )
    return {"versions": rows(versions), "is_pro": is_pro}


@router.get("/projects/{project_id}/activity")
async def project_activity(project_id: str, request: Request):
    user = await get_current_user(request)
    async with get_conn() as conn:
        await owned_project(conn, user, project_id)
        log_rows = await conn.fetch(
            "SELECT * FROM activity_logs WHERE project_id = $1 ORDER BY created_at DESC LIMIT 100", project_id
        )
    logs = []
    for r in log_rows:
        d = row(r)
        md = d.get("metadata")
        if isinstance(md, str):
            import json
            d["metadata"] = json.loads(md)
        logs.append(d)
    return {"logs": logs}


class SelectIn(BaseModel):
    asset_id: str
    note: str = ""


@router.post("/projects/{project_id}/select")
async def select_photo(project_id: str, input: SelectIn, request: Request):
    user = await get_current_user(request)
    async with get_conn() as conn:
        project = await owned_project(conn, user, project_id)
        if project["status"] not in ("proofing",):
            raise HTTPException(status_code=400, detail="Galeri ini tidak menerima seleksi saat ini")
        asset = await conn.fetchrow(
            "SELECT * FROM assets WHERE asset_id = $1 AND project_id = $2", input.asset_id, project_id
        )
        if not asset or asset["stage"] != "proofing":
            raise HTTPException(status_code=404, detail="Media tidak ditemukan")

        client_rec = await my_client_record(conn, user)
        limit = project.get("selection_limit") or 0
        existing = await conn.fetchrow(
            "SELECT selection_id FROM photo_selections WHERE project_id = $1 AND asset_id = $2 AND client_id = $3",
            project_id, input.asset_id, client_rec["client_id"],
        )
        if existing:
            await conn.execute(
                "UPDATE photo_selections SET note = $1, selected_at = $2 WHERE selection_id = $3",
                input.note, now_iso(), existing["selection_id"],
            )
            return {"ok": True, "updated": True}

        count = await conn.fetchval(
            "SELECT COUNT(*) FROM photo_selections WHERE project_id = $1 AND client_id = $2",
            project_id, client_rec["client_id"],
        )
        if limit and count >= limit:
            raise HTTPException(status_code=400, detail=f"Kuota seleksi tercapai ({limit} foto)")

        await conn.execute(
            """
            INSERT INTO photo_selections
                (selection_id, project_id, asset_id, client_id, note, selected_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            """,
            new_id("sel"), project_id, input.asset_id, client_rec["client_id"], input.note, now_iso(),
        )
        await conn.execute("UPDATE assets SET status = 'selected' WHERE asset_id = $1", input.asset_id)
    return {"ok": True}


@router.delete("/projects/{project_id}/select/{asset_id}")
async def deselect_photo(project_id: str, asset_id: str, request: Request):
    user = await get_current_user(request)
    async with get_conn() as conn:
        project = await owned_project(conn, user, project_id)
        if project["status"] != "proofing":
            raise HTTPException(status_code=400, detail="Seleksi sudah dikirim dan tidak dapat diubah")
        client_rec = await my_client_record(conn, user)
        await conn.execute(
            "DELETE FROM photo_selections WHERE project_id = $1 AND asset_id = $2 AND client_id = $3",
            project_id, asset_id, client_rec["client_id"],
        )
        await conn.execute("UPDATE assets SET status = 'proof_published' WHERE asset_id = $1", asset_id)
    return {"ok": True}


@router.post("/projects/{project_id}/submit-selections")
async def submit_selections(project_id: str, request: Request):
    user = await get_current_user(request)
    async with get_conn() as conn:
        project = await owned_project(conn, user, project_id)
        if project["status"] != "proofing":
            raise HTTPException(status_code=400, detail="Seleksi sudah pernah dikirim")
        client_rec = await my_client_record(conn, user)
        count = await conn.fetchval(
            "SELECT COUNT(*) FROM photo_selections WHERE project_id = $1 AND client_id = $2",
            project_id, client_rec["client_id"],
        )
        if count == 0:
            raise HTTPException(status_code=400, detail="Pilih minimal satu foto sebelum mengirim")

        await conn.execute(
            "UPDATE projects SET status = 'selection_submitted', selections_submitted_at = $1 WHERE project_id = $2",
            now_iso(), project_id,
        )
        await notify_admins(conn, "selection_submitted", "Seleksi foto dikirim",
                            f"Klien {client_rec['name']} mengirim {count} pilihan untuk proyek {project['title']}.",
                            f"/admin/projects/{project_id}")
        await log_activity(conn, user["user_id"], user["name"], project_id, "submitted_selection", {"count": count})
    return {"ok": True, "count": count}


class RevisionIn(BaseModel):
    request_text: str
    annotation_x: float | None = None
    annotation_y: float | None = None
    video_seconds: float | None = None


@router.post("/assets/{asset_id}/revisions")
async def create_revision(asset_id: str, input: RevisionIn, request: Request):
    user = await get_current_user(request)
    async with get_conn() as conn:
        async with conn.transaction():
            asset = await conn.fetchrow("SELECT * FROM assets WHERE asset_id = $1", asset_id)
            if not asset:
                raise HTTPException(status_code=404, detail="Media tidak ditemukan")
            project = await owned_project(conn, user, asset["project_id"])
            await conn.execute("SELECT pg_advisory_xact_lock(hashtext($1))", "revisions:" + project["project_id"])
            from datetime import datetime, timezone
            import math
            expiry = await conn.fetchval("SELECT expires_at FROM memberships WHERE user_id=$1", user["user_id"])
            is_pro = bool(expiry and expiry > datetime.now(timezone.utc))
            x, y, seconds = input.annotation_x, input.annotation_y, input.video_seconds
            if (x is None) != (y is None) or (x is not None and (not math.isfinite(x) or not math.isfinite(y) or not 0 <= x <= 1 or not 0 <= y <= 1)):
                raise HTTPException(status_code=400, detail="Posisi anotasi tidak valid.")
            if seconds is not None and (not math.isfinite(seconds) or seconds < 0):
                raise HTTPException(status_code=400, detail="Waktu video tidak valid.")
            if (x is not None or seconds is not None) and not is_pro:
                raise HTTPException(status_code=403, detail="Anotasi dan komentar bertimestamp tersedia untuk Pro.")
            if (x is not None and asset["media_type"] == "video") or (seconds is not None and asset["media_type"] != "video"):
                raise HTTPException(status_code=400, detail="Jenis anotasi tidak sesuai dengan media.")
            if not input.request_text.strip():
                raise HTTPException(status_code=400, detail="Catatan revisi harus diisi.")
            if asset["media_type"] != "video":
                existing = await conn.fetchval(
                    "SELECT EXISTS(SELECT 1 FROM revision_requests WHERE project_id=$1 AND asset_id=$2)",
                    project["project_id"], asset_id,
                )
                if not existing:
                    default_limit = 100 if is_pro else 25
                    limit = project.get("revision_limit") or default_limit
                    used = await conn.fetchval(
                        "SELECT COUNT(DISTINCT r.asset_id) FROM revision_requests r JOIN assets a ON a.asset_id=r.asset_id "
                        "WHERE r.project_id=$1 AND COALESCE(a.media_type,'photo') != 'video'", project["project_id"],
                    )
                    if used >= limit:
                        raise HTTPException(status_code=400, detail=f"Batas revisi tercapai ({limit} foto unik untuk proyek ini).")
            revision_id = new_id("rev")
            rev = {
                "revision_id": revision_id, "asset_id": asset_id, "project_id": project["project_id"],
                "requested_by": user["user_id"], "request_text": input.request_text,
                "status": "open", "created_at": now_iso(), "resolved_at": None,
                "annotation_x": x, "annotation_y": y, "video_seconds": seconds,
            }
            await conn.execute(
                """
                INSERT INTO revision_requests
                    (revision_id, asset_id, project_id, requested_by, request_text, status, created_at, resolved_at, annotation_x, annotation_y, video_seconds)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8, $9, $10)
                """, rev["revision_id"], rev["asset_id"], rev["project_id"], rev["requested_by"],
                rev["request_text"], rev["status"], rev["created_at"], x, y, seconds,
            )
            await conn.execute("UPDATE assets SET status = 'revision_requested' WHERE asset_id = $1", asset_id)
            await conn.execute("UPDATE projects SET status = 'revision_requested' WHERE project_id = $1", project["project_id"])
            await notify_admins(conn, "revision_requested", "Permintaan revisi baru",
                                f"{user['name']} meminta revisi pada '{asset['title']}' (proyek {project['title']}).", "/admin/revisions")
            await log_activity(conn, user["user_id"], user["name"], project["project_id"], "revision_requested", {"asset": asset["title"]})
    return {"ok": True, "revision": rev}


@router.get("/projects/{project_id}/revisions")
async def project_revisions(project_id: str, request: Request):
    user = await get_current_user(request)
    async with get_conn() as conn:
        await owned_project(conn, user, project_id)
        rev_rows = await conn.fetch(
            "SELECT * FROM revision_requests WHERE project_id = $1 ORDER BY created_at DESC LIMIT 200", project_id
        )
        out = []
        for r in rows(rev_rows):
            comment_rows = await conn.fetch(
                "SELECT * FROM revision_comments WHERE revision_id = $1 ORDER BY created_at ASC LIMIT 100",
                r["revision_id"],
            )
            asset = await conn.fetchrow("SELECT * FROM assets WHERE asset_id = $1", r["asset_id"])
            out.append({**r, "comments": rows(comment_rows), "asset": row(asset)})
    return {"revisions": out}


class CommentIn(BaseModel):
    body: str


@router.post("/revisions/{revision_id}/comments")
async def add_comment(revision_id: str, input: CommentIn, request: Request):
    user = await get_current_user(request)
    async with get_conn() as conn:
        rev = await conn.fetchrow("SELECT * FROM revision_requests WHERE revision_id = $1", revision_id)
        if not rev:
            raise HTTPException(status_code=404, detail="Revisi tidak ditemukan")
        await owned_project(conn, user, rev["project_id"])
        await conn.execute(
            """
            INSERT INTO revision_comments
                (comment_id, revision_id, author_id, author_name, author_role, body, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            """,
            new_id("cmt"), revision_id, user["user_id"], user["name"], user["role"], input.body, now_iso(),
        )
    return {"ok": True}


@router.post("/revisions/{revision_id}/approve")
async def approve_revision(revision_id: str, request: Request):
    user = await get_current_user(request)
    async with get_conn() as conn:
        rev = await conn.fetchrow("SELECT * FROM revision_requests WHERE revision_id = $1", revision_id)
        if not rev:
            raise HTTPException(status_code=404, detail="Revisi tidak ditemukan")
        project = await owned_project(conn, user, rev["project_id"])
        await conn.execute(
            "UPDATE revision_requests SET status = 'resolved', resolved_at = $1 WHERE revision_id = $2",
            now_iso(), revision_id,
        )
        await conn.execute("UPDATE assets SET status = 'approved' WHERE asset_id = $1", rev["asset_id"])
        await notify_admins(conn, "revision_approved", "Revisi disetujui",
                            f"{user['name']} menyetujui hasil revisi untuk '{rev['request_text'][:50]}'.",
                            f"/admin/projects/{project['project_id']}")
        await log_activity(conn, user["user_id"], user["name"], project["project_id"], "revision_approved", {})
    return {"ok": True}


@router.post("/projects/{project_id}/approve-delivery")
async def approve_delivery(project_id: str, request: Request):
    user = await get_current_user(request)
    async with get_conn() as conn:
        project = await owned_project(conn, user, project_id)
        if project["status"] != "final_delivered":
            raise HTTPException(status_code=400, detail="Belum ada hasil akhir untuk disetujui")
        await conn.execute("UPDATE projects SET status = 'completed' WHERE project_id = $1", project_id)
        await notify_admins(conn, "project_completed", "Proyek selesai",
                            f"{user['name']} menyetujui hasil akhir proyek {project['title']}.",
                            f"/admin/projects/{project_id}")
        await log_activity(conn, user["user_id"], user["name"], project_id, "delivery_approved", {})
    return {"ok": True}


@router.get("/notifications")
async def notifications(request: Request):
    user = await get_current_user(request)
    async with get_conn() as conn:
        notif_rows = await conn.fetch(
            "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100", user["user_id"]
        )
    return {"notifications": rows(notif_rows)}


@router.post("/notifications/{notification_id}/read")
async def read_notification(notification_id: str, request: Request):
    user = await get_current_user(request)
    async with get_conn() as conn:
        await conn.execute(
            "UPDATE notifications SET read_at = $1 WHERE notification_id = $2 AND user_id = $3",
            now_iso(), notification_id, user["user_id"],
        )
    return {"ok": True}


@router.post("/notifications/read-all")
async def read_all_notifications(request: Request):
    user = await get_current_user(request)
    async with get_conn() as conn:
        await conn.execute(
            "UPDATE notifications SET read_at = $1 WHERE user_id = $2 AND read_at IS NULL",
            now_iso(), user["user_id"],
        )
    return {"ok": True}


class BookingIn(BaseModel):
    service_type: str
    requested_date: str = ""
    requested_time: str = ""
    location: str = ""
    notes: str = ""
    request_id: str | None = None


@router.post("/bookings")
async def create_booking(input: BookingIn, request: Request):
    user = await get_current_user(request)
    session_id = new_id("ses")
    async with get_conn() as conn:
        async with conn.transaction():
            if input.request_id:
                await conn.execute("SELECT pg_advisory_xact_lock(hashtext($1))", "booking:" + input.request_id)
                previous = await conn.fetchrow("SELECT session_id, user_id FROM booking_sessions WHERE request_id=$1", input.request_id)
                if previous:
                    if previous["user_id"] != user["user_id"]:
                        raise HTTPException(status_code=409, detail="Permintaan booking tidak valid.")
                    return {"ok": True, "session_id": previous["session_id"]}
            await conn.execute(
                """
                INSERT INTO booking_sessions
                    (session_id, user_id, name, email, phone, service_type,
                     requested_date, requested_time, location, notes, status, proposed_date, created_at, request_id)
                VALUES ($1, $2, $3, $4, '', $5, $6, $7, $8, $9, 'pending', NULL, $10, $11)
                """,
                session_id, user["user_id"], user["name"], user["email"], input.service_type,
                input.requested_date, input.requested_time, input.location, input.notes, now_iso(), input.request_id,
            )
            await notify_admins(conn, "session_request", "Permintaan sesi baru",
                                f"{user['name']} mengajukan sesi {input.service_type} pada {input.requested_date or '-' }.",
                                "/admin/sessions")
    return {"ok": True, "session_id": session_id}


@router.get("/bookings")
async def my_bookings(request: Request):
    user = await get_current_user(request)
    async with get_conn() as conn:
        booking_rows = await conn.fetch(
            "SELECT * FROM booking_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50", user["user_id"]
        )
    return {"bookings": rows(booking_rows)}
