MAX_PIEZAS = 24


def admite_piezas(piezas: int) -> bool:
    return piezas > 0 and piezas < MAX_PIEZAS
