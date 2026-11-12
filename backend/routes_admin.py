import json

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from database import get_conn, row, rows
from auth_core import get_current_user, get_admin_user
from helpers import new_id, now_iso, notify, log_activity

router = APIRouter(prefix="/api/admin", tags=["admin"])


async def guard(request: Request):
    user = await get_current_user(request)
    return await get_admin_user(user)


# ---------- stats ----------

@router.get("/stats")
async def stats(request: Request):
    user = await guard(request)
    async with get_conn() as conn:
        clients = await conn.fetchval("SELECT COUNT(*) FROM clients")
        active_projects = await conn.fetchval(
            "SELECT COUNT(*) FROM projects WHERE status NOT IN ('completed', 'archived')"
        )
        completed = await conn.fetchval("SELECT COUNT(*) FROM projects WHERE status = 'completed'")
        pending_sessions = await conn.fetchval("SELECT COUNT(*) FROM booking_sessions WHERE status = 'pending'")
        awaiting_selection = await conn.fetchval("SELECT COUNT(*) FROM projects WHERE status = 'proofing'")
        open_revisions = await conn.fetchval(
            "SELECT COUNT(*) FROM revision_requests WHERE status IN ('open', 'in_progress')"
        )
        awaiting_approval = await conn.fetchval("SELECT COUNT(*) FROM projects WHERE status = 'final_delivered'")
        log_rows = await conn.fetch(
            "SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 12"
        )
        recent_logs = []
        for r in log_rows:
            d = row(r)
            md = d.get("metadata")
            if isinstance(md, str):
                d["metadata"] = json.loads(md)
            recent_logs.append(d)
    return {
        "total_clients": clients,
        "active_projects": active_projects,
        "completed_projects": completed,
        "pending_sessions": pending_sessions,
        "galleries_awaiting_selection": awaiting_selection,
        "open_revisions": open_revisions,
        "deliverables_awaiting_approval": awaiting_approval,
        "recent_activity": recent_logs,
    }


# ---------- clients ----------

class ClientIn(BaseModel):
    name: str
    email: str
    phone: str = ""
    notes: str = ""


@router.get("/clients")
async def list_clients(request: Request):
    await guard(request)
    async with get_conn() as conn:
        client_rows = await conn.fetch("SELECT * FROM clients ORDER BY created_at DESC LIMIT 500")
        out = []
        for c in rows(client_rows):
            c["project_count"] = await conn.fetchval(
                "SELECT COUNT(*) FROM projects WHERE client_id = $1", c["client_id"]
            )
            linked = None
            if c.get("user_id"):
                linked = await conn.fetchrow("SELECT user_id FROM users WHERE user_id = $1", c["user_id"])
            c["registered"] = bool(c.get("user_id") and linked)
            out.append(c)
    return {"clients": out}


@router.post("/clients")
async def create_client(input: ClientIn, request: Request):
    user = await guard(request)
    async with get_conn() as conn:
        existing = await conn.fetchrow("SELECT client_id FROM clients WHERE email = $1", input.email)
        if existing:
            raise HTTPException(status_code=400, detail="Klien dengan email ini sudah ada")
        client_id = new_id("cli")
        linked = await conn.fetchrow("SELECT user_id FROM users WHERE email = $1", input.email)
        user_id = linked["user_id"] if linked else None
        await conn.execute(
            """
            INSERT INTO clients (client_id, name, email, phone, notes, user_id, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            """,
            client_id, input.name, input.email, input.phone, input.notes, user_id, now_iso(),
        )
        await log_activity(conn, user["user_id"], user["name"], None, "client_created", {"client": input.name})
        doc = {
            "client_id": client_id, "name": input.name, "email": input.email,
            "phone": input.phone, "notes": input.notes, "user_id": user_id, "created_at": now_iso(),
        }
    return {"client": doc}


# ---------- projects ----------

class ProjectIn(BaseModel):
    title: str
    client_id: str
    project_type: str = "portrait"
    description: str = ""
    selection_limit: int = 0
    shoot_date: str = ""
    due_date: str = ""


