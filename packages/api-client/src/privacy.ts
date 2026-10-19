// DPDP Act 2023 Masking Rules
export function maskPhoneNumber(phone?: string): string {
  if (!phone || phone.length < 10) return "•••••••";
  // Display only first 2 and last 2 digits
  return `${phone.substring(0, 2)}••••••${phone.substring(phone.length - 2)}`;
}

// Ensure human reason string is substantive (>= 8 characters)
export function validateGovernanceReason(reason: string): { isValid: boolean; error?: string } {
  const trimmed = reason.trim();
  if (trimmed.length < 8) {
    return {
      isValid: false,
      error: "Municipal governance requires a specific substantive reason (min 8 characters)."
    };
  }
  return { isValid: true };
}
