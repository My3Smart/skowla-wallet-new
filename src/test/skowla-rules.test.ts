import { describe, expect, it } from "vitest";
import { authenticate } from "@/lib/auth";
import {
  applyPayInvoices,
  applyPreOrder,
  applyTopUp,
  applyTransfer,
  applyShopPurchase,
  actions,
  caseSummary,
  complaintMeta,
  createInitialState,
  getState,
  setState,
  transportSummary,
} from "@/lib/store";

describe("demo login accounts", () => {
  it("lets the hardcoded teacher log in on the Teacher tab", () => {
    expect(authenticate("teacher", "farid@skowla.edu.my", "teacher123")?.role).toBe("teacher");
  });

  it("lets the hardcoded parent log in on the Parent tab", () => {
    expect(authenticate("parent", "sarah@skowla.my", "parent123")?.role).toBe("parent");
  });

  it("rejects a teacher account on the Parent tab and wrong passwords", () => {
    expect(authenticate("parent", "farid@skowla.edu.my", "teacher123")).toBeNull();
    expect(authenticate("teacher", "farid@skowla.edu.my", "wrong")).toBeNull();
  });
});

describe("case reports and transportation", () => {
  it("teacher home counts all teacher complaints and parent reports by status", () => {
    const summary = caseSummary(createInitialState().complaints);
    expect(summary).toEqual({ total: 6, pending: 3, inProgress: 2, solved: 1 });
  });

  it("adding a teacher complaint records the teacher, number, date and description", () => {
    setState(() => createInitialState());
    actions.addComplaint({
      student: "Nur Aina",
      form: "Form 4 Bestari",
      issue: "Missing book",
      description: "Science book missing",
      source: "teacher",
    });
    const complaint = getState().complaints[0];
    expect(complaint?.status).toBe("Pending");
    expect(complaint?.description).toBe("Science book missing");
    expect(complaint?.source).toBe("teacher");
    if (!complaint) throw new Error("Complaint missing");
    const meta = complaintMeta(complaint);
    expect(meta.reportedBy).toBe("Cikgu Farid bin Zakaria");
    expect(meta.reportNo).toMatch(/^RPT-\d{4}-0005$/);
    expect(Number.isNaN(Date.parse(meta.date))).toBe(false);
    actions.updateComplaint(complaint.id, "Resolved");
    expect(caseSummary(getState().complaints)).toEqual({
      total: 7,
      pending: 3,
      inProgress: 2,
      solved: 2,
    });
    setState(() => createInitialState());
  });

  it("parent drop-off displays zero bus trips while bus transport displays 48 trips", () => {
    expect(transportSummary("parent")).toEqual({ onTime: 0, total: 0 });
    expect(transportSummary("bus")).toEqual({ onTime: 48, total: 48 });
  });

  it("transport selection changes only the selected child", () => {
    setState(() => createInitialState());
    actions.setTransport("aliman", "parent");
    expect(getState().transport["aliman"]).toBe("parent");
    expect(getState().transport["alya"]).toBeUndefined();
    setState(() => createInitialState());
  });
});

describe("school shop purchases", () => {
  it("deducts the purchase from the wallet and records it under shop transactions", () => {
    const state = applyShopPurchase(createInitialState(), "Exercise Books", 5, 2);
    expect(state.walletBalance).toBe(475.5);
    expect(state.transactions[0]?.kind).toBe("shop");
    expect(state.transactions[0]?.amount).toBe(-10);
    expect(state.children[0]?.cardBalance).toBe(24);
  });

  it("rejects purchases that exceed the wallet balance", () => {
    expect(() => applyShopPurchase(createInitialState(), "School Uniform", 35, 15)).toThrow();
  });

  it("rejects non-finite prices and non-positive or fractional quantities", () => {
    for (const qty of [0, -1, 1.5, Infinity]) {
      expect(() => applyShopPurchase(createInitialState(), "Exercise Books", 5, qty)).toThrow();
    }
    expect(() => applyShopPurchase(createInitialState(), "Exercise Books", NaN, 1)).toThrow();
  });
});

describe("wallet rules", () => {
  it("top up adds to the family wallet", () => {
    const s = applyTopUp(createInitialState(), 50, "Maybank FPX");
    expect(s.walletBalance).toBe(535.5);
  });

  it("transfer moves money from wallet to the child's card", () => {
    const s = applyTransfer(createInitialState(), "alya", 10);
    expect(s.walletBalance).toBe(475.5);
    expect(s.children.find((c) => c.id === "alya")?.cardBalance).toBe(28.5);
  });

  it("transfer is refused when the wallet balance is too low", () => {
    expect(() => applyTransfer(createInitialState(), "alya", 1000)).toThrow();
  });

  it("canteen pre-order has no daily limit for parents, only the card balance", () => {
    // Aliman's daily limit is RM 6.00 but parents may order above it
    const ok = applyPreOrder(createInitialState(), "aliman", [
      { name: "Nasi Ayam Panggang", price: 6.5, qty: 1 },
    ]);
    expect(ok.children.find((c) => c.id === "aliman")?.cardBalance).toBe(17.5);
    // ...but the order still cannot exceed the child's card balance (RM 24.00)
    expect(() =>
      applyPreOrder(createInitialState(), "aliman", [
        { name: "Nasi Ayam Panggang", price: 6.5, qty: 4 },
      ]),
    ).toThrow();
  });

  it("paying fees deducts the wallet and marks invoices paid", () => {
    const s = applyPayInvoices(createInitialState(), ["i1", "i2"]);
    expect(s.walletBalance).toBe(365.5);
    expect(s.invoices.filter((i) => i.paid).map((i) => i.id)).toEqual(["i1", "i2", "i4"]);
  });
});

import { applyCbsFamily, createInitialState as freshState } from "@/lib/store";
describe("CBS family sync", () => {
  it("replaces demo children with the real CBS child only", () => {
    const s = applyCbsFamily(freshState(), [
      { childId: "c1", fullName: "Muhammad Alif Imran Bin Amar", userCode: "SKOOLA-STUDENT-1046", status: "ACTIVE" },
    ], null);
    expect(s.children.map((c) => c.name)).toEqual(["Muhammad Alif Imran Bin Amar"]);
    expect(s.walletBalance).toBe(0);
  });
});

import { applyConfirmedReload } from "@/lib/store";
import { describe as d2, expect as e2, it as i2 } from "vitest";
d2("CBS confirmed reload", () => {
  i2("uses the balance CBS returns", () => {
    const s = { walletBalance: 100, transactions: [] } as never;
    e2(applyConfirmedReload(s, 10, "FPX", 465).walletBalance).toBe(465);
  });
  i2("adds the amount when CBS returns no balance", () => {
    const s = { walletBalance: 100, transactions: [] } as never;
    e2(applyConfirmedReload(s, 10, "FPX", null).walletBalance).toBe(110);
  });
});
