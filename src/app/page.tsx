import Link from "next/link";
import { SessionStatus } from "@prisma/client";
import { cookies } from "next/headers";

import { submitParticipantAction } from "@/app/actions/participant";
import { SUBMITTED_COOKIE_NAME } from "@/lib/cookies";
import { prisma } from "@/lib/prisma";

import styles from "./page.module.css";

type HomePageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();

  const activeSession = await prisma.studySession.findFirst({
    where: { status: SessionStatus.OPEN },
    orderBy: { startedAt: "desc" },
  });

  const hasSubmitted = Boolean(cookieStore.get(SUBMITTED_COOKIE_NAME));
  const canSubmit = Boolean(activeSession) && !hasSubmitted;

  const statusMessage =
    params.success ||
    params.error ||
    (hasSubmitted
      ? "This browser session already submitted a response."
      : activeSession
        ? `Active session: ${activeSession.name}`
        : "No session is currently open.");

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <header className={styles.header}>
          <h1>Priming Effect Study</h1>
          <p>Answer both questions with whole numbers only.</p>
        </header>

        <p className={params.error ? styles.statusError : styles.statusInfo}>{statusMessage}</p>

        <form action={submitParticipantAction} className={styles.form}>
          <fieldset disabled={!canSubmit} className={styles.fieldset}>
            <label className={styles.field}>
              <span>1. Enter a number between 1 and 100</span>
              <input
                name="answer1"
                type="number"
                min={1}
                max={100}
                step={1}
                placeholder="1 to 100"
                required
              />
            </label>

            <label className={styles.field}>
              <span>2. How many African countries are members of the United Nations?</span>
              <input
                name="answer2"
                type="number"
                min={0}
                max={1000}
                step={1}
                placeholder="0 to 1000"
                required
              />
            </label>
          </fieldset>

          <button type="submit" disabled={!canSubmit} className={styles.submit}>
            Submit Answers
          </button>
        </form>

        <footer className={styles.footer}>
          <p>Only one submission is allowed per browser session.</p>
          <Link href="/admin/login">Admin Mode</Link>
        </footer>
      </section>
    </main>
  );
}
