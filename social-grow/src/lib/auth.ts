import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import {
  getJwtSecretKey,
  verifySessionToken,
  type SessionUser,
} from "./session-token";

export type { SessionUser };

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createToken(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getJwtSecretKey());
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("grow_session")?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getUserFromDb(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { reseller: true },
  });
}

export function generateReferralCode(name: string) {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4)
    .padEnd(4, "X");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${rand}`;
}
