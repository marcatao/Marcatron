import pytest

from oee.calculo import calcular_oee


def test_exemplo_classico():
    # 480 min planejados, 47 de parada, ciclo ideal 1 s, 19.271 peças, 18.848 boas
    r = calcular_oee(480, 47, 1.0, 19271, 18848)
    assert r.disponibilidade == pytest.approx(0.9021, abs=1e-4)
    assert r.performance == pytest.approx(0.7418, abs=1e-4)
    assert r.qualidade == pytest.approx(0.9780, abs=1e-4)
    assert r.oee == pytest.approx(0.6544, abs=1e-4)


def test_parada_total_zera_oee():
    assert calcular_oee(60, 60, 1, 0, 0).oee == 0


@pytest.mark.parametrize(
    "args",
    [(0, 0, 1, 1, 1), (60, 70, 1, 1, 1), (60, 0, 0, 1, 1), (60, 0, 1, 10, 11)],
)
def test_entradas_invalidas(args):
    with pytest.raises(ValueError):
        calcular_oee(*args)
