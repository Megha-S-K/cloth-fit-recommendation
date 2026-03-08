def compute_ratios(SW, HW, TL, LL):

    R1 = SW / HW
    R2 = TL / LL

    return R1, R2


def classify_body_shape(R1, R2):

    if R1 >= 1.08:
        return "Inverted Triangle"

    if R1 <= 0.92:
        return "Pear"

    if 0.95 <= R1 <= 1.05 and 0.50 <= R2 <= 0.60:
        return "Hourglass"

    if 0.95 <= R1 <= 1.05 and R2 > 0.65:
        return "Apple"

    return "Rectangle"