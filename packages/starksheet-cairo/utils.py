import string

from constants import N_COLS


def number_to_index(n):
    row = n // N_COLS
    col = n % N_COLS
    return string.ascii_uppercase[col] + str(row + 1)
