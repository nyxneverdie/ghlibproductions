"""Verify Better Auth sessions and map them to the application's users."""
import asyncio
import os

import requests
from fastapi import HTTPException, Request

from database import get_conn, row
from helpers import new_id, now_iso


async def get_current_user(request: Request) -> dict:
    # Forward only Better Auth's session cookie to a configured, trusted origin.
    cookies = {key: request.cookies[key] for key in (
        "better-auth.session_token", "__Secure-better-auth.session_token"
    ) if key in request.cookies}
    if not cookies:
        raise HTTPException(status_code=401, detail="Not authenticated")
    base_url = os.environ.get("BETTER_AUTH_URL", "").rstrip("/")
    if not base_url:
        raise HTTPException(status_code=503, detail="BETTER_AUTH_URL is not configured")
    try:
        result = await asyncio.to_thread(
            requests.get, f"{base_url}/api/auth/get-session", cookies=cookies,
            timeout=10, allow_redirects=False,
        )
        result.raise_for_status()
        session = result.json()
    except (requests.RequestException, ValueError):
        raise HTTPException(status_code=503, detail="Authentication service unavailable")
    identity = (session or {}).get("user") or {}
    email = (identity.get("email") or "").strip().lower()
    if not identity.get("id") or not email or not identity.get("emailVerified"):
        raise HTTPException(status_code=401, detail="Not authenticated")

    async with get_conn() as conn:
        async with conn.transaction():
            # Serialize first-time account creation across serverless instances.
            await conn.execute("SELECT pg_advisory_xact_lock(hashtext($1))", "ghlib-user-provisioning")
            existing = await conn.fetchrow("SELECT * FROM users WHERE lower(email) = $1", email)
            name = identity.get("name") or email
            picture = identity.get("image") or ""
            if existing:
                user = row(existing)
                await conn.execute("UPDATE users SET name = $1, picture = $2 WHERE user_id = $3", name, picture, user["user_id"])
                user.update(name=name, picture=picture)
            else:
                admins = {e.strip().lower() for e in os.environ.get("ADMIN_EMAILS", "").split(",") if e.strip()}
                role = "admin" if email in admins else "client"
                user = {"user_id": new_id("user"), "email": email, "name": name,
                        "picture": picture, "role": role, "created_at": now_iso()}
                await conn.execute(
                    "INSERT INTO users (user_id, email, name, picture, role, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
                    user["user_id"], email, name, picture, role, user["created_at"],
                )
            await conn.execute("UPDATE clients SET user_id = $1 WHERE lower(email) = $2 AND user_id IS NULL", user["user_id"], email)
            return user


async def get_admin_user(user: dict = None) -> dict:
    user = user or {}
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
