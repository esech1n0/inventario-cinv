const TIME_ZONE = "America/Mexico_City";

/**
 * Devuelve la clave de la semana (fecha del lunes, YYYY-MM-DD) en hora de México.
 * Las semanas van de lunes a domingo.
 */
export function getWeekKey(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  // Fecha "local" representada en UTC para operar sin desfases
  const local = new Date(Date.UTC(get("year"), get("month") - 1, get("day")));
  const dow = local.getUTCDay(); // 0 = domingo
  const diff = dow === 0 ? -6 : 1 - dow;
  local.setUTCDate(local.getUTCDate() + diff);
  return local.toISOString().slice(0, 10);
}

/** Etiqueta legible del rango de la semana, p. ej. "5 – 11 de octubre". */
export function formatWeekRange(weekKey: string): string {
  const start = new Date(`${weekKey}T12:00:00Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString("es-MX", { timeZone: "UTC", ...opts });
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  return sameMonth
    ? `${fmt(start, { day: "numeric" })} – ${fmt(end, { day: "numeric", month: "long" })}`
    : `${fmt(start, { day: "numeric", month: "short" })} – ${fmt(end, { day: "numeric", month: "short" })}`;
}

/** Devuelve la clave de la semana siguiente (o N semanas adelante) basada en un weekKey. */
export function getNextWeekKey(weekKey: string, weeksAhead: number = 1): string {
  const start = new Date(`${weekKey}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() + 7 * weeksAhead);
  return start.toISOString().slice(0, 10);
}
