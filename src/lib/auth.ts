import crypto from "crypto";
import { getDb } from "@/lib/mongodb";

type UserDocument = {
  _id?: unknown;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: Date;
  updatedAt: Date;
};

type ResetTokenDocument = {
  _id?: unknown;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
};

const USERS_COLLECTION = "users";
const RESET_COLLECTION = "password_resets";

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

const createPasswordHash = (password: string) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
};

const verifyPassword = (password: string, salt: string, hash: string) => {
  const computed = crypto.scryptSync(password, salt, 64).toString("hex");
  const hashBuffer = Buffer.from(hash, "hex");
  const computedBuffer = Buffer.from(computed, "hex");
  if (hashBuffer.length !== computedBuffer.length) return false;
  return crypto.timingSafeEqual(hashBuffer, computedBuffer);
};

export const createUser = async (email: string, password: string) => {
  const normalized = normalizeEmail(email);
  const db = await getDb();
  const users = db.collection<UserDocument>(USERS_COLLECTION);
  const existing = await users.findOne({ email: normalized });
  if (existing) {
    return { ok: false, reason: "exists" } as const;
  }
  const { salt, hash } = createPasswordHash(password);
  const now = new Date();
  await users.insertOne({
    email: normalized,
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: now,
    updatedAt: now,
  });
  return { ok: true } as const;
};

export const authenticateUser = async (email: string, password: string) => {
  const normalized = normalizeEmail(email);
  const db = await getDb();
  const users = db.collection<UserDocument>(USERS_COLLECTION);
  const user = await users.findOne({ email: normalized });
  if (!user) return { ok: false } as const;
  const valid = verifyPassword(password, user.passwordSalt, user.passwordHash);
  return { ok: valid } as const;
};

export const changeUserPassword = async (
  email: string,
  currentPassword: string,
  nextPassword: string
) => {
  const normalized = normalizeEmail(email);
  const db = await getDb();
  const users = db.collection<UserDocument>(USERS_COLLECTION);
  const user = await users.findOne({ email: normalized });
  if (!user) return { ok: false, reason: "not_found" } as const;
  const valid = verifyPassword(currentPassword, user.passwordSalt, user.passwordHash);
  if (!valid) return { ok: false, reason: "invalid" } as const;

  const { salt, hash } = createPasswordHash(nextPassword);
  await users.updateOne(
    { email: normalized },
    { $set: { passwordSalt: salt, passwordHash: hash, updatedAt: new Date() } }
  );
  return { ok: true } as const;
};

export const createPasswordReset = async (email: string) => {
  const normalized = normalizeEmail(email);
  const db = await getDb();
  const users = db.collection<UserDocument>(USERS_COLLECTION);
  const user = await users.findOne({ email: normalized });
  if (!user) return null;

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const resets = db.collection<ResetTokenDocument>(RESET_COLLECTION);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60);
  await resets.insertOne({
    email: normalized,
    tokenHash,
    createdAt: now,
    expiresAt,
  });

  return token;
};

export const resetPasswordWithToken = async (token: string, newPassword: string) => {
  const db = await getDb();
  const resets = db.collection<ResetTokenDocument>(RESET_COLLECTION);
  const tokenHash = hashToken(token);
  const resetRecord = await resets.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  });

  if (!resetRecord) {
    return { ok: false, reason: "invalid" } as const;
  }

  const users = db.collection<UserDocument>(USERS_COLLECTION);
  const { salt, hash } = createPasswordHash(newPassword);
  await users.updateOne(
    { email: resetRecord.email },
    { $set: { passwordSalt: salt, passwordHash: hash, updatedAt: new Date() } }
  );

  await resets.deleteMany({ email: resetRecord.email });
  return { ok: true } as const;
};
