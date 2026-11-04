"""Cálculo de OEE (Overall Equipment Effectiveness) = Disponibilidade × Performance × Qualidade."""
from dataclasses import dataclass


@dataclass(frozen=True)
class ResultadoOEE:
    disponibilidade: float
    performance: float
    qualidade: float

    @property
    def oee(self) -> float:
        return self.disponibilidade * self.performance * self.qualidade


def calcular_oee(
    tempo_planejado_min: float,
    paradas_min: float,
    ciclo_ideal_s: float,
    total_produzido: int,
    pecas_boas: int,
) -> ResultadoOEE:
    if tempo_planejado_min <= 0:
        raise ValueError("O tempo planejado deve ser maior que zero.")
    if not 0 <= paradas_min <= tempo_planejado_min:
        raise ValueError("As paradas devem estar entre zero e o tempo planejado.")
    if ciclo_ideal_s <= 0:
        raise ValueError("O ciclo ideal deve ser maior que zero.")
    if total_produzido < 0 or not 0 <= pecas_boas <= total_produzido:
        raise ValueError("As peças boas devem estar entre zero e o total produzido.")

    tempo_operando_min = tempo_planejado_min - paradas_min
    disponibilidade = tempo_operando_min / tempo_planejado_min
    performance = (
        min((ciclo_ideal_s * total_produzido) / (tempo_operando_min * 60), 1.0) if tempo_operando_min else 0.0
    )
    qualidade = pecas_boas / total_produzido if total_produzido else 0.0
    return ResultadoOEE(disponibilidade, performance, qualidade)
