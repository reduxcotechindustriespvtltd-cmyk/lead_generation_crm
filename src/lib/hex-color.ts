const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** Only ever pass validated hex colors into raw CSS/HTML — never trust the DB value alone. */
export function safeHexColor(value: string, fallback: string): string {
  return HEX_COLOR_PATTERN.test(value) ? value : fallback;
}
