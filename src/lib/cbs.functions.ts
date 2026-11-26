import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type Flat = Record<string, string | number | boolean | null>;

export interface CbsLoginResult {
  ok: boolean;
  error?: string;
  accessToken?: string;
  user?: Flat;
  parent?: Flat;
  dependents?: Flat[];
  balance?: number | null;
}

function cbsBase() {
  return (process.env["CBS_API_URL"] ?? "https://cbs.skowla.com").replace(/\/+$/, "");
}

/** Parent login: CBS /api/v1/auth/login (wallet API key), then Skowla parent check. */
export const loginParentCbs = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ username: z.string().min(1).max(255), password: z.string().min(1).max(255) }).parse(d),
  )
  .handler(async ({ data }): Promise<CbsLoginResult> => {
    const apiKey = process.env["CBS_WALLET_API_KEY"];
    if (!apiKey) return { ok: false, error: "Login service is not configured." };
    const schoolApi = process.env["SKOWLA_API_URL"] ?? "https://dev-api.skowla.com/api";
    const u = data.username.trim();
    const body: Record<string, string> = { password: data.password };
    if (u.includes("@")) body["email"] = u;
    else body["userCode"] = u;

    let res: Response;
    try {
      res = await fetch(`${cbsBase()}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      });
    } catch {
      return { ok: false, error: "Unable to connect to CBS. Please try again." };
    }
    if (res.status === 401 || res.status === 400) return { ok: false, error: "Invalid username or password." };
    if (res.status === 403) return { ok: false, error: "Your account is not allowed to login." };
    if (!res.ok) return { ok: false, error: "Unable to connect to CBS. Please try again." };
    const json = (await res.json().catch(() => null)) as
      | { success?: boolean; accessToken?: string; user?: Flat }
      | null;
    if (!json?.success || !json.accessToken || !json.user) {
      return { ok: false, error: "Invalid username or password." };
    }
    const email = String(json.user["email"] ?? u);
    let parent: Flat = {};
    try {
      const pr = await fetch(`${schoolApi}/ewallet/parent-by-email?email=${encodeURIComponent(email)}`);
      const pj = (await pr.json()) as { isSchoolParent?: boolean; parent?: Flat };
      if (pj.isSchoolParent === false) {
        return { ok: false, error: "This account is not registered as a Skowla parent." };
      }
      parent = pj.parent ?? {};
    } catch {
      // School check unavailable: CBS login already succeeded, continue.
    }
    const auth = { Authorization: `Bearer ${json.accessToken}` };
    let dependents: Flat[] = [];
    let balance: number | null = null;
    try {
      const dr = await fetch(`${cbsBase()}/api/v1/users/me/dependents`, { headers: auth });
      const dj = (await dr.json()) as { dependents?: Flat[] };
      dependents = Array.isArray(dj.dependents) ? dj.dependents : [];
    } catch {
      /* no dependents available */
    }
    try {
      const br = await fetch(`${cbsBase()}/api/v1/users/me/balance`, { headers: auth });
      if (br.ok) {
        const bj = (await br.json()) as Record<string, unknown>;
        const raw = bj["balance"] ?? bj["availableBalance"] ?? (bj["wallet"] as Record<string, unknown> | undefined)?.["balance"];
        const n = Number(raw);
        balance = Number.isFinite(n) ? n : null;
      }
    } catch {
      /* wallet not available */
    }
    return { ok: true, accessToken: json.accessToken, user: json.user, parent, dependents, balance };
  });

/** Authenticated CBS reads for the signed-in user. */
export const cbsGet = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ token: z.string().min(1), path: z.enum(["dependents", "balance"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const r = await fetch(`${cbsBase()}/api/v1/users/me/${data.path}`, {
      headers: { Authorization: `Bearer ${data.token}` },
    });
    const text = await r.text();
    return JSON.stringify({ ok: r.ok, status: r.status, body: text });
  });

/* ---------- Wallet reload (top-up) ---------- */

export interface CbsReloadResult {
  ok: boolean;
  error?: string;
  reference?: string;
  status?: string;
  checkoutUrl?: string;
  availableBalance?: number | null;
}

async function cbsPost(path: string, token: string | undefined, body: unknown) {
  const key = token || process.env["CBS_WALLET_API_KEY"];
  if (!key) return { status: 0, json: null as Record<string, unknown> | null };
  try {
    const r = await fetch(`${cbsBase()}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    });
    const json = (await r.json().catch(() => null)) as Record<string, unknown> | null;
    return { status: r.status, json };
  } catch {
    return { status: 0, json: null };
  }
}

