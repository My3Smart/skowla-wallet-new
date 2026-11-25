import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card } from "@/components/skowla/AppShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppState } from "@/lib/store";

const periods = ["This Week", "This Month", "This Term"] as const;
type Period = (typeof periods)[number];
const periodDays: Record<Period, number> = { "This Week": 7, "This Month": 31, "This Term": 120 };

/** Baseline school case counts for the period (on top of logged reports). */
const baseline: Record<Period, Record<string, number>> = {
  "This Week": { Bullying: 2, Fighting: 1, Vandalism: 1, Truancy: 3, Others: 2 },
  "This Month": { Bullying: 6, Fighting: 4, Vandalism: 3, Truancy: 9, Others: 5 },
  "This Term": { Bullying: 15, Fighting: 11, Vandalism: 7, Truancy: 24, Others: 13 },
};
const caseTypes = [
  { label: "Bullying", color: "var(--chart-4)" },
  { label: "Fighting", color: "var(--chart-3)" },
  { label: "Vandalism", color: "var(--chart-1)" },
  { label: "Truancy", color: "var(--chart-5)" },
  { label: "Others", color: "var(--chart-2)" },
];

function caseOf(issue: string) {
  const i = issue.toLowerCase();
  if (i.includes("bull") || i.includes("buli")) return "Bullying";
  if (i.includes("fight") || i.includes("gaduh") || i.includes("bergaduh")) return "Fighting";
  if (i.includes("vandal") || i.includes("rosak")) return "Vandalism";
  if (i.includes("truan") || i.includes("ponteng") || i.includes("absent")) return "Truancy";
  return "Others";
}

/** Donut chart breaking down school cases (bullying, fighting, etc.) by period. */
export function CaseReport() {
  const { t: tr, locale } = useLanguage();
  const { complaints } = useAppState();
  const [period, setPeriod] = useState<Period>("This Month");

  const since = Date.now() - periodDays[period] * 86400000;
  const counts = { ...baseline[period] };
  for (const c of complaints) {
    if (new Date(c.createdAt).getTime() >= since || period === "This Term") {
      const k = caseOf(c.issue);
      counts[k] = (counts[k] ?? 0) + 1;
    }
  }
  const pie = caseTypes.map((t) => ({
    name: t.label,
    value: counts[t.label] ?? 0,
    color: t.color,
  }));
  const totalCases = pie.reduce((t, p) => t + p.value, 0);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-base font-bold">{tr("Case Report")}</h3>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger
            className="h-8 w-32 rounded-lg bg-card text-xs font-semibold"
            aria-label={tr("Period")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {localizeNode(
              periods.map((p) => (
                <SelectItem key={p} value={p}>
                  {localizeNode(p, tr)}
                </SelectItem>
              )),
              tr,
            )}
          </SelectContent>
        </Select>
      </div>
      <Card className="flex items-center gap-4 p-4">
        <div className="relative size-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pie}
                dataKey="value"
                innerRadius="52%"
                outerRadius="95%"
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {localizeNode(
                  pie.map((p) => <Cell key={p.name} fill={p.color} />),
                  tr,
                )}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-xl font-bold">{localizeNode(totalCases, tr)}</p>
              <p className="text-[10px] text-muted-foreground">{tr("cases")}</p>
            </div>
          </div>
        </div>
        <ul className="flex-1 space-y-2.5">
          {localizeNode(
            pie.map((p) => (
              <li key={p.name} className="flex items-center gap-2 text-xs">
                <span className="size-2.5 rounded-full" style={{ background: p.color }} />
                <span className="flex-1">{localizeNode(p.name, tr)}</span>
                <span className="font-bold">{localizeNode(p.value, tr)}</span>
              </li>
            )),
            tr,
          )}
        </ul>
      </Card>
    </div>
  );
}
