import unittest

from lote import admite_piezas


class PoliticaExistente(unittest.TestCase):
    def test_unidad(self):
        self.assertTrue(admite_piezas(1))

    def test_cero(self):
        self.assertFalse(admite_piezas(0))

    def test_exceso(self):
        self.assertFalse(admite_piezas(26))
