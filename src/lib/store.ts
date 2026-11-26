import { getSession } from "@/lib/auth";
import { useSyncExternalStore } from "react";
import {
  seedChat,
  seedChildren,
  seedComplaints,
  seedInvoices,
  seedStudents,
  seedTeacherNotifications,
  seedTransactions,
  type ChatMessage,
  type Child,
  type Complaint,
  type ComplaintStatus,
  type Invoice,
  type Student,
  type TeacherNotification,
  type Transaction,
  type TxKind,
} from "@/lib/data";

export interface Settings {
  push: boolean;
  email: boolean;
  autoSync: boolean;
  language: "English" | "Bahasa Melayu";
  theme: "Light" | "Dark";
}

export interface LeaveNote {
  id: string;
  childId: string;
  type: "Sakit" | "Cuti";
  date: string;
  reason: string;
  images?: string[];
  at: string;
}

export interface AppState {
  students: Student[];
  complaints: Complaint[];
  notifications: TeacherNotification[];
  children: Child[];
  walletBalance: number;
  transactions: Transaction[];
  invoices: Invoice[];
  chat: ChatMessage[];
  settings: Settings;
  teacherProfile: { name: string; email: string; phone: string };
  autoReload: boolean;
  leaveNotes: LeaveNote[];
  dietInfo: Record<string, DietInfo>;
  transport: Record<string, "bus" | "parent">;
}

export interface DietInfo {
  allergies: string[];
  notes: string;
}

export const DEFAULT_TEACHER = "Cikgu Farid bin Zakaria";

/** Who reported a complaint, its number and date — with fallbacks for older records. */
export function complaintMeta(c: Complaint) {
  return {
    reportedBy: c.reportedBy ?? (c.source === "parent" ? "Parent" : DEFAULT_TEACHER),
    reportNo: c.reportNo ?? `${c.source === "parent" ? "ADN" : "RPT"}-${c.id.toUpperCase()}`,
    date: c.createdAt,
  };
}

export function nextReportNo(s: Pick<AppState, "complaints">, source: "teacher" | "parent") {
  const prefix = source === "parent" ? "ADN" : "RPT";
  const year = new Date().getFullYear();
  const count = s.complaints.filter((c) => c.source === source).length + 1;
  return `${prefix}-${year}-${String(count).padStart(4, "0")}`;
}

export function applyShopPurchase(s: AppState, item: string, price: number, qty: number): AppState {
  const total = round2(price * qty);
  if (
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isInteger(qty) ||
    qty < 1 ||
    !Number.isFinite(total)
  )
    throw new Error("Jumlah tidak sah");
  if (total > s.walletBalance) throw new Error("Baki dompet tidak mencukupi");
  return {
    ...s,
    walletBalance: round2(s.walletBalance - total),
    transactions: [
      tx("shop", `Kedai Sekolah: ${item}`, `${qty}× ${rm(price)}`, -total),
      ...s.transactions,
    ],
  };
}

export function caseSummary(complaints: Complaint[]) {
  return {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "Pending").length,
    inProgress: complaints.filter((c) => c.status === "In Progress").length,
    solved: complaints.filter((c) => c.status === "Resolved").length,
  };
}

export function transportSummary(mode: "bus" | "parent") {
  return { onTime: mode === "parent" ? 0 : 48, total: mode === "parent" ? 0 : 48 };
}

const STORAGE_KEY = "skowla-state-v2";

/** Map CBS dependents to dashboard children (real data, no demo children). */
export function mapCbsDependents(deps: Record<string, unknown>[]): Child[] {
  return deps
    .filter((d) => String(d["status"] ?? "ACTIVE") === "ACTIVE")
    .map((d) => ({
      id: String(d["childId"] ?? d["dependentId"] ?? d["userCode"]),
      name: String(d["fullName"] ?? "Child"),
      className: String(d["userCode"] ?? ""),
      school: "Skowla",
      cardBalance: 0,
      dailyLimit: 0,
      spentToday: 0,
      checkIn: "—",
      lastSeen: "—",
    }));
}