@router.get("/projects")
async def list_projects(request: Request):
    await guard(request)
    async with get_conn() as conn:
        project_rows = await conn.fetch("SELECT * FROM projects ORDER BY created_at DESC LIMIT 500")
        out = []
        for p in rows(project_rows):
            client = await conn.fetchrow("SELECT name FROM clients WHERE client_id = $1", p["client_id"])
            p["client_name"] = (client or {}).get("name", "-")
            p["asset_count"] = await conn.fetchval(
                "SELECT COUNT(*) FROM assets WHERE project_id = $1", p["project_id"]
            )
            out.append(p)
    return {"projects": out}


@router.post("/projects")
async def create_project(input: ProjectIn, request: Request):
    user = await guard(request)
    async with get_conn() as conn:
        client = await conn.fetchrow("SELECT client_id FROM clients WHERE client_id = $1", input.client_id)
        if not client:
            raise HTTPException(status_code=404, detail="Klien tidak ditemukan")
        project_id = new_id("prj")
        ts = now_iso()
        await conn.execute(
            """
            INSERT INTO projects
                (project_id, title, client_id, project_type, description, selection_limit,
                 shoot_date, due_date, status, selections_submitted_at, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'inquiry', NULL, $9, $9)
            """,
            project_id, input.title, input.client_id, input.project_type, input.description,
            input.selection_limit, input.shoot_date, input.due_date, ts,
        )
        await log_activity(conn, user["user_id"], user["name"], project_id, "project_created", {"title": input.title})
        doc = {
            "project_id": project_id, "title": input.title, "client_id": input.client_id,
            "project_type": input.project_type, "description": input.description,
            "selection_limit": input.selection_limit, "shoot_date": input.shoot_date,
            "due_date": input.due_date, "status": "inquiry", "selections_submitted_at": None,
            "created_at": ts, "updated_at": ts,
        }
    return {"project": doc}


@router.get("/projects/{project_id}")
async def project_detail(project_id: str, request: Request):
    await guard(request)
    async with get_conn() as conn:
        project = await conn.fetchrow("SELECT * FROM projects WHERE project_id = $1", project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Proyek tidak ditemukan")
        client = await conn.fetchrow("SELECT * FROM clients WHERE client_id = $1", project["client_id"])
        asset_rows = await conn.fetch(
            "SELECT * FROM assets WHERE project_id = $1 ORDER BY sort_order ASC LIMIT 1000", project_id
        )
    return {"project": row(project), "client": row(client), "assets": rows(asset_rows)}


@router.patch("/projects/{project_id}")
async def update_project(project_id: str, request: Request):
    await guard(request)
    body = await request.json()
    allowed = {"title", "description", "status", "selection_limit", "revision_limit", "shoot_date", "due_date", "project_type"}
    updates = {k: v for k, v in body.items() if k in allowed}
    if "revision_limit" in updates and updates["revision_limit"] is not None:
        if isinstance(updates["revision_limit"], bool) or not isinstance(updates["revision_limit"], int) or updates["revision_limit"] < 1:
            raise HTTPException(status_code=400, detail="Batas revisi harus berupa bilangan positif atau kosong.")
    async with get_conn() as conn:
        if updates:
            set_clauses = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates.keys()))
            params = [now_iso()] + list(updates.values())
            await conn.execute(
                f"UPDATE projects SET {set_clauses}, updated_at = $1 WHERE project_id = ${len(updates)+2}",
                *params, project_id,
            )
        project = await conn.fetchrow("SELECT * FROM projects WHERE project_id = $1", project_id)
    return {"project": row(project)}


# ---------- assets / media manager ----------

@router.get("/projects/{project_id}/assets")
async def admin_project_assets(project_id: str, request: Request):
    await guard(request)
    async with get_conn() as conn:
        asset_rows = await conn.fetch(
            "SELECT * FROM assets WHERE project_id = $1 ORDER BY sort_order ASC LIMIT 1000", project_id
        )
    return {"assets": rows(asset_rows)}


