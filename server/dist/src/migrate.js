"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const pg_1 = require("pg");
async function migrate() {
    if (!process.env.DATABASE_URL)
        throw new Error("DATABASE_URL is required");
    const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL === "require" ? { rejectUnauthorized: true } : undefined });
    const file = node_path_1.default.join(process.cwd(), "server", "migrations", "001_playra_monolith.sql");
    const sql = await (0, promises_1.readFile)(file, "utf8");
    await pool.query(sql);
    await pool.end();
    console.log("Playra migrations complete");
}
migrate().catch((error) => {
    console.error(error);
    process.exit(1);
});
