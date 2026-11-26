# Order validator accepts a quantity of zero

The validator accepts the integer `0` as an order quantity. The minimum valid quantity is `1`.

| Quantity | Expected result |
|---|---|
| `1` | Accept |
| `5` | Accept |
| `0` | Reject |
| `-1` | Reject |

Preserve the `is_valid_quantity` interface and add a regression test for `0`.
