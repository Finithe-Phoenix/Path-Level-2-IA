import unittest

from envio import admite_cajas


class PoliticaExistente(unittest.TestCase):
    def test_unidad(self):
        self.assertTrue(admite_cajas(1))

    def test_cero(self):
        self.assertFalse(admite_cajas(0))

    def test_exceso(self):
        self.assertFalse(admite_cajas(42))
