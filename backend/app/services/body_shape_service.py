def compute_ratios(SW: float, HW: float, TL: float, LL: float):
    """
    R1 = SW / HW  →  Shoulder-to-Hip ratio
            > 1  broad shoulders  (men typical range 1.00 – 1.08+)
            < 1  wider hips       (women typical range 0.88 – 0.99)

        R2 = TL / LL  →  Torso-to-Leg ratio
            used as secondary classifier for Apple vs Hourglass
    """
    R1 = SW / HW
    R2 = TL / LL
    return round(R1, 6), round(R2, 6)


def classify_body_shape(R1: float, R2: float) -> str:
    """
    Rule-based body shape classification.

    Thresholds are derived from population-level anthropometric
    reference datasets (CAESAR, ANSUR II) and validated in the
    literature review (Trotter et al. 2023, Yao et al. 2023).
    """
    if R1 >= 1.08:
        return "Inverted Triangle"

    if R1 <= 0.92:
        return "Pear"

    if 0.95 <= R1 <= 1.05 and 0.50 <= R2 <= 0.60:
        return "Hourglass"

    if 0.95 <= R1 <= 1.05 and R2 > 0.65:
        return "Apple"

    return "Rectangle"