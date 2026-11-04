from unittest.mock import patch

import pytest

from oee import create_app


@pytest.fixture
def app():
    return create_app({"SECRET_KEY": "teste", "TESTING": True, "ENTRA_TENANT_ID": "tid",
                       "ENTRA_AUTHORITY": "https://login.microsoftonline.com/tid"})


@pytest.fixture
def client(app):
    return app.test_client()


def test_inicio_publico(client):
    r = client.get("/")
    assert r.status_code == 200
    assert "Entrar com Microsoft" in r.get_data(as_text=True)


def test_calculadora_exige_login(client):
    r = client.get("/calculadora")
    assert r.status_code == 302
    assert "/auth/login" in r.headers["Location"]


def test_login_redireciona_para_entra(client):
    fluxo = {"auth_uri": "https://login.microsoftonline.com/tid/oauth2/v2.0/authorize?x=1", "state": "s"}
    with patch("oee.auth._msal_app") as m:
        m.return_value.initiate_auth_code_flow.return_value = fluxo
        r = client.get("/auth/login?next=/calculadora")
    assert r.headers["Location"] == fluxo["auth_uri"]


def test_callback_cria_sessao_e_volta_ao_destino(client):
    with client.session_transaction() as s:
        s["auth_flow"] = {"state": "s"}
        s["next"] = "/calculadora"
    claims = {"name": "Fulano", "preferred_username": "fulano@empresa.com", "oid": "o", "tid": "t"}
    with patch("oee.auth._msal_app") as m:
        m.return_value.acquire_token_by_auth_code_flow.return_value = {"id_token_claims": claims}
        r = client.get("/auth/callback?code=c&state=s")
    assert r.headers["Location"] == "/calculadora"
    r = client.post("/calculadora", data={"tempo_planejado": "480", "paradas": "47", "ciclo_ideal": "1",
                                          "total_produzido": "19271", "pecas_boas": "18848"})
    assert "65.4%" in r.get_data(as_text=True)


def test_next_externo_e_ignorado(client):
    with client.session_transaction() as s:
        s["auth_flow"] = {"state": "s"}
        s["next"] = "//site-malicioso.com"
    with patch("oee.auth._msal_app") as m:
        m.return_value.acquire_token_by_auth_code_flow.return_value = {"id_token_claims": {"name": "x"}}
        r = client.get("/auth/callback?code=c&state=s")
    assert r.headers["Location"] == "/"


def test_grupo_nao_autorizado(app, client):
    app.config["ENTRA_ALLOWED_GROUPS"] = {"grupo-oee"}
    with client.session_transaction() as s:
        s["auth_flow"] = {"state": "s"}
    with patch("oee.auth._msal_app") as m:
        m.return_value.acquire_token_by_auth_code_flow.return_value = {"id_token_claims": {"groups": ["outro"]}}
        r = client.get("/auth/callback?code=c&state=s")
    assert r.status_code == 403
