"use server";

import { randomUUID } from "node:crypto";

import { Prisma, SessionStatus } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { PARTICIPANT_COOKIE_NAME, SUBMITTED_COOKIE_NAME } from "@/lib/cookies";
import { prisma } from "@/lib/prisma";
import { parseParticipantAnswers } from "@/lib/validation";

function redirectHome(params: Record<string, string>): never {
  const searchParams = new URLSearchParams(params);
  const query = searchParams.toString();
  redirect(query ? `/?${query}` : "/");
}

export async function submitParticipantAction(formData: FormData): Promise<void> {
  const parsedAnswers = parseParticipantAnswers(formData);

  if (!parsedAnswers.success) {
    redirectHome({ error: parsedAnswers.message });
  }

  const cookieStore = await cookies();

  if (cookieStore.get(SUBMITTED_COOKIE_NAME)) {
    redirectHome({
      error: "This browser session already submitted answers.",
    });
  }

  const openSession = await prisma.studySession.findFirst({
    where: { status: SessionStatus.OPEN },
    orderBy: { startedAt: "desc" },
  });

  if (!openSession) {
    redirectHome({ error: "Session is closed. Please wait for admin to open a new session." });
  }

  const participantKey = cookieStore.get(PARTICIPANT_COOKIE_NAME)?.value ?? randomUUID();

  try {
    await prisma.response.create({
      data: {
        sessionId: openSession.id,
        participantKey,
        answer1: parsedAnswers.data.answer1,
        answer2: parsedAnswers.data.answer2,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirectHome({ error: "Duplicate response detected for this browser session." });
    }

    redirectHome({ error: "Unable to save your response. Please try again." });
  }

  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };

  cookieStore.set(PARTICIPANT_COOKIE_NAME, participantKey, cookieOptions);
  cookieStore.set(SUBMITTED_COOKIE_NAME, openSession.id, cookieOptions);

  redirectHome({ success: "Your answers were submitted." });
}

