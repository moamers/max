/**
 * The three transaction states, checked at the point they are written.
 *
 * "Needs a look" existed in the transaction editor but not in the add sheet,
 * so the same control offered two options in one place and three in another.
 * The spec (docs/design/15-attention-and-periods.md §1) says the user sets this
 * flag as well as Ravel, and the moment you are typing an unrecognised charge is
 * exactly when you would want to.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { addTransaction, requireUser, revalidatePath } = vi.hoisted(() => ({
  addTransaction: vi.fn(),
  requireUser: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/store", () => ({ addTransaction }));
vi.mock("@/lib/session", () => ({ requireUser }));
vi.mock("next/cache", () => ({ revalidatePath }));

import { createTransaction, type CreateTransactionInput } from "../actions";
import { USER_ATTENTION_REASON } from "@/lib/transactions";

const USER_ID = "11111111-1111-4111-8111-111111111111";

function draft(overrides: Partial<CreateTransactionInput> = {}): CreateTransactionInput {
  return {
    periodId: 4,
    kind: "weekly",
    category: "everyday",
    weekNumber: 2,
    merchant: "Sainsbury's",
    label: "",
    note: "",
    amount: 12.65,
    occurredOn: null,
    pending: false,
    needsAttention: false,
    attentionReason: null,
    rawImport: null,
    ...overrides,
  };
}

/** What `addTransaction` was actually asked to store. */
function stored() {
  return addTransaction.mock.calls[0][2];
}

beforeEach(() => {
  addTransaction.mockReset();
  addTransaction.mockResolvedValue(7);
  requireUser.mockResolvedValue({ id: USER_ID });
  revalidatePath.mockReset();
});

describe("a transaction can be flagged as it is written down", () => {
  it("stores the flag", async () => {
    await createTransaction(draft({ needsAttention: true }));
    expect(stored().needsAttention).toBe(true);
  });

  it("says who flagged it, so the flag is traceable", async () => {
    await createTransaction(draft({ needsAttention: true }));
    expect(stored().attentionReason).toBe(USER_ATTENTION_REASON);
  });

  it("leaves no reason behind on an ordinary row", async () => {
    await createTransaction(draft());
    expect(stored().needsAttention).toBe(false);
    expect(stored().attentionReason).toBeNull();
  });
});

describe("the three states are mutually exclusive", () => {
  // The database enforces this too (CHECK transactions_one_state); a row that
  // reached it as both would be a 500, not a validation message.
  it("a flagged row is not also pending", async () => {
    await createTransaction(draft({ pending: true, needsAttention: true }));
    expect(stored().pending).toBe(false);
    expect(stored().needsAttention).toBe(true);
  });

  it("pending still works on its own", async () => {
    await createTransaction(draft({ pending: true }));
    expect(stored().pending).toBe(true);
    expect(stored().needsAttention).toBe(false);
  });
});

describe("the period is the one the user was looking at", () => {
  it("writes into the period it was given, not a re-derived one", async () => {
    await createTransaction(draft({ periodId: 9 }));
    expect(addTransaction).toHaveBeenCalledWith(USER_ID, 9, expect.anything());
  });

  it("refuses a period that isn't theirs", async () => {
    addTransaction.mockResolvedValue(null);
    await expect(createTransaction(draft())).rejects.toThrow(/isn't yours/);
  });
});

describe("writes happen once, on Add it", () => {
  it("is one insert per save", async () => {
    await createTransaction(draft());
    expect(addTransaction).toHaveBeenCalledTimes(1);
  });

  it("keeps source words and screenshot provenance verbatim", async () => {
    await createTransaction(
      draft({
        merchant: "SAINSBURYS S/MKT ",
        label: "DXB-26 ",
        occurredOn: "2026-08-18",
        needsAttention: true,
        attentionReason: "Ravel was not sure about the amount.",
        rawImport: "SAINSBURYS S/MKT  £12.65",
      })
    );
    expect(stored()).toMatchObject({
      merchant: "SAINSBURYS S/MKT ",
      label: "DXB-26 ",
      occurredOn: "2026-08-18",
      attentionReason: "Ravel was not sure about the amount.",
      rawImport: "SAINSBURYS S/MKT  £12.65",
    });
  });
});
