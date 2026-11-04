import os


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "")

    ENTRA_TENANT_ID = os.environ.get("ENTRA_TENANT_ID", "")
    ENTRA_CLIENT_ID = os.environ.get("ENTRA_CLIENT_ID", "")
    ENTRA_CLIENT_SECRET = os.environ.get("ENTRA_CLIENT_SECRET", "")
    ENTRA_REDIRECT_URI = os.environ.get("ENTRA_REDIRECT_URI", "http://localhost:5000/auth/callback")
    ENTRA_SCOPES = ["User.Read"]
    ENTRA_ALLOWED_GROUPS = {
        g.strip() for g in os.environ.get("ENTRA_ALLOWED_GROUPS", "").split(",") if g.strip()
    }

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.environ.get("ENTRA_REDIRECT_URI", "").startswith("https://")

    @property
    def ENTRA_AUTHORITY(self):
        return f"https://login.microsoftonline.com/{self.ENTRA_TENANT_ID}"
