import uuid
from datetime import datetime, timezone


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


async def notify(conn, user_id: str, ntype: str, title: str, body: str, target_url: str = ""):
    await conn.execute(
        """
        INSERT INTO notifications
            (notification_id, user_id, type, title, body, target_url, read_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NULL, $7)
        """,
        new_id("ntf"), user_id, ntype, title, body, target_url, now_iso(),
    )


async def notify_admins(conn, ntype: str, title: str, body: str, target_url: str = ""):
    admins = await conn.fetch("SELECT user_id FROM users WHERE role = 'admin'")
    for admin in admins:
        await notify(conn, admin["user_id"], ntype, title, body, target_url)


async def log_activity(conn, actor_id: str, actor_name: str, project_id, action: str, metadata: dict = None):
    import json
    await conn.execute(
        """
        INSERT INTO activity_logs
            (log_id, actor_id, actor_name, project_id, action, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
        """,
        new_id("log"), actor_id, actor_name, project_id, action,
        json.dumps(metadata or {}), now_iso(),
    )