/** Replace demo family data with the signed-in CBS parent's real children and balance. */
export function applyCbsFamily(s: AppState, deps: Record<string, unknown>[], balance: number | null): AppState {
  return { ...s, children: mapCbsDependents(deps), walletBalance: balance ?? 0, transactions: [], invoices: [] };
}

export function createInitialState(): AppState {
  return {
    students: seedStudents,
    complaints: seedComplaints,
    notifications: seedTeacherNotifications,
    children: seedChildren,
    walletBalance: 485.5,
    transactions: seedTransactions,
    invoices: seedInvoices,
    chat: seedChat,
    settings: { push: true, email: true, autoSync: true, language: "English", theme: "Light" },
    teacherProfile: {
      name: "Cikgu Farid bin Zakaria",
      email: "farid@skowla.edu.my",
      phone: "+60 12-345 6789",
    },
    autoReload: true,
    leaveNotes: [],
    dietInfo: {},
    transport: {},
  };
}

const initial = createInitialState();
let state: AppState = initial;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<AppState>;
      state = { ...initial, ...saved };
      // Older saved data may miss newer student fields (e.g. guardian) — fill from seed.
      state.students = (saved.students ?? initial.students).map((st) => {
        const seed = initial.students.find((x) => x.id === st.id);
        return {
          ...seed,
          ...st,
          guardian: st.guardian ?? seed?.guardian ?? { name: "—", phone: "—" },
          attendance: st.attendance ?? seed?.attendance ?? { present: 0, absent: 0, late: 0 },
          behaviour: st.behaviour ?? seed?.behaviour ?? { merits: 0, demerits: 0, notes: [] },
        } as Student;
      });
    }
  } catch {
    state = initial;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable */
  }
}

export function getState(): AppState {
  hydrate();
  return state;
}

export function setState(updater: (s: AppState) => AppState) {
  hydrate();
  state = updater(state);
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, () => initial);
}

const uid = () => Math.random().toString(36).slice(2, 10);
const round2 = (n: number) => Math.round(n * 100) / 100;

/* ---------- pure money rules (unit tested) ---------- */

export function applyTopUp(s: AppState, amount: number, method: string): AppState {
  if (!(amount > 0)) throw new Error("Jumlah tidak sah");
  return {
    ...s,
    walletBalance: round2(s.walletBalance + amount),
    transactions: [tx("topup", `Top Up via ${method}`, "Berjaya", amount), ...s.transactions],
  };
}

/** CBS-confirmed reload: trust the server balance when it is returned. */
export function applyConfirmedReload(
  s: AppState,
  amount: number,
  method: string,
  availableBalance: number | null,
): AppState {
  const next = applyTopUp(s, amount, method);
  return availableBalance == null ? next : { ...next, walletBalance: round2(availableBalance) };
}

export function applyTransfer(s: AppState, childId: string, amount: number): AppState {
  if (!(amount > 0)) throw new Error("Jumlah tidak sah");
  if (amount > s.walletBalance) throw new Error("Baki dompet tidak mencukupi");
  const child = s.children.find((c) => c.id === childId);
  if (!child) throw new Error("Anak tidak dijumpai");
  return {
    ...s,
    walletBalance: round2(s.walletBalance - amount),
    children: s.children.map((c) =>
      c.id === childId ? { ...c, cardBalance: round2(c.cardBalance + amount) } : c,
    ),
    transactions: [
      tx("transfer", `Hantar Wang: ${child.name.split(" ")[0]}`, "Pemindahan ke kad", -amount),
      ...s.transactions,
    ],
  };
}

