BASIC_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789-"


def encode_domain(domain) -> int:
    """
    From https://github.com/starknet-id/naming_contract/blob/78db668f32e730d0d688698c96ca677b3f801216/tools/encoding/encoding.py#L9.
    """
    big_alphabet = "这来"
    small_size_plus = len(BASIC_ALPHABET) + 1
    encoded = 0
    multiplier = 1
    for i in range(len(domain)):
        char = domain[i]
        try:
            index = BASIC_ALPHABET.index(char)
            if i == len(domain) - 1 and domain[i] == BASIC_ALPHABET[0]:
                encoded += multiplier * len(BASIC_ALPHABET)
                multiplier *= small_size_plus**2  # like adding 0
            else:
                encoded += multiplier * index
                multiplier *= small_size_plus
        except ValueError:
            encoded += multiplier * len(BASIC_ALPHABET)
            multiplier *= small_size_plus
            new_id = int(i == len(domain) - 1) + big_alphabet.index(char)
            encoded += multiplier * new_id
            multiplier *= len(big_alphabet)
    return encoded
