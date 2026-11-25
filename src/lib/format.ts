// All times are shown in Malaysia time so every device sees the same school schedule.
const TZ = "Asia/Kuala_Lumpur";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parts(iso: string) {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0);
  return { y: get("year"), mo: get("month"), d: get("day"), h: get("hour"), mi: get("minute") };
}

export function fmtDate(iso: string) {
  const { y, mo, d } = parts(iso);
  return `${d} ${MONTHS[mo - 1]} ${y}`;
}

export function fmtTime(iso: string) {
  const { h, mi } = parts(iso);
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12.toString().padStart(2, "0")}:${mi.toString().padStart(2, "0")} ${ap}`;
}

export function fmtDateTime(iso: string, sep = " • ") {
  return `${fmtDate(iso)}${sep}${fmtTime(iso)}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
