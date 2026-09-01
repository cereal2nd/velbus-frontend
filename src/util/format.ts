export function formatAddress(address: number): string {
  return `${address} (0x${address.toString(16).toUpperCase().padStart(2, "0")})`;
}