@router.get("/projects/{project_id}/selections")
async def admin_project_selections(project_id: str, request: Request):
    await guard(request)
    async with get_conn() as conn:
        sel_rows = await conn.fetch(
            "SELECT * FROM photo_selections WHERE project_id = $1 ORDER BY selected_at ASC LIMIT 1000", project_id
        )
        out = []
        for s in rows(sel_rows):
            asset = await conn.fetchrow("SELECT * FROM assets WHERE asset_id = $1", s["asset_id"])
            out.append({**s, "asset": row(asset)})
    return {"selections": out}


class AssetIn(BaseModel):
    title: str
    url: str
    media_type: str = "photo"
    stage: str = "proofing"


@router.post("/projects/{project_id}/assets")
async def add_assets(project_id: str, input: AssetIn, request: Request):
    user = await guard(request)
    async with get_conn() as conn:
        project = await conn.fetchrow("SELECT project_id FROM projects WHERE project_id = $1", project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Proyek tidak ditemukan")
        order = await conn.fetchval("SELECT COUNT(*) FROM assets WHERE project_id = $1", project_id)
        asset_id = new_id("ast")
        mime = "video/mp4" if input.media_type == "video" else "image/jpeg"
        await conn.execute(
            """
            INSERT INTO assets
                (asset_id, project_id, title, original_filename, mime_type, media_type,
                 stage, status, url, version, sort_order, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'uploaded', $8, 1, $9, $10)
            """,
            asset_id, project_id, input.title, input.title, mime, input.media_type,
            input.stage, input.url, order, now_iso(),
        )
        await log_activity(conn, user["user_id"], user["name"], project_id, "media_added", {"title": input.title})
        doc = {
            "asset_id": asset_id, "project_id": project_id, "title": input.title,
            "original_filename": input.title, "mime_type": mime, "media_type": input.media_type,
            "stage": input.stage, "status": "uploaded", "url": input.url, "version": 1,
            "order": order, "created_at": now_iso(),
        }
    return {"asset": doc}


@router.patch("/assets/{asset_id}")
async def update_asset(asset_id: str, request: Request):
    user = await guard(request)
    body = await request.json()
    allowed = {"title", "stage", "status", "order", "url"}
    # Map incoming "order" back to the DB column sort_order
    if "order" in body:
        body["sort_order"] = body.pop("order")
    allowed.add("sort_order")
    updates = {k: v for k, v in body.items() if k in allowed}
    async with get_conn() as conn:
        if updates:
            set_clauses = ", ".join(f"{k} = ${i+1}" for i, k in enumerate(updates.keys()))
            params = list(updates.values())
            await conn.execute(
                f"UPDATE assets SET {set_clauses} WHERE asset_id = ${len(updates)+1}",
                *params, asset_id,
            )
        asset = await conn.fetchrow("SELECT * FROM assets WHERE asset_id = $1", asset_id)
        if "sort_order" in updates and asset:
            await log_activity(conn, user["user_id"], user["name"], asset["project_id"], "media_reordered", {})
    return {"asset": row(asset)}


@router.delete("/assets/{asset_id}")
async def delete_asset(asset_id: str, request: Request):
    await guard(request)
    async with get_conn() as conn:
        await conn.execute("DELETE FROM photo_selections WHERE asset_id = $1", asset_id)
        await conn.execute("DELETE FROM revision_requests WHERE asset_id = $1", asset_id)
        await conn.execute("DELETE FROM assets WHERE asset_id = $1", asset_id)
    return {"ok": True}


class PublishIn(BaseModel):
    stage: str


@router.post("/projects/{project_id}/publish")
async def publish_gallery(project_id: str, input: PublishIn, request: Request):
    user = await guard(request)
    async with get_conn() as conn:
        project = await conn.fetchrow("SELECT * FROM projects WHERE project_id = $1", project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Proyek tidak ditemukan")
        client = await conn.fetchrow("SELECT * FROM clients WHERE client_id = $1", project["client_id"])
        stage = input.stage
        count = await conn.fetchval(
            "SELECT COUNT(*) FROM assets WHERE project_id = $1 AND stage = $2", project_id, stage
        )
        if count == 0:
            raise HTTPException(status_code=400, detail="Tidak ada media pada tahap ini")

        if stage == "proofing":
            await conn.execute(
                "UPDATE assets SET status = 'proof_published' WHERE project_id = $1 AND stage = 'proofing'", project_id
            )
            await conn.execute(
                "UPDATE projects SET status = 'proofing', updated_at = $1 WHERE project_id = $2", now_iso(), project_id
            )
            title, url = "Galeri proofing tersedia", f"/dashboard/projects/{project_id}"
        else:
            await conn.execute(
                "UPDATE assets SET status = 'final_published' WHERE project_id = $1 AND stage = 'final'", project_id
            )
            await conn.execute(
                "UPDATE projects SET status = 'final_delivered', updated_at = $1 WHERE project_id = $2", now_iso(), project_id
            )
            title, url = "Hasil akhir tersedia", f"/dashboard/projects/{project_id}"

        if client and client.get("user_id"):
            ntype = "gallery_published" if stage == "proofing" else "final_published"
            await notify(conn, client["user_id"], ntype, title,
                         f"Proyek '{project['title']}' telah diperbarui dengan {count} media.", url)
        await log_activity(conn, user["user_id"], user["name"], project_id, f"published_{stage}", {"count": count})
    return {"ok": True, "count": count}


# ---------- revisions ----------

@router.get("/revisions")
async def revision_inbox(request: Request):
    await guard(request)
    async with get_conn() as conn:
        rev_rows = await conn.fetch(
            "SELECT * FROM revision_requests ORDER BY created_at DESC LIMIT 300"
        )
        out = []
        for r in rows(rev_rows):
            project = await conn.fetchrow("SELECT * FROM projects WHERE project_id = $1", r["project_id"])
            client = await conn.fetchrow(
                "SELECT * FROM clients WHERE client_id = $1", (project or {}).get("client_id")
            ) if project else None
            asset = await conn.fetchrow("SELECT * FROM assets WHERE asset_id = $1", r["asset_id"])
            comment_rows = await conn.fetch(
                "SELECT * FROM revision_comments WHERE revision_id = $1 ORDER BY created_at ASC LIMIT 100",
                r["revision_id"],
            )
            out.append({
                **r,
                "project_title": (project or {}).get("title", "-"),
                "client_name": (row(client) or {}).get("name", "-") if client else "-",
                "asset": row(asset),
                "comments": rows(comment_rows),
            })
    return {"revisions": out}


class RevisionPatch(BaseModel):
    status: str = None


class RevisionCommentIn(BaseModel):
    body: str


@router.post("/revisions/{revision_id}/comments")
async def admin_revision_comment(revision_id: str, input: RevisionCommentIn, request: Request):
    user = await guard(request)
    async with get_conn() as conn:
        rev = await conn.fetchrow("SELECT * FROM revision_requests WHERE revision_id = $1", revision_id)
        if not rev:
            raise HTTPException(status_code=404, detail="Revisi tidak ditemukan")
        await conn.execute(
            """
            INSERT INTO revision_comments
                (comment_id, revision_id, author_id, author_name, author_role, body, created_at)
            VALUES ($1, $2, $3, $4, 'admin', $5, $6)
            """,
            new_id("cmt"), revision_id, user["user_id"], user["name"], input.body, now_iso(),
        )
        if rev.get("requested_by"):
            await notify(conn, rev["requested_by"], "revision_reply", "Balasan revisi",
                         f"Studio membalas revisi Anda: {input.body[:80]}", f"/dashboard/projects/{rev['project_id']}")
    return {"ok": True}


@router.patch("/revisions/{revision_id}")
async def update_revision(revision_id: str, input: RevisionPatch, request: Request):
    user = await guard(request)
    async with get_conn() as conn:
        if input.status:
            resolved = now_iso() if input.status == "resolved" else None
            await conn.execute(
                "UPDATE revision_requests SET status = $1, resolved_at = $2 WHERE revision_id = $3",
                input.status, resolved, revision_id,
            )
        rev = await conn.fetchrow("SELECT * FROM revision_requests WHERE revision_id = $1", revision_id)
    return {"revision": row(rev)}


class VersionIn(BaseModel):
    url: str
    notes: str = ""


@router.post("/assets/{asset_id}/versions")
async def add_version(asset_id: str, input: VersionIn, request: Request):
    user = await guard(request)
    async with get_conn() as conn:
        asset = await conn.fetchrow("SELECT * FROM assets WHERE asset_id = $1", asset_id)
        if not asset:
            raise HTTPException(status_code=404, detail="Media tidak ditemukan")
        project = await conn.fetchrow("SELECT * FROM projects WHERE project_id = $1", asset["project_id"])
        client = await conn.fetchrow("SELECT * FROM clients WHERE client_id = $1", project["client_id"]) if project else None
        new_version = asset.get("version", 1) + 1
        await conn.execute(
            "INSERT INTO asset_versions (version_id,asset_id,version_number,url,uploaded_by,version_notes,created_at) "
            "SELECT $1,$2,$3,$4,$5,'Versi sebelumnya',$6 WHERE NOT EXISTS "
            "(SELECT 1 FROM asset_versions WHERE asset_id=$2 AND version_number=$3)",
            new_id("ver"), asset_id, asset.get("version", 1), asset["url"], user["name"], now_iso(),
        )
        await conn.execute(
            """
            INSERT INTO asset_versions
                (version_id, asset_id, version_number, url, uploaded_by, version_notes, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            """,
            new_id("ver"), asset_id, new_version, input.url, user["name"], input.notes, now_iso(),
        )
        await conn.execute(
            "UPDATE assets SET url = $1, version = $2, status = 'review_pending' WHERE asset_id = $3",
            input.url, new_version, asset_id,
        )
        await conn.execute(
            "UPDATE projects SET status = 'client_review' WHERE project_id = $1", asset["project_id"]
        )
        # Mark related open revisions as in_progress
        await conn.execute(
            "UPDATE revision_requests SET status = 'in_progress' WHERE asset_id = $1 AND status IN ('open', 'in_progress')",
            asset_id,
        )
        if client and client.get("user_id"):
            await notify(conn, client["user_id"], "new_version", "Versi baru tersedia",
                         f"Versi {new_version} untuk '{asset['title']}' siap ditinjau.",
                         f"/dashboard/projects/{asset['project_id']}")
        await log_activity(conn, user["user_id"], user["name"], asset["project_id"], "new_version",
                           {"asset": asset["title"], "version": new_version})
    return {"ok": True, "version": new_version}


# ---------- sessions ----------

@router.get("/sessions")
async def list_sessions(request: Request):
    await guard(request)
    async with get_conn() as conn:
        session_rows = await conn.fetch(
            "SELECT * FROM booking_sessions ORDER BY created_at DESC LIMIT 300"
        )
    return {"sessions": rows(session_rows)}


class SessionPatch(BaseModel):
    status: str
    proposed_date: str = ""


@router.patch("/sessions/{session_id}")
async def update_session(session_id: str, input: SessionPatch, request: Request):
    user = await guard(request)
    async with get_conn() as conn:
        if input.proposed_date:
            await conn.execute(
                "UPDATE booking_sessions SET status = $1, proposed_date = $2, requested_date = $2 WHERE session_id = $3",
                input.status, input.proposed_date, session_id,
            )
        else:
            await conn.execute(
                "UPDATE booking_sessions SET status = $1 WHERE session_id = $2", input.status, session_id
            )
        sess = await conn.fetchrow("SELECT * FROM booking_sessions WHERE session_id = $1", session_id)
        if sess and sess.get("user_id"):
            status_msg = {"approved": "disetujui", "rejected": "ditolak",
                          "rescheduled": "dijadwalkan ulang", "pending": "menunggu"}
            await notify(conn, sess["user_id"], "session_update", "Status sesi diperbarui",
                         f"Sesi {sess['service_type']} Anda pada {sess.get('requested_date', '-')} {status_msg.get(input.status, input.status)}.",
                         "/dashboard")
    return {"session": row(sess)}


@router.post("/sessions/{session_id}/convert")
async def convert_session(session_id: str, request: Request):
    user = await guard(request)
    async with get_conn() as conn:
        sess = await conn.fetchrow("SELECT * FROM booking_sessions WHERE session_id = $1", session_id)
        if not sess:
            raise HTTPException(status_code=404, detail="Sesi tidak ditemukan")
        client = await conn.fetchrow("SELECT * FROM clients WHERE email = $1", sess.get("email") or "")
        if not client:
            client_id = new_id("cli")
            await conn.execute(
                """
                INSERT INTO clients (client_id, name, email, phone, notes, user_id, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                """,
                client_id, sess.get("name", "Klien"), sess.get("email", ""),
                sess.get("phone", ""), "Dibuat dari permintaan sesi", sess.get("user_id"), now_iso(),
            )
            client = {"client_id": client_id}
        project_id = new_id("prj")
        ts = now_iso()
        await conn.execute(
            """
            INSERT INTO projects
                (project_id, title, client_id, project_type, description, status, selection_limit,
                 shoot_date, due_date, selections_submitted_at, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, 'scheduled', 0, $6, '', NULL, $7, $7)
            """,
            project_id, f"Sesi {sess['service_type']} - {sess['name']}", client["client_id"],
            sess["service_type"], sess.get("notes", ""), sess.get("requested_date", ""), ts,
        )
        await conn.execute(
            "UPDATE booking_sessions SET status = 'approved' WHERE session_id = $1", session_id
        )
        await log_activity(conn, user["user_id"], user["name"], project_id, "session_converted", {"session": session_id})
        project_doc = {
            "project_id": project_id, "title": f"Sesi {sess['service_type']} - {sess['name']}",
            "client_id": client["client_id"], "project_type": sess["service_type"],
            "description": sess.get("notes", ""), "status": "scheduled", "selection_limit": 0,
            "shoot_date": sess.get("requested_date", ""), "due_date": "",
            "selections_submitted_at": None, "created_at": ts, "updated_at": ts,
        }
    return {"project": project_doc}


# ---------- portfolio ----------

class PortfolioIn(BaseModel):
    title: str
    category: str
    url: str
    media_type: str = "photo"


@router.get("/portfolio")
async def list_portfolio(request: Request):
    await guard(request)
    async with get_conn() as conn:
        item_rows = await conn.fetch("SELECT * FROM portfolio_items ORDER BY sort_order ASC LIMIT 200")
    return {"items": rows(item_rows)}


@router.post("/portfolio")
async def add_portfolio(input: PortfolioIn, request: Request):
    await guard(request)
    async with get_conn() as conn:
        order = await conn.fetchval("SELECT COUNT(*) FROM portfolio_items")
        item_id = new_id("pf")
        await conn.execute(
            """
            INSERT INTO portfolio_items
                (item_id, title, category, url, media_type, featured, visible, sort_order, created_at)
            VALUES ($1, $2, $3, $4, $5, FALSE, TRUE, $6, $7)
            """,
            item_id, input.title, input.category, input.url, input.media_type, order, now_iso(),
        )
        doc = {
            "item_id": item_id, "title": input.title, "category": input.category,
            "url": input.url, "media_type": input.media_type, "featured": False,
            "visible": True, "order": order, "created_at": now_iso(),
        }
    return {"item": doc}


@router.patch("/portfolio/{item_id}")
async def update_portfolio(item_id: str, request: Request):
    await guard(request)
    body = await request.json()
    allowed = {"title", "category", "url", "featured", "visible", "order"}
    if "order" in body:
        body["sort_order"] = body.pop("order")
    allowed.add("sort_order")
    updates = {k: v for k, v in body.items() if k in allowed}
    async with get_conn() as conn:
        if updates:
            set_clauses = ", ".join(f"{k} = ${i+1}" for i, k in enumerate(updates.keys()))
            params = list(updates.values())
            await conn.execute(
                f"UPDATE portfolio_items SET {set_clauses} WHERE item_id = ${len(updates)+1}",
                *params, item_id,
            )
        item = await conn.fetchrow("SELECT * FROM portfolio_items WHERE item_id = $1", item_id)
    return {"item": row(item)}


@router.delete("/portfolio/{item_id}")
async def delete_portfolio(item_id: str, request: Request):
    await guard(request)
    async with get_conn() as conn:
        await conn.execute("DELETE FROM portfolio_items WHERE item_id = $1", item_id)
    return {"ok": True}


# ---------- settings ----------

@router.get("/settings")
async def get_settings(request: Request):
    await guard(request)
    async with get_conn() as conn:
        settings_row = await conn.fetchrow("SELECT data FROM settings WHERE key = 'profile'")
    profile = {}
    if settings_row:
        d = settings_row["data"]
        profile = d if isinstance(d, dict) else json.loads(d)
        profile["key"] = "profile"
    return {"profile": profile}


class SettingsIn(BaseModel):
    studio_name: str = None
    tagline: str = None
    bio: str = None
    location: str = None
    email: str = None
    phone: str = None
    instagram: str = None
    youtube: str = None


@router.patch("/settings")
async def update_settings(input: SettingsIn, request: Request):
    await guard(request)
    updates = {k: v for k, v in input.model_dump().items() if v is not None}
    async with get_conn() as conn:
        settings_row = await conn.fetchrow("SELECT data FROM settings WHERE key = 'profile'")
        current = {}
        if settings_row:
            d = settings_row["data"]
            current = d if isinstance(d, dict) else json.loads(d)
        current.update(updates)
        await conn.execute(
            "INSERT INTO settings (key, data) VALUES ('profile', $1::jsonb) "
            "ON CONFLICT (key) DO UPDATE SET data = $1::jsonb",
            json.dumps(current),
        )
        profile = {**current, "key": "profile"}
    return {"profile": profile}


# ---------- activity ----------

@router.get("/activity")
async def activity(request: Request):
    await guard(request)
    async with get_conn() as conn:
        log_rows = await conn.fetch("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100")
    logs = []
    for r in log_rows:
        d = row(r)
        md = d.get("metadata")
        if isinstance(md, str):
            d["metadata"] = json.loads(md)
        logs.append(d)
    return {"logs": logs}


# ---------- sample media pool ----------

@router.get("/sample-media")
async def sample_media(request: Request):
    await guard(request)
    return {"samples": SAMPLE_MEDIA}


SAMPLE_MEDIA = [
    {"title": "Portrait - Veil Study", "url": "https://images.unsplash.com/photo-1762504013915-c1faf57f291b?crop=entropy&cs=srgb&fm=jpg&q=85", "media_type": "photo"},
    {"title": "Portrait - Emerald Room", "url": "https://images.unsplash.com/photo-1720022785516-9653ead7180c?crop=entropy&cs=srgb&fm=jpg&q=85", "media_type": "photo"},
    {"title": "Portrait - Shawl", "url": "https://images.unsplash.com/photo-1675726205553-4e348f24da2c?crop=entropy&cs=srgb&fm=jpg&q=85", "media_type": "photo"},
    {"title": "Portrait - Hallway Light", "url": "https://images.unsplash.com/photo-1769650795529-18ad9d78cd5a?crop=entropy&cs=srgb&fm=jpg&q=85", "media_type": "photo"},
    {"title": "Wedding - Bouquet Light", "url": "https://images.unsplash.com/photo-1519741497674-611481863552?crop=entropy&cs=srgb&fm=jpg&q=85", "media_type": "photo"},
    {"title": "Wedding - Golden Field", "url": "https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?crop=entropy&cs=srgb&fm=jpg&q=85", "media_type": "photo"},
    {"title": "Film - City Rain", "url": "https://images.unsplash.com/photo-1544259342-306eccfec481?crop=entropy&cs=srgb&fm=jpg&q=85", "media_type": "photo"},
    {"title": "Event - Crowd Confetti", "url": "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?crop=entropy&cs=srgb&fm=jpg&q=85", "media_type": "photo"},
    {"title": "Product - Halo Podium", "url": "https://images.unsplash.com/photo-1760860992203-85ca32536788?crop=entropy&cs=srgb&fm=jpg&q=85", "media_type": "photo"},
    {"title": "Graduation - Cap Toss", "url": "https://images.unsplash.com/photo-1639765766830-d829d2fe4219?crop=entropy&cs=srgb&fm=jpg&q=85", "media_type": "photo"},
]
