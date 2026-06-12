export type PerformanceUnit =
  | "seconds"
  | "metres"
  | "centimetres"
  | "kilograms"
  | "points"
  | "none";

// Time like "1:45.32" (m:ss) or "2:05:30" (h:mm:ss) — fraction allowed on the last part
const TIME_PATTERN = /^(\d{1,3}):([0-5]?\d)(?::([0-5]?\d))?(?:[.,](\d{1,3}))?$/;
// Plain number with an optional unit suffix, e.g. "10.85s", "6.45m", "180cm", "75kg", "1200pts"
const NUMBER_PATTERN = /^(\d+(?:[.,]\d+)?)(s|sec|secs|seconds|m|mtr|mtrs|metre|metres|meter|meters|cm|kg|kgs|pt|pts|point|points)?$/;

function toNumber(raw: string): number {
  return parseFloat(raw.replace(",", "."));
}

/**
 * Parse free-text performance (as typed by data-entry users) into a numeric
 * value in the discipline's configured unit. Returns null when the text can't
 * be interpreted confidently — the free-text column remains the display value.
 */
export function parsePerformance(text: string | null | undefined, unit: PerformanceUnit): number | null {
  if (!text || unit === "none") return null;

  const cleaned = text.toLowerCase().replace(/\s+/g, "");
  if (!cleaned) return null;

  // Times only make sense for timed disciplines
  const time = cleaned.match(TIME_PATTERN);
  if (time) {
    if (unit !== "seconds") return null;
    const [, a, b, c, frac] = time;
    const whole = c !== undefined
      ? parseInt(a) * 3600 + parseInt(b) * 60 + parseInt(c)
      : parseInt(a) * 60 + parseInt(b);
    const seconds = whole + (frac ? parseFloat(`0.${frac}`) : 0);
    return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
  }

  const match = cleaned.match(NUMBER_PATTERN);
  if (!match) return null;

  const value = toNumber(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;

  const suffix = match[2] ?? "";
  const kind =
    suffix === "" ? "bare"
    : suffix.startsWith("s") ? "seconds"
    : suffix === "cm" ? "centimetres"
    : suffix.startsWith("m") ? "metres"
    : suffix.startsWith("kg") ? "kilograms"
    : "points";

  switch (unit) {
    case "seconds":
      return kind === "bare" || kind === "seconds" ? value : null;
    case "metres":
      if (kind === "bare" || kind === "metres") return value;
      if (kind === "centimetres") return value / 100;
      return null;
    case "centimetres":
      if (kind === "bare" || kind === "centimetres") return value;
      if (kind === "metres") return value * 100;
      return null;
    case "kilograms":
      return kind === "bare" || kind === "kilograms" ? value : null;
    case "points":
      return kind === "bare" || kind === "points" ? value : null;
  }
}
