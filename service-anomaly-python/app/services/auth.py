from dataclasses import dataclass
from typing import Any
from uuid import UUID

from fastapi import Header, HTTPException

from app.services.supabase_client import get_supabase_client


@dataclass(slots=True)
class AuthContext:
    user_id: UUID
    email: str | None
    role: str


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization: Bearer <access_token>",
        )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(
            status_code=401,
            detail="Invalid Authorization header format. Expected: Bearer <access_token>",
        )

    return token.strip()


def _read_user_id(user: Any) -> str | None:
    if user is None:
        return None

    if isinstance(user, dict):
        return user.get("id")

    return getattr(user, "id", None)


def _read_user_email(user: Any) -> str | None:
    if user is None:
        return None

    if isinstance(user, dict):
        return user.get("email")

    return getattr(user, "email", None)


def _resolve_auth_user(token: str) -> tuple[str, str | None]:
    supabase = get_supabase_client()

    try:
        auth_response = supabase.auth.get_user(jwt=token)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    user = getattr(auth_response, "user", None)
    user_id = _read_user_id(user)

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired access token")

    return user_id, _read_user_email(user)


def _resolve_profile_role(user_id: str) -> str:
    supabase = get_supabase_client()

    response = (
        supabase.table("profiles")
        .select("id, role")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )

    profile_rows = response.data or []
    if len(profile_rows) == 0:
        raise HTTPException(
            status_code=403,
            detail="No profile found for this user",
        )

    role = profile_rows[0].get("role")
    if role not in {"worker", "verifier", "advocate", "analyst"}:
        raise HTTPException(status_code=403, detail="User role is not valid")

    return role


def get_auth_context(authorization: str | None = Header(default=None)) -> AuthContext:
    token = _extract_bearer_token(authorization)
    user_id, email = _resolve_auth_user(token)
    role = _resolve_profile_role(user_id)

    return AuthContext(
        user_id=UUID(user_id),
        email=email,
        role=role,
    )
