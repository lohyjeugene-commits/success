/**
 * Singapore area constants for group location selection.
 * Used across forms, filters, and display components.
 */

export const SINGAPORE_AREAS = [
  "Ang Mo Kio",
  "Bedok",
  "Bishan",
  "Bukit Batok",
  "Bukit Panjang",
  "Bukit Timah",
  "Bugis",
  "Canberra",
  "Changi",
  "Choa Chu Kang",
  "City Hall",
  "Clementi",
  "Dhoby Ghaut",
  "Geylang",
  "HarbourFront",
  "Hougang",
  "Jurong East",
  "Jurong West",
  "Kallang",
  "Katong",
  "Khatib",
  "Marine Parade",
  "Newton",
  "Novena",
  "Orchard",
  "Outram",
  "Paya Lebar",
  "Pasir Ris",
  "Punggol",
  "Queenstown",
  "Redhill",
  "Sembawang",
  "Sengkang",
  "Serangoon",
  "Simei",
  "Tampines",
  "Tanjong Pagar",
  "Tiong Bahru",
  "Toa Payoh",
  "Woodlands",
  "Yishun",
] as const;

export type SingaporeArea = (typeof SINGAPORE_AREAS)[number];

/**
 * Check if a string is a valid Singapore area.
 */
export function isValidSingaporeArea(value: string): value is SingaporeArea {
  return (SINGAPORE_AREAS as readonly string[]).includes(value);
}