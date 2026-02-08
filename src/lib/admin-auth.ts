import { createHash, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { ADMIN_COOKIE_NAME } from "@/lib/cookies";

const ADMIN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8;

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD?.trim() || "changeme-admin";
}

function adminTokenFromPassword(password: string): string {
  return createHash("sha256")
    .update(`priming-admin:${password}`)
    .digest("hex");
}

function safeEquals(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!cookieValue) {
    return false;
  }

  const expected = adminTokenFromPassword(getAdminPassword());
  return safeEquals(cookieValue, expected);
}

export async function setAdminAuthCookie(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, adminTokenFromPassword(getAdminPassword()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearAdminAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

