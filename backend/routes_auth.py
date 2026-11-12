from fastapi import APIRouter, Request
from auth_core import get_current_user

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("/me")
async def auth_me(request: Request):
    user = await get_current_user(request)
    return {k: user.get(k) for k in ("user_id", "email", "name", "picture", "role")}