export function applyPreOrder(
  s: AppState,
  childId: string,
  items: { name: string; price: number; qty: number }[],
): AppState {
  const total = round2(items.reduce((t, i) => t + i.price * i.qty, 0));
  if (total <= 0) throw new Error("Tiada item dipilih");
  const child = s.children.find((c) => c.id === childId);
  if (!child) throw new Error("Anak tidak dijumpai");
  if (total > child.cardBalance) throw new Error("Baki kad pintar tidak mencukupi");
  return {
    ...s,
    children: s.children.map((c) =>
      c.id === childId ? { ...c, cardBalance: round2(c.cardBalance - total) } : c,
    ),
    transactions: [
      tx(
        "canteen",
        "Canteen Pre-Order",
        `${child.name.split(" ")[0]} • ${items.map((i) => `${i.qty}× ${i.name}`).join(", ")}`,
        -total,
      ),
      ...s.transactions,
    ],
  };
}

export function applyPayInvoices(s: AppState, invoiceIds: string[]): AppState {
  const due = s.invoices.filter((i) => invoiceIds.includes(i.id) && !i.paid);
  const total = round2(due.reduce((t, i) => t + i.amount, 0));
  if (total <= 0) throw new Error("Tiada yuran tertunggak");
  if (total > s.walletBalance) throw new Error("Baki dompet tidak mencukupi");
  return {
    ...s,
    walletBalance: round2(s.walletBalance - total),
    invoices: s.invoices.map((i) => (due.some((x) => x.id === i.id) ? { ...i, paid: true } : i)),
    transactions: [
      ...due.map((i) => tx("fees", i.title, "Bayaran yuran sekolah", -i.amount)),
      ...s.transactions,
    ],
  };
}

export function applyMerchantPay(s: AppState, merchant: string, amount: number): AppState {
  if (!(amount > 0)) throw new Error("Jumlah tidak sah");
  if (amount > s.walletBalance) throw new Error("Baki dompet tidak mencukupi");
  return {
    ...s,
    walletBalance: round2(s.walletBalance - amount),
    transactions: [tx("canteen", merchant, "Bayaran Scan QR", -amount), ...s.transactions],
  };
}

function tx(kind: TxKind, title: string, subtitle: string, amount: number): Transaction {
  return { id: uid(), kind, title, subtitle, amount: round2(amount), at: new Date().toISOString() };
}

/* ---------- actions ---------- */

