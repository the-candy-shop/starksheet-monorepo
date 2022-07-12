from pathlib import Path

CONTRACTS = {p.stem: p for p in list(Path("contracts").glob("*.cairo"))}

OWNER = int("0x01C8D2BB17CDDF22728553C9700ADFBBD42D1999194B409B1188B17191CC2EFD", 16)
