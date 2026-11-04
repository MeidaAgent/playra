"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allocateFifo = allocateFifo;
exports.ensureNonNegativeBalance = ensureNonNegativeBalance;
function allocateFifo(lots, amount) {
    const remaining = BigInt(amount);
    let left = remaining;
    const used = [];
    const ordered = [...lots].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id - b.id);
    for (const lot of ordered) {
        if (left <= 0n)
            break;
        const available = BigInt(lot.amount);
        const take = available < left ? available : left;
        if (take > 0n)
            used.push({ id: lot.id, amount: take.toString() });
        left -= take;
    }
    return { used, remainder: left.toString() };
}
function ensureNonNegativeBalance(entries, expected = "0") {
    const total = entries.reduce((sum, row) => sum + BigInt(row.delta), 0n);
    if (total < 0n)
        throw new Error("Ledger balance cannot be negative");
    return expected === "0" ? total.toString() : total.toString();
}
