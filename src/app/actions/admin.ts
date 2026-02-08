"use server";

import { randomUUID } from "node:crypto";

import { SessionStatus } from "@prisma/client";
import { redirect } from "next/navigation";

import {
  clearAdminAuthCookie,
  getAdminPassword,
  isAdminAuthenticated,
  setAdminAuthCookie,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { parseRandomDataCount } from "@/lib/validation";

type RandomMode = "correlated" | "independent";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectAdmin(params: Record<string, string> = {}): never {
  const searchParams = new URLSearchParams(params);
  const query = searchParams.toString();
  redirect(query ? `/admin?${query}` : "/admin");
}

function redirectLogin(error?: string): never {
  if (error) {
    redirect(`/admin/login?error=${encodeURIComponent(error)}`);
  }

  redirect("/admin/login");
}

async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirectLogin("Please sign in again.");
  }
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function simulatedAnswer2(answer1: number, mode: RandomMode): number {
  if (mode === "independent") {
    return randomInt(0, 100);
  }

  const noise = randomInt(-14, 14);
  return clamp(Math.round(answer1 * 0.8 + 12 + noise), 0, 100);
}

export async function adminLoginAction(formData: FormData): Promise<void> {
  const submittedPassword = formString(formData, "password");

  if (!submittedPassword) {
    redirectLogin("Password is required.");
  }

  if (submittedPassword !== getAdminPassword()) {
    redirectLogin("Invalid admin password.");
  }

  await setAdminAuthCookie();
  redirect("/admin");
}

export async function adminLogoutAction(): Promise<void> {
  await clearAdminAuthCookie();
  redirect("/admin/login");
}

export async function startStudySessionAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const existingOpenSession = await prisma.studySession.findFirst({
    where: { status: SessionStatus.OPEN },
  });

  if (existingOpenSession) {
    redirectAdmin({ error: "Close the active session before starting a new one." });
  }

  const providedName = formString(formData, "name");
  const sessionName = providedName || `Session ${new Date().toLocaleString()}`;

  const created = await prisma.studySession.create({
    data: { name: sessionName, status: SessionStatus.OPEN },
  });

  redirectAdmin({ notice: "Session started.", sessionId: created.id });
}

export async function closeStudySessionAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const providedId = formString(formData, "sessionId");

  const target = providedId
    ? await prisma.studySession.findUnique({ where: { id: providedId } })
    : await prisma.studySession.findFirst({ where: { status: SessionStatus.OPEN } });

  if (!target) {
    redirectAdmin({ error: "No matching session was found." });
  }

  if (target.status === SessionStatus.CLOSED) {
    redirectAdmin({ error: "Session is already closed.", sessionId: target.id });
  }

  await prisma.studySession.update({
    where: { id: target.id },
    data: { status: SessionStatus.CLOSED, closedAt: new Date() },
  });

  redirectAdmin({ notice: "Session closed.", sessionId: target.id });
}

export async function generateRandomDataAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const sessionId = formString(formData, "sessionId");
  if (!sessionId) {
    redirectAdmin({ error: "Select a session first." });
  }

  const modeField = formString(formData, "mode");
  const mode: RandomMode = modeField === "independent" ? "independent" : "correlated";

  const countResult = parseRandomDataCount(formData);
  if (!countResult.success) {
    redirectAdmin({ error: countResult.message, sessionId });
  }

  const session = await prisma.studySession.findUnique({ where: { id: sessionId } });
  if (!session) {
    redirectAdmin({ error: "Session does not exist anymore." });
  }

  const rows = Array.from({ length: countResult.count }, () => {
    const answer1 = randomInt(1, 100);
    return {
      sessionId,
      participantKey: randomUUID(),
      answer1,
      answer2: simulatedAnswer2(answer1, mode),
    };
  });

  await prisma.response.createMany({ data: rows });

  redirectAdmin({
    notice: `Generated ${countResult.count} random responses (${mode}).`,
    sessionId,
  });
}

export async function clearSessionResponsesAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const sessionId = formString(formData, "sessionId");
  if (!sessionId) {
    redirectAdmin({ error: "Select a session to clear." });
  }

  await prisma.response.deleteMany({ where: { sessionId } });

  redirectAdmin({ notice: "Session responses cleared.", sessionId });
}

export async function deleteAllStudyDataAction(): Promise<void> {
  await requireAdmin();

  await prisma.$transaction([
    prisma.response.deleteMany(),
    prisma.studySession.deleteMany(),
  ]);

  redirectAdmin({ notice: "All sessions and responses were deleted." });
}
