"""Login com Microsoft Entra ID (OpenID Connect, fluxo authorization code + PKCE via MSAL)."""
from functools import wraps
from urllib.parse import urlencode

import msal
from flask import Blueprint, abort, current_app, redirect, render_template, request, session, url_for

bp = Blueprint("auth", __name__, url_prefix="/auth")


def _msal_app():
    cfg = current_app.config
    return msal.ConfidentialClientApplication(
        cfg["ENTRA_CLIENT_ID"],
        authority=cfg["ENTRA_AUTHORITY"],
        client_credential=cfg["ENTRA_CLIENT_SECRET"],
    )


def current_user():
    return session.get("user")


def login_required(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        if not current_user():
            return redirect(url_for("auth.login", next=request.full_path.rstrip("?")))
        return view(*args, **kwargs)

    return wrapper


def _safe_next(target):
    # Só aceita caminhos relativos do próprio portal (evita open redirect).
    if target and target.startswith("/") and not target.startswith("//"):
        return target
    return url_for("portal.index")


@bp.route("/login")
def login():
    flow = _msal_app().initiate_auth_code_flow(
        current_app.config["ENTRA_SCOPES"],
        redirect_uri=current_app.config["ENTRA_REDIRECT_URI"],
    )
    session["auth_flow"] = flow
    session["next"] = _safe_next(request.args.get("next"))
    return redirect(flow["auth_uri"])


@bp.route("/callback")
def callback():
    flow = session.pop("auth_flow", None)
    if not flow:
        return redirect(url_for("auth.login"))

    result = _msal_app().acquire_token_by_auth_code_flow(flow, request.args.to_dict())
    if "error" in result:
        current_app.logger.warning("Falha no login Entra ID: %s", result.get("error_description"))
        return render_template("erro.html", mensagem=result.get("error_description", result["error"])), 401

    claims = result.get("id_token_claims", {})
    allowed = current_app.config["ENTRA_ALLOWED_GROUPS"]
    if allowed and not allowed.intersection(claims.get("groups", [])):
        abort(403)

    destino = _safe_next(session.get("next"))
    session.clear()  # nova sessão após autenticar (evita fixação de sessão)
    session["user"] = {
        "nome": claims.get("name"),
        "email": claims.get("preferred_username"),
        "oid": claims.get("oid"),
        "tid": claims.get("tid"),
    }
    return redirect(destino)


@bp.route("/logout")
def logout():
    session.clear()
    params = urlencode({"post_logout_redirect_uri": url_for("portal.index", _external=True)})
    return redirect(f"{current_app.config['ENTRA_AUTHORITY']}/oauth2/v2.0/logout?{params}")
