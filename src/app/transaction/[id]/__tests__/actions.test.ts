import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateTransaction, deleteTransaction, requireUser, revalidatePath, getTransactionDetail } = vi.hoisted(() => ({
  updateTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  requireUser: vi.fn(),
  revalidatePath: vi.fn(),
  getTransactionDetail: vi.fn(),
}));

vi.mock("@/lib/store", () => ({ updateTransaction, deleteTransaction }));
vi.mock("@/lib/session", () => ({ requireUser }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("../data", () => ({ getTransactionDetail }));

import { saveTransaction, type SaveTransactionInput } from "../actions";

const USER_ID = "11111111-1111-4111-8111-111111111111";

function input(overrides: Partial<SaveTransactionInput> = {}): SaveTransactionInput {
  return {
    merchant: "SAINSBURYS S/MKT ",
    occurredOn: "2026-08-18",
    category: "everyday",
    label: "DXB-26 ",
    note: "note",
    amount: 12.65,
    pending: false,
    needsAttention: true,
    attentionReason: "Max was not sure about the amount.",
    rawImport: "SAINSBURYS S/MKT  £12.65",
    ...overrides,
  };
}

beforeEach(() => {
  updateTransaction.mockReset();
  updateTransaction.mockResolvedValue(true);
  requireUser.mockReset();
  requireUser.mockResolvedValue({ id: USER_ID });
  revalidatePath.mockReset();
});
describe("screenshot draft persistence on Save", () => {
  it("writes once and keeps source words and provenance verbatim", async () => {
    await saveTransaction(7, "weekly", 4, 2, input());
    expect(updateTransaction).toHaveBeenCalledTimes(1);
    expect(updateTransaction).toHaveBeenCalledWith(
      USER_ID,
      7,
      expect.objectContaining({
        merchant: "SAINSBURYS S/MKT ",
        label: "DXB-26 ",
        occurredOn: "2026-08-18",
        attentionReason: "Max was not sure about the amount.",
        rawImport: "SAINSBURYS S/MKT  £12.65",
      })
    );
  });

  it("rejects a date that was not validated", async () => {
    await expect(saveTransaction(7, "weekly", 4, 2, input({ occurredOn: "2026-02-31" }))).rejects.toThrow(
      "Check the date"
    );
    expect(updateTransaction).not.toHaveBeenCalled();
  });
});
