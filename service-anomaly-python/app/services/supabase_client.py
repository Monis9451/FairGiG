from supabase import Client, create_client

from app.core.config import settings

_supabase_client: Client | None = None


def get_supabase_client() -> Client:
    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured for anomaly service"
        )

    _supabase_client = create_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )
    return _supabase_client
