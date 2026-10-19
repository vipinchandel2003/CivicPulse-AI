import re
from typing import Optional


def mask_phone_number(phone: str, user_role: str) -> str:
    """
    Security.md §6 / DPDP Act 2023:
    - Tier 1 (FIELD_INSPECTOR): MUST NEVER see reporter phone -> completely hidden ("REDACTED").
    - Tier 2/3 (WARD_CSI, ZONAL_OFFICER): Masked phone -> "+91 98****210".
    - Tier 5 (SUPER_ADMIN): Can view only with audit logged reason.
    """
    if user_role == "FIELD_INSPECTOR":
        return "[REDACTED_FIELD_TIER]"

    clean = re.sub(r"\s+", "", phone)
    if len(clean) >= 10:
        # Show first 4 and last 3 digits
        return f"{clean[:4]}****{clean[-3:]}"
    return "****"
