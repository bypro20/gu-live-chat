import { jwtVerify } from "jose";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "RESELLER";
  referralCode?: string;
  agencyName?: string;
};

export function getJwtSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET ortam değişkeni production ortamında zorunludur");
  }
  return new TextEncoder().encode(secret || "growpanel-dev-secret-local-only");
}

export async function verifySessionToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload as SessionUser;
  } catch {
    return null;
  }
}
