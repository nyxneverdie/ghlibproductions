"""SQL schema (PostgreSQL / Neon) and table creation.

Mirrors the previous MongoDB collections as flat tables. `settings` and
`activity_logs.metadata` use JSONB for their nested/variable fields.
"""
from database import get_conn

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    user_id     TEXT PRIMARY KEY,
    email       TEXT UNIQUE NOT NULL,
    name        TEXT DEFAULT '',
    picture     TEXT DEFAULT '',
    role        TEXT DEFAULT 'client',
    created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_sessions (
    session_token TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    expires_at    TEXT NOT NULL,
    created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memberships (
    user_id TEXT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS membership_payments (
    payment_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    amount INTEGER NOT NULL DEFAULT 30000,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    proof BYTEA NOT NULL,
    proof_type TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT REFERENCES users(user_id),
    rejection_reason TEXT,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS membership_one_pending_per_user
    ON membership_payments(user_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS membership_payments_submitted_idx ON membership_payments(submitted_at DESC);

CREATE TABLE IF NOT EXISTS clients (
    client_id  TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT UNIQUE NOT NULL,
    phone      TEXT DEFAULT '',
    notes      TEXT DEFAULT '',
    user_id    TEXT REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
    project_id              TEXT PRIMARY KEY,
    title                   TEXT NOT NULL,
    client_id               TEXT NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
    project_type            TEXT DEFAULT 'portrait',
    description             TEXT DEFAULT '',
    selection_limit         INTEGER DEFAULT 0,
    shoot_date              TEXT DEFAULT '',
    due_date                TEXT DEFAULT '',
    status                  TEXT DEFAULT 'inquiry',
    selections_submitted_at TEXT,
    created_at              TEXT NOT NULL,
    updated_at              TEXT NOT NULL
);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS revision_limit INTEGER;

CREATE TABLE IF NOT EXISTS assets (
    asset_id            TEXT PRIMARY KEY,
    project_id          TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    title               TEXT NOT NULL,
    original_filename   TEXT DEFAULT '',
    mime_type           TEXT DEFAULT 'image/jpeg',
    media_type          TEXT DEFAULT 'photo',
    stage               TEXT DEFAULT 'proofing',
    status              TEXT DEFAULT 'uploaded',
    url                 TEXT NOT NULL,
    version             INTEGER DEFAULT 1,
    sort_order          INTEGER DEFAULT 0,
    created_at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS asset_versions (
    version_id    TEXT PRIMARY KEY,
    asset_id      TEXT NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    url           TEXT NOT NULL,
    uploaded_by   TEXT DEFAULT '',
    version_notes TEXT DEFAULT '',
    created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS photo_selections (
    selection_id TEXT PRIMARY KEY,
    project_id   TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    asset_id     TEXT NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
    client_id    TEXT NOT NULL,
    note         TEXT DEFAULT '',
    selected_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS revision_requests (
    revision_id   TEXT PRIMARY KEY,
    asset_id      TEXT NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
    project_id    TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    requested_by  TEXT,
    request_text  TEXT NOT NULL,
    status        TEXT DEFAULT 'open',
    created_at    TEXT NOT NULL,
    resolved_at   TEXT
);

ALTER TABLE revision_requests ADD COLUMN IF NOT EXISTS annotation_x DOUBLE PRECISION;
ALTER TABLE revision_requests ADD COLUMN IF NOT EXISTS annotation_y DOUBLE PRECISION;
ALTER TABLE revision_requests ADD COLUMN IF NOT EXISTS video_seconds DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS revision_comments (
    comment_id  TEXT PRIMARY KEY,
    revision_id TEXT NOT NULL REFERENCES revision_requests(revision_id) ON DELETE CASCADE,
    author_id   TEXT DEFAULT '',
    author_name TEXT DEFAULT '',
    author_role TEXT DEFAULT '',
    body        TEXT NOT NULL,
    created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS booking_sessions (
    session_id     TEXT PRIMARY KEY,
    user_id        TEXT,
    name           TEXT DEFAULT '',
    email          TEXT DEFAULT '',
    phone          TEXT DEFAULT '',
    service_type   TEXT NOT NULL,
    requested_date TEXT DEFAULT '',
    requested_time TEXT DEFAULT '',
    location       TEXT DEFAULT '',
    notes          TEXT DEFAULT '',
    status         TEXT DEFAULT 'pending',
    proposed_date  TEXT,
    created_at     TEXT NOT NULL
);

ALTER TABLE booking_sessions ADD COLUMN IF NOT EXISTS request_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS booking_request_id_unique ON booking_sessions(request_id) WHERE request_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS notifications (
    notification_id TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL,
    type            TEXT NOT NULL,
    title           TEXT NOT NULL,
    body            TEXT NOT NULL,
    target_url      TEXT DEFAULT '',
    read_at         TEXT,
    created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_logs (
    log_id     TEXT PRIMARY KEY,
    actor_id   TEXT DEFAULT '',
    actor_name TEXT DEFAULT '',
    project_id TEXT,
    action     TEXT NOT NULL,
    metadata   JSONB DEFAULT '{}',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS portfolio_items (
    item_id    TEXT PRIMARY KEY,
    title      TEXT NOT NULL,
    category   TEXT NOT NULL,
    url        TEXT NOT NULL,
    media_type TEXT DEFAULT 'photo',
    featured   BOOLEAN DEFAULT FALSE,
    visible    BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    key  TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'
);
"""


async def create_tables():
    """Create all tables if they don't exist. Safe to call on every cold start."""
    async with get_conn() as conn:
        await conn.execute(SCHEMA_SQL)