export const actions = {
  resetDemoFamily() {
    const fresh = createInitialState();
    setState((s) => ({ ...s, children: fresh.children, walletBalance: fresh.walletBalance, transactions: fresh.transactions, invoices: fresh.invoices, chat: fresh.chat }));
  },
  loadCbsFamily(deps: Record<string, unknown>[], balance: number | null) {
    setState((s) => ({ ...applyCbsFamily(s, deps, balance), chat: [] }));
  },
  setDietInfo(childId: string, info: DietInfo) {
    setState((s) => ({ ...s, dietInfo: { ...s.dietInfo, [childId]: info } }));
  },
  setTransport(childId: string, mode: "bus" | "parent") {
    setState((s) => ({ ...s, transport: { ...s.transport, [childId]: mode } }));
  },
  buyShopItem(item: string, price: number, qty: number) {
    setState((s) => applyShopPurchase(s, item, price, qty));
  },
  reset() {
    setState(() => createInitialState());
  },
  topUp(amount: number, method: string) {
    setState((s) => applyTopUp(s, amount, method));
  },
  confirmedReload(amount: number, method: string, availableBalance: number | null) {
    setState((s) => applyConfirmedReload(s, amount, method, availableBalance));
  },
  transfer(childId: string, amount: number) {
    setState((s) => applyTransfer(s, childId, amount));
  },
  /** CBS saved the transfer; mirror it and take the parent's balance from CBS. */
  cbsTransferDone(childId: string, amount: number, availableBalance: number | null) {
    setState((s) => {
      const next = applyTransfer({ ...s, walletBalance: Math.max(s.walletBalance, amount) }, childId, amount);
      return availableBalance == null ? next : { ...next, walletBalance: round2(availableBalance) };
    });
  },
  preOrder(childId: string, items: { name: string; price: number; qty: number }[]) {
    setState((s) => applyPreOrder(s, childId, items));
  },
  payMerchant(merchant: string, amount: number) {
    setState((s) => applyMerchantPay(s, merchant, amount));
  },
  payInvoices(ids: string[]) {
    setState((s) => applyPayInvoices(s, ids));
  },
  setDailyLimit(childId: string, limit: number) {
    setState((s) => ({
      ...s,
      children: s.children.map((c) => (c.id === childId ? { ...c, dailyLimit: round2(limit) } : c)),
    }));
  },
  addChild(name: string, className: string, school: string) {
    setState((s) => ({
      ...s,
      children: [
        ...s.children,
        {
          id: uid(),
          name,
          className,
          school,
          cardBalance: 0,
          dailyLimit: 5,
          spentToday: 0,
          checkIn: "—",
          lastSeen: "Belum hadir",
        },
      ],
    }));
  },
  setAutoReload(v: boolean) {
    setState((s) => ({ ...s, autoReload: v }));
  },
  addLeaveNote(note: Omit<LeaveNote, "id" | "at">) {
    setState((s) => ({
      ...s,
      leaveNotes: [{ ...note, id: uid(), at: new Date().toISOString() }, ...s.leaveNotes],
    }));
  },
  addComplaint(input: {
    student: string;
    form: string;
    issue: string;
    description: string;
    source: "teacher" | "parent";
    reportedBy?: string;
    reportNo?: string;
  }) {
    const now = new Date().toISOString();
    setState((s) => ({
      ...s,
      complaints: [
        {
          id: uid(),
          ...input,
          reportedBy:
            input.reportedBy ?? (input.source === "parent" ? (getSession()?.name ?? "Ibu bapa") : s.teacherProfile.name),
          reportNo: input.reportNo ?? nextReportNo(s, input.source),
          status: "Pending",
          createdAt: now,
          updates: [{ title: "Complaint Submitted", at: now }],
        },
        ...s.complaints,
      ],
      notifications: [
        {
          id: uid(),
          kind: "complaint",
          title: `New complaint: ${input.issue}`,
          at: now,
          read: false,
        },
        ...s.notifications,
      ],
    }));
  },
  updateComplaint(id: string, status: ComplaintStatus, note?: string) {
    const now = new Date().toISOString();
    setState((s) => ({
      ...s,
      complaints: s.complaints.map((c) =>
        c.id === id
          ? {
              ...c,
              status,
              updates: [
                ...c.updates,
                {
                  title: status === "Resolved" ? "Resolved" : "Update Added",
                  ...(note ? { note } : {}),
                  at: now,
                },
              ],
            }
          : c,
      ),
    }));
  },
  toggleRemark(studentId: string, remarkId: string) {
    setState((s) => ({
      ...s,
      students: s.students.map((st) =>
        st.id === studentId
          ? {
              ...st,
              remarks: st.remarks.map((r) => (r.id === remarkId ? { ...r, done: !r.done } : r)),
            }
          : st,
      ),
    }));
  },
  addRemark(studentId: string, text: string) {
    setState((s) => ({
      ...s,
      students: s.students.map((st) =>
        st.id === studentId
          ? { ...st, remarks: [...st.remarks, { id: uid(), text, done: false }] }
          : st,
      ),
    }));
  },
  markNotification(id: string) {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },
  markAllNotifications() {
    setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
  },
  updateSettings(patch: Partial<Settings>) {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  },
  updateTeacherProfile(patch: Partial<AppState["teacherProfile"]>) {
    setState((s) => ({ ...s, teacherProfile: { ...s.teacherProfile, ...patch } }));
  },
  addChatMessage(m: Omit<ChatMessage, "id" | "at">) {
    setState((s) => ({
      ...s,
      chat: [...s.chat, { ...m, id: uid(), at: new Date().toISOString() }],
    }));
  },
  clearChat() {
    setState((s) => ({ ...s, chat: seedChat.slice(0, 1) }));
  },
};

export const rm = (n: number) =>
  `RM ${n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
