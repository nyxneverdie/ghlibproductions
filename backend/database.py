import os
from contextlib import asynccontextmanager
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import asyncpg
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

_pool: asyncpg.Pool | None = None


async def _get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None or _pool._closed:
        dsn = os.environ["DATABASE_URL"]
        # Neon connection strings can include libpq-only channel_binding, which
        # asyncpg would otherwise send to PostgreSQL as an unknown setting.
        parts = urlsplit(dsn)
        query = urlencode([(key, value) for key, value in parse_qsl(parts.query, keep_blank_values=True) if key != "channel_binding"])
        dsn = urlunsplit((parts.scheme, parts.netloc, parts.path, query, parts.fragment))
        # Neon always requires SSL; asyncpg accepts the query param or explicit kwarg
        _pool = await asyncpg.create_pool(
            dsn,
            min_size=1,
            max_size=5,
            command_timeout=30,
            ssl="require",
        )
    return _pool


@asynccontextmanager
async def get_conn():
    """Async context manager that yields a pooled asyncpg connection."""
    pool = await _get_pool()
    async with pool.acquire() as conn:
        yield conn


def row(rec) -> dict | None:
    """Convert a single asyncpg Record to a plain dict (or None)."""
    if rec is None:
        return None
    d = dict(rec)
    # Rename sort_order → order for API compatibility
    if "sort_order" in d:
        d["order"] = d.pop("sort_order")
    return d


def rows(recs) -> list[dict]:
    """Convert a list of asyncpg Records to a list of dicts."""
    return [row(r) for r in recs]
