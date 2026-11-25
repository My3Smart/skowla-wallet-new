import { useSyncExternalStore } from "react";

export type Role = "teacher" | "parent";

export interface DemoUser {
  role: Role;
  email: string;
  password: string;
  name: string;
  shortName: string;
  title: string;
}

/** Hardcoded demo accounts for login testing (no backend). */
export const DEMO_USERS: readonly DemoUser[] = [
  {
    role: "teacher",
    email: "farid@skowla.edu.my",
    password: "teacher123",
    name: "Cikgu Farid bin Zakaria",
    shortName: "Cikgu Farid",
    title: "Teacher",
  },
  {
    role: "parent",
    email: "sarah@skowla.my",
    password: "parent123",
    name: "Puan Sarah",
    shortName: "Puan Sarah",
    title: "Parent",
  },
];

export interface Session {
  role: Role;
  email: string;
  name: string;
  shortName: string;
}

const SESSION_KEY = "skowla-session";
const sessionListeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedSession: Session | null = null;
function notifySession() {
  sessionListeners.forEach((l) => l());
}
function readSessionSnapshot(): Session | null {
  const raw = typeof window === "undefined" ? null : window.localStorage.getItem(SESSION_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSession = getSession();
  }
  return cachedSession;
}

/** Reactive current session (signed-in teacher/parent), shared by every page. */
export function useSession(): Session | null {
  return useSyncExternalStore(
    (l) => {
      sessionListeners.add(l);
      return () => sessionListeners.delete(l);
    },
    readSessionSnapshot,
    () => null,
  );
}

/** True when the session came from a real CBS login (not a demo account). */
export function isCbsSession(): boolean {
  return typeof window !== "undefined" && !!window.localStorage.getItem("cbsAccessToken");
}

export function authenticate(role: Role, email: string, password: string): DemoUser | null {
  const normalized = email.trim().toLowerCase();
  return (
    DEMO_USERS.find((u) => u.role === role && u.email === normalized && u.password === password) ??
    null
  );
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    return s.role === "teacher" || s.role === "parent" ? s : null;
  } catch {
    return null;
  }
}

export function startSession(user: DemoUser): Session {
  const s: Session = {
    role: user.role,
    email: user.email,
    name: user.name,
    shortName: user.shortName,
  };
  for (const k of ["cbsAccessToken", "cbsUser", "cbsWalletNumber", "school-parent"]) window.localStorage.removeItem(k);
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  notifySession();
  return s;
}

/** Start a parent session from a real CBS + Skowla login. */
export function startCbsSession(r: { accessToken: string; user: Record<string, unknown>; parent: Record<string, unknown> }): Session {
  const name = String(r.user["fullName"] ?? r.user["email"] ?? "Parent");
  const s: Session = { role: "parent", email: String(r.user["email"] ?? ""), name, shortName: name.split(" ").slice(0, 2).join(" ") };
  localStorage.setItem("cbsAccessToken", r.accessToken);
  localStorage.setItem("cbsUser", JSON.stringify(r.user));
  if (r.user["walletNumber"]) localStorage.setItem("cbsWalletNumber", String(r.user["walletNumber"]));
  localStorage.setItem("school-parent", JSON.stringify(r.parent));
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  notifySession();
  return s;
}

export function endSession() {
  for (const k of ["cbsAccessToken", "cbsUser", "cbsWalletNumber", "school-parent"]) window.localStorage.removeItem(k);
  window.localStorage.removeItem(SESSION_KEY);
  notifySession();
}

export function homeFor(role: Role) {
  return role === "teacher" ? ("/teacher" as const) : ("/parent" as const);
}
