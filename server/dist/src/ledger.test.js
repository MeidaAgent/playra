"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ledger_1 = require("./ledger");
describe("ledger primitives", () => {
    test("allocates coin debits FIFO", () => {
        const result = (0, ledger_1.allocateFifo)([
            { id: 2, amount: "30", createdAt: new Date("2026-01-02T00:00:00Z") },
            { id: 1, amount: "40", createdAt: new Date("2026-01-01T00:00:00Z") },
        ], "50");
        expect(result.used).toEqual([{ id: 1, amount: "40" }, { id: 2, amount: "10" }]);
        expect(result.remainder).toBe("0");
    });
    test("rejects negative balances", () => {
        expect(() => (0, ledger_1.ensureNonNegativeBalance)([{ delta: "-5" }, { delta: "3" }])).toThrow("Ledger balance cannot be negative");
    });
});
