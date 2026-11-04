"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const ethers_1 = require("ethers");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const node_crypto_1 = require("node:crypto");
const zod_1 = require("zod");
const config_1 = require("./config");
const ledger_1 = require("./ledger");
const memoryUsers = [];
const memoryFarms = new Map();
const memoryLedger = [];
const memoryWaitlist = [];
const challenges = new Map();
async function buildApp(options = {}) {
    const app = (0, fastify_1.default)({ logger: false });
    await app.register(cors_1.default, { origin: true });
    const pool = options.pool;
    const jwtSecret = options.jwtSecret ?? process.env.JWT_SECRET;
    if (!jwtSecret)
        throw new Error("JWT_SECRET is required to start the API");
    const jwtSigningSecret = jwtSecret;
    const transactionHeader = (request) => {
        const value = request.headers["x-transaction-id"];
        if (typeof value !== "string" || value.length < 8 || value.length > 128)
            return undefined;
        return value;
    };
    const getUser = async (address) => {
        const normalized = address.toLowerCase();
        if (pool) {
            const found = await pool.query("SELECT id, address FROM users WHERE lower(address)=$1", [normalized]);
            if (found.rowCount)
                return found.rows[0];
            const inserted = await pool.query("INSERT INTO users(address) VALUES($1) ON CONFLICT(address) DO UPDATE SET updated_at=now() RETURNING id,address", [normalized]);
            return inserted.rows[0];
        }
        const found = memoryUsers.find((user) => user.address === normalized);
        if (found)
            return found;
        const user = { id: memoryUsers.length + 1, address: normalized };
        memoryUsers.push(user);
        return user;
    };
    const authUser = async (request) => {
        const authorization = request.headers.authorization;
        if (!authorization?.startsWith("Bearer "))
            throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
        const payload = jsonwebtoken_1.default.verify(authorization.slice(7), jwtSecret);
        if (!payload.address)
            throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
        return getUser(payload.address);
    };
    app.get("/health", async () => ({ ok: true, economy: config_1.ECONOMY }));
    app.post("/auth/challenge", async (request, reply) => {
        const parsed = zod_1.z.object({ address: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/) }).safeParse(request.body);
        if (!parsed.success)
            return reply.code(400).send({ message: "Invalid wallet address" });
        const address = parsed.data.address.toLowerCase();
        const nonce = (0, node_crypto_1.randomBytes)(16).toString("hex");
        const challenge = `Playra login ${nonce}`;
        challenges.set(address, challenge);
        return { challenge };
    });
    app.post("/login", async (request, reply) => appAuth(request, reply));
    app.post("/auth/login", async (request, reply) => appAuth(request, reply));
    app.post("/signup", async (request, reply) => appAuth(request, reply));
    app.post("/auth/signup", async (request, reply) => appAuth(request, reply));
    async function appAuth(request, reply) {
        const parsed = zod_1.z.object({ address: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/), signature: zod_1.z.string().min(20), transactionId: zod_1.z.string().optional() }).safeParse(request.body);
        if (!parsed.success)
            return reply.code(400).send({ message: "Invalid login payload" });
        const address = parsed.data.address.toLowerCase();
        const challenge = challenges.get(address) ?? parsed.data.address;
        try {
            const recovered = ethers_1.ethers.utils.verifyMessage(challenge, parsed.data.signature).toLowerCase();
            if (recovered !== address)
                return reply.code(401).send({ message: "Invalid signature" });
        }
        catch {
            return reply.code(401).send({ message: "Invalid signature" });
        }
        const user = await getUser(address);
        const token = jsonwebtoken_1.default.sign({ address, userId: user.id, userAccess: { withdraw: true, createFarm: true, sync: true, mintCollectible: false } }, jwtSigningSecret, { expiresIn: "24h" });
        const tokenHash = (0, node_crypto_1.createHash)("sha256").update(token).digest("hex");
        if (pool)
            await pool.query("INSERT INTO sessions(user_id,address,token_hash,expires_at) VALUES($1,$2,$3,now()+interval '24 hours')", [user.id, address, tokenHash]);
        challenges.delete(address);
        return { token };
    }
    app.post("/session", async (request, reply) => {
        let user;
        try {
            user = await authUser(request);
        }
        catch {
            return reply.code(401).send({ message: "Session expired" });
        }
        const farmResult = pool
            ? await pool.query("SELECT id,state,version FROM farms WHERE owner_id=$1 ORDER BY id DESC LIMIT 1", [user.id])
            : null;
        const farm = farmResult?.rowCount ? farmResult.rows[0] : { id: user.id, state: memoryFarms.get(user.id)?.state ?? {}, version: memoryFarms.get(user.id)?.version ?? 0 };
        return { verified: true, farmId: String(farm.id), game: farm.state ?? {}, sessionId: `${user.id}-${farm.version ?? 0}`, deviceTrackerId: "", announcements: {}, purchases: [], prices: { sfl: { usd: 0, timestamp: Date.now() } }, totalHelpedToday: 0 };
    });
    app.post("/autosave/:farmId", async (request, reply) => {
        let user;
        try {
            user = await authUser(request);
        }
        catch {
            return reply.code(401).send({ message: "Session expired" });
        }
        const params = zod_1.z.object({ farmId: zod_1.z.coerce.number().int().positive() }).safeParse(request.params);
        if (!params.success)
            return reply.code(400).send({ message: "Invalid farm id" });
        const body = zod_1.z.object({ actions: zod_1.z.array(zod_1.z.object({ type: zod_1.z.string().min(1), createdAt: zod_1.z.string().or(zod_1.z.date()).optional() }).passthrough()).max(500), stateHash: zod_1.z.record(zod_1.z.string()).optional() }).safeParse(request.body);
        if (!body.success)
            return reply.code(400).send({ message: "Invalid autosave payload" });
        const transactionId = transactionHeader(request);
        if (!transactionId)
            return reply.code(400).send({ message: "X-Transaction-ID required" });
        const economicActions = body.data.actions.filter((action) => /coin|pyra|gem|reward/i.test(`${action.type}`));
        const idempotencyKey = (0, node_crypto_1.createHash)("sha256").update(transactionId).digest("hex");
        let state = {};
        if (pool) {
            await pool.query("BEGIN");
            try {
                for (const action of economicActions) {
                    await pool.query("INSERT INTO ledger(user_id,asset,delta,provenance,idempotency_key) VALUES($1,'COIN',0,$2,$3) ON CONFLICT(user_id,idempotency_key) DO NOTHING", [user.id, JSON.stringify(action), `${idempotencyKey}:${action.type}`]);
                }
                const saved = await pool.query("INSERT INTO farms(owner_id,state,version) VALUES($1,$2,1) ON CONFLICT(owner_id) DO UPDATE SET state=EXCLUDED.state,version=farms.version+1,updated_at=now() RETURNING state,version", [user.id, JSON.stringify(body.data)]);
                await pool.query("COMMIT");
                state = saved.rows[0].state;
            }
            catch (error) {
                await pool.query("ROLLBACK");
                throw error;
            }
        }
        else {
            const previous = memoryFarms.get(user.id)?.version ?? 0;
            state = body.data;
            memoryFarms.set(user.id, { state, version: previous + 1 });
        }
        return { verified: true, farm: state, changeset: {}, announcements: {}, processedActions: body.data.actions.length };
    });
    app.get("/visit/:farmId", async (request, reply) => {
        const parsed = zod_1.z.object({ farmId: zod_1.z.coerce.number().int().positive() }).safeParse(request.params);
        if (!parsed.success)
            return reply.code(400).send({ message: "Invalid farm id" });
        let user;
        try {
            user = await authUser(request);
        }
        catch {
            user = undefined;
        }
        if (!user)
            return reply.code(401).send({ message: "Login required to visit" });
        if (pool) {
            const result = await pool.query("SELECT state FROM farms WHERE owner_id=$1", [user.id]);
            return result.rowCount ? { farm: result.rows[0].state, readonly: true } : { farm: {}, readonly: true };
        }
        return { farm: memoryFarms.get(user.id)?.state ?? {}, readonly: true };
    });
    app.post("/waitlist", async (request, reply) => {
        const parsed = zod_1.z.object({ address: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(), email: zod_1.z.string().email().optional(), metadata: zod_1.z.record(zod_1.z.unknown()).optional() }).refine((value) => value.address || value.email, "address or email required").safeParse(request.body);
        if (!parsed.success)
            return reply.code(400).send({ message: "Invalid waitlist payload" });
        const { address, email, metadata = {} } = parsed.data;
        if (pool) {
            await pool.query("INSERT INTO waitlist(address,email,metadata) VALUES($1,$2,$3) ON CONFLICT DO NOTHING", [address?.toLowerCase() ?? null, email?.toLowerCase() ?? null, JSON.stringify(metadata)]);
        }
        else {
            if (!memoryWaitlist.some((row) => row.address === address?.toLowerCase() || row.email === email?.toLowerCase()))
                memoryWaitlist.push({ address: address?.toLowerCase(), email: email?.toLowerCase(), metadata });
        }
        return { joined: true };
    });
    app.post("/convert", async (request, reply) => {
        let user;
        try {
            user = await authUser(request);
        }
        catch {
            return reply.code(401).send({ message: "Unauthorized" });
        }
        const body = zod_1.z.object({ amount: zod_1.z.string().regex(/^\d+(\.\d{1,8})?$/), sourceAsset: zod_1.z.enum(["COIN", "PYRA"]), idempotencyKey: zod_1.z.string().min(8).max(128) }).safeParse(request.body);
        if (!body.success)
            return reply.code(400).send({ message: "Invalid conversion payload" });
        if (body.data.sourceAsset !== "COIN")
            return reply.code(400).send({ message: "Only COIN conversion is available" });
        const amount = BigInt(body.data.amount.split(".")[0]);
        if (amount <= 0n || amount > BigInt(config_1.ECONOMY.CONVERT_DAILY_CAP))
            return reply.code(400).send({ message: "Amount outside conversion limits" });
        const targetAmount = amount / BigInt(config_1.ECONOMY.COIN_TO_PYRA_RATE);
        if (targetAmount <= 0n)
            return reply.code(400).send({ message: "Amount below conversion minimum" });
        if (pool) {
            await pool.query("BEGIN");
            try {
                const existing = await pool.query("SELECT id,target_amount,status FROM convert_transactions WHERE user_id=$1 AND idempotency_key=$2", [user.id, body.data.idempotencyKey]);
                if (existing.rowCount) {
                    await pool.query("COMMIT");
                    return { idempotent: true, ...existing.rows[0] };
                }
                await pool.query("INSERT INTO ledger(user_id,asset,delta,provenance,idempotency_key) VALUES($1,'COIN',$2,$3,$4)", [user.id, `-${amount}`, JSON.stringify({ type: "convert", target: "PYRA" }), `${body.data.idempotencyKey}:source`]);
                await pool.query("INSERT INTO ledger(user_id,asset,delta,provenance,idempotency_key) VALUES($1,'PYRA',$2,$3,$4)", [user.id, targetAmount.toString(), JSON.stringify({ type: "convert", source: "COIN" }), `${body.data.idempotencyKey}:target`]);
                await pool.query("INSERT INTO convert_transactions(user_id,idempotency_key,source_asset,target_asset,source_amount,target_amount,status) VALUES($1,$2,'COIN','PYRA',$3,$4,'completed')", [user.id, body.data.idempotencyKey, amount.toString(), targetAmount.toString()]);
                await pool.query("COMMIT");
            }
            catch (error) {
                await pool.query("ROLLBACK");
                throw error;
            }
        }
        else {
            const debitLot = { id: 1, amount: amount.toString(), createdAt: new Date() };
            const allocation = (0, ledger_1.allocateFifo)([debitLot], amount.toString());
            if (allocation.remainder !== "0")
                throw Object.assign(new Error("Insufficient balance"), { statusCode: 400 });
            memoryLedger.push({ id: memoryLedger.length + 1, userId: user.id, asset: "COIN", delta: `-${amount}`, createdAt: new Date() });
            memoryLedger.push({ id: memoryLedger.length + 2, userId: user.id, asset: "PYRA", delta: targetAmount.toString(), createdAt: new Date() });
        }
        return { status: "completed", sourceAmount: amount.toString(), targetAmount: targetAmount.toString(), rate: config_1.ECONOMY.COIN_TO_PYRA_RATE };
    });
    app.post("/withdrawals", async (request, reply) => {
        let user;
        try {
            user = await authUser(request);
        }
        catch {
            return reply.code(401).send({ message: "Unauthorized" });
        }
        const body = zod_1.z.object({ asset: zod_1.z.literal("PYRA"), amount: zod_1.z.string().regex(/^\d+(\.\d{1,8})?$/), destination: zod_1.z.string().min(3).max(256), idempotencyKey: zod_1.z.string().min(8).max(128) }).safeParse(request.body);
        if (!body.success)
            return reply.code(400).send({ message: "Invalid withdrawal payload" });
        const amount = BigInt(body.data.amount.split(".")[0]);
        if (amount < BigInt(config_1.ECONOMY.WITHDRAW_MINIMUM) || amount > BigInt(config_1.ECONOMY.WITHDRAW_DAILY_CAP))
            return reply.code(400).send({ message: "Amount outside withdrawal limits" });
        if (pool) {
            await pool.query("BEGIN");
            try {
                const existing = await pool.query("SELECT id,status,queue_position FROM withdrawals WHERE user_id=$1 AND idempotency_key=$2", [user.id, body.data.idempotencyKey]);
                if (existing.rowCount) {
                    await pool.query("COMMIT");
                    return { idempotent: true, ...existing.rows[0] };
                }
                await pool.query("INSERT INTO ledger(user_id,asset,delta,provenance,idempotency_key) VALUES($1,'PYRA',$2,$3,$4)", [user.id, `-${amount}`, JSON.stringify({ type: "withdrawal", destination: body.data.destination }), `${body.data.idempotencyKey}:debit`]);
                const queue = await pool.query("SELECT count(*)::int AS count FROM withdrawals WHERE status='queued'");
                const position = Number(queue.rows[0].count) + 1;
                await pool.query("INSERT INTO withdrawals(user_id,idempotency_key,asset,amount,destination,status,queue_position) VALUES($1,$2,'PYRA',$3,$4,'queued',$5)", [user.id, body.data.idempotencyKey, amount.toString(), body.data.destination, position]);
                await pool.query("COMMIT");
                return { status: "queued", queuePosition: position, policy: config_1.ECONOMY.WITHDRAW_QUEUE };
            }
            catch (error) {
                await pool.query("ROLLBACK");
                throw error;
            }
        }
        return { status: "queued", queuePosition: 1, policy: config_1.ECONOMY.WITHDRAW_QUEUE };
    });
    app.get("/economy/config", async () => config_1.ECONOMY);
    return app;
}
