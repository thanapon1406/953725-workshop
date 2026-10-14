/**
 * Thai national ID: 13 digits, the last one is a checksum.
 * checksum = (11 - (Σ digit[i] × (13 - i) for i = 0..11) mod 11) mod 10
 */
export function isValidThaiNationalId(id: string): boolean {
  if (!/^\d{13}$/.test(id)) return false;

  const digits = [...id].map(Number);
  const sum = digits.slice(0, 12).reduce((acc, digit, i) => acc + digit * (13 - i), 0);
  const checksum = (11 - (sum % 11)) % 10;

  return checksum === digits[12];
}