function reloadError(status: number, json: Record<string, unknown> | null): string {
  if (status === 0) return "Unable to connect to CBS. Please try again.";
  if (status === 404 && !json) return "Top-up is not available on the CBS server yet.";
  const msg = json?.["message"];
  return typeof msg === "string" && msg ? msg : "Top-up failed. Please try again.";
}

/** Step 1: POST /api/v1/wallets/reload → checkoutUrl + reference. */
export const initiateWalletReload = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        token: z.string().max(4000).optional(),
        walletNumber: z.string().max(64).optional(),
        amount: z.number().min(5).max(10000),
        providerCode: z.string().max(40).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<CbsReloadResult> => {
    const body: Record<string, unknown> = { amount: Math.round(data.amount * 100) / 100 };
    if (data.walletNumber) body["walletNumber"] = data.walletNumber;
    if (data.providerCode) body["providerCode"] = data.providerCode;
    const { status, json } = await cbsPost("/api/v1/wallets/reload", data.token, body);
    if (!json?.["success"] || typeof json["checkoutUrl"] !== "string") {
      return { ok: false, error: reloadError(status, json) };
    }
    return {
      ok: true,
      reference: String(json["reference"] ?? ""),
      status: String(json["status"] ?? "PENDING"),
      checkoutUrl: json["checkoutUrl"],
    };
  });

/** Step 2: POST /api/v1/wallets/reload/confirm → credited balance. */
export const confirmWalletReload = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ token: z.string().max(4000).optional(), reference: z.string().min(1).max(100) }).parse(d),
  )
  .handler(async ({ data }): Promise<CbsReloadResult> => {
    const { status, json } = await cbsPost("/api/v1/wallets/reload/confirm", data.token, {
      reference: data.reference,
    });
    if (!json?.["success"]) return { ok: false, error: reloadError(status, json) };
    const bal = Number(json["availableBalance"]);
    return {
      ok: true,
      reference: String(json["reference"] ?? data.reference),
      status: String(json["status"] ?? ""),
      availableBalance: Number.isFinite(bal) ? bal : null,
    };
  });

/* ---------- Transfer to dependent ---------- */

export interface CbsTransferResult {
  ok: boolean;
  error?: string;
  availableBalance?: number | null;
}

/** POST /api/v1/dependents/:childId/transfer, then re-read the parent's balance from CBS. */
export const transferToDependent = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        token: z.string().min(1).max(4000),
        childId: z.string().min(1).max(100),
        amount: z.number().positive().max(10000),
        note: z.string().max(200).optional(),
        idempotencyKey: z.string().min(1).max(100),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<CbsTransferResult> => {
    const { status, json } = await cbsPost(
      `/api/v1/dependents/${encodeURIComponent(data.childId)}/transfer`,
      data.token,
      {
        amount: Math.round(data.amount * 100) / 100,
        currency: "MYR",
        note: data.note ?? "Pocket money",
        idempotencyKey: data.idempotencyKey,
      },
    );
    if (!json?.["success"]) {
      if (status === 0) return { ok: false, error: "Unable to connect to CBS. Please try again." };
      const msg = json?.["message"];
      return { ok: false, error: typeof msg === "string" && msg ? msg : "Transfer failed." };
    }
    let availableBalance: number | null = null;
    try {
      const br = await fetch(`${cbsBase()}/api/v1/users/me/balance`, {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      const bj = (await br.json()) as Record<string, unknown>;
      const n = Number(bj["availableBalance"] ?? bj["balance"]);
      availableBalance = Number.isFinite(n) ? n : null;
    } catch {
      /* keep null */
    }
    return { ok: true, availableBalance };
  });
