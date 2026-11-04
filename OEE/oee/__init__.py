from dotenv import load_dotenv
from flask import Flask

from .config import Config


def create_app(overrides=None):
    load_dotenv()
    app = Flask(__name__)
    cfg = Config()
    app.config.from_object(cfg)
    app.config["ENTRA_AUTHORITY"] = cfg.ENTRA_AUTHORITY
    if overrides:
        app.config.update(overrides)

    if not app.config["SECRET_KEY"]:
        raise RuntimeError("Defina SECRET_KEY no ambiente (veja .env.example).")

    from .auth import bp as auth_bp
    from .portal import bp as portal_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(portal_bp)
    return app
