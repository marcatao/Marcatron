from flask import Blueprint, render_template, request

from .auth import current_user, login_required
from .calculo import calcular_oee

bp = Blueprint("portal", __name__)


@bp.app_context_processor
def _injeta_usuario():
    return {"usuario": current_user()}


@bp.route("/")
def index():
    return render_template("index.html")


@bp.route("/calculadora", methods=["GET", "POST"])
@login_required
def calculadora():
    resultado, erro, dados = None, None, request.form
    if request.method == "POST":
        try:
            valores = (
                float(dados["tempo_planejado"]),
                float(dados["paradas"]),
                float(dados["ciclo_ideal"]),
                int(dados["total_produzido"]),
                int(dados["pecas_boas"]),
            )
        except (KeyError, ValueError):
            erro = "Preencha todos os campos com números válidos."
        else:
            try:
                resultado = calcular_oee(*valores)
            except ValueError as e:
                erro = str(e)
    return render_template("calculadora.html", resultado=resultado, erro=erro, dados=dados)


@bp.route("/perfil")
@login_required
def perfil():
    return render_template("perfil.html")


@bp.app_errorhandler(403)
def proibido(_):
    return render_template("erro.html", mensagem="Seu usuário não tem acesso a este portal."), 403
