export function maskPAN(pan: string | null | undefined): string {
  if (!pan) return '';
  const cleaned = pan.trim().toUpperCase();
  if (cleaned.length !== 10) return cleaned; // Return as-is if invalid
  
  // Format: ABCDE1234F -> XXXXX1234X
  return `XXXXX${cleaned.substring(5, 9)}${cleaned.charAt(9)}`;
}

export function maskAadhaar(aadhaar: string | null | undefined): string {
  if (!aadhaar) return '';
  const cleaned = aadhaar.trim().replace(/[-\s]/g, '');
  if (cleaned.length !== 12) return cleaned; // Return as-is if invalid

  // Format: 123456789012 -> XXXX-XXXX-9012
  return `XXXX-XXXX-${cleaned.substring(8)}`;
}
