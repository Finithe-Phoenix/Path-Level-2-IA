import unittest

from order_quantity import is_valid_quantity


class OrderQuantityTests(unittest.TestCase):
    def test_accepts_one(self):
        self.assertTrue(is_valid_quantity(1))

    def test_accepts_five(self):
        self.assertTrue(is_valid_quantity(5))

    def test_rejects_negative_one(self):
        self.assertFalse(is_valid_quantity(-1))
