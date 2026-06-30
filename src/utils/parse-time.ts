const TIME_UNITS: Record<string, number> = {
  s: 1000,
  m: 1000 * 60,
  h: 1000 * 60 * 60,
  d: 1000 * 60 * 60 * 24,
  w: 1000 * 60 * 60 * 24 * 7,
};

export function parseTime(value: string): number {
  const match = value.match(/^(\d+)([smhdw])$/);

  if (!match) {
    throw new Error(
      `Invalid time format: "${value}". Expected format: <number><unit> (e.g. 30d, 12h, 60m)`,
    );
  }

  const [, amount, unit] = match;

  return parseInt(amount, 10) * TIME_UNITS[unit];
}
