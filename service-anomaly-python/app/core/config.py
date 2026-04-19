from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "fairgig-anomaly"
    host: str = "0.0.0.0"
    port: int = 8001
    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_service_role_key: str | None = None
    database_url: str | None = None
    anomaly_zscore_threshold: float = 2.0
    anomaly_percent_drop_threshold: float = 20.0
    anomaly_deduction_zscore_threshold: float = 2.0
    anomaly_min_history_points: int = 7
    anomaly_history_days: int = 365
    anomaly_history_limit: int = 200
    anomaly_list_runs_max_limit: int = 100


settings = Settings()
