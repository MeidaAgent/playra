"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const app_1 = require("./app");
async function main() {
    if (!process.env.DATABASE_URL)
        throw new Error("DATABASE_URL is required");
    const pool = new pg_1.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.PGSSL === "require" ? { rejectUnauthorized: true } : undefined,
    });
    const app = await (0, app_1.buildApp)({ pool });
    const port = Number(process.env.PORT ?? 4000);
    await app.listen({ host: "0.0.0.0", port });
    console.log(`Playra API listening on port ${port}`);
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
