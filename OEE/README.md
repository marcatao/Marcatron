# OEE

Portal web em Python (Flask) para acompanhar o **OEE** (Overall Equipment Effectiveness / Eficiência Global dos
Equipamentos), com login pela conta corporativa no **Microsoft Entra ID**.

OEE = Disponibilidade × Performance × Qualidade.

## Estrutura

- `app.py`: ponto de entrada (`flask --app app run` ou `gunicorn app:app`).
- `oee/config.py`: configuração lida das variáveis de ambiente (`.env`).
- `oee/auth.py`: login/logout com Entra ID via MSAL (OpenID Connect, authorization code + PKCE) e o decorador
  `login_required`.
- `oee/portal.py`: páginas do portal (início, calculadora de OEE, perfil).
- `oee/calculo.py`: cálculo de OEE.
- `oee/templates/`, `oee/static/`: telas e estilo.
- `tests/`: testes (`pytest`), com o Entra ID simulado.

## 1. Registrar o aplicativo no Entra ID

1. Em [portal.azure.com](https://portal.azure.com) > **Microsoft Entra ID** > **Registros de aplicativo** >
   **Novo registro**.
2. Nome: `Portal OEE`. Tipos de conta: **somente contas deste diretório organizacional**.
3. URI de redirecionamento: plataforma **Web**, `http://localhost:5000/auth/callback`
   (em produção, adicione também `https://seu-dominio/auth/callback`).
4. Depois de criar, anote o **ID do aplicativo (cliente)** e o **ID do diretório (locatário)**.
5. Em **Certificados e segredos** > **Novo segredo do cliente**, copie o **Valor**.
6. A permissão `User.Read` (Microsoft Graph, delegada) já vem por padrão.
7. Opcional, para restringir o acesso a grupos: em **Configuração de token** > **Adicionar declaração de grupos** e
   defina `ENTRA_ALLOWED_GROUPS` com os IDs dos grupos permitidos.

## 2. Rodar localmente

```sh
cd OEE
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # preencha com os dados do passo 1
flask --app app run    # abra http://localhost:5000
```

## Testes

```sh
pip install -r requirements-dev.txt
pytest
```

## Produção

```sh
gunicorn -w 2 -b 0.0.0.0:8000 app:app
```

Use HTTPS (o cookie de sessão passa a ser `Secure` quando `ENTRA_REDIRECT_URI` começa com `https://`) e guarde o
segredo do cliente fora do código (variáveis de ambiente ou Azure Key Vault).
