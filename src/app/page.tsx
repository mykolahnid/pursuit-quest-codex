import Link from "next/link";
import { SessionStatus } from "@prisma/client";
import { cookies } from "next/headers";

import { continueToQuestionTwoAction } from "@/app/actions/participant";
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
          <h1>Number Survey</h1>
        </header>

        <p className={params.error ? styles.statusError : styles.statusInfo}>{statusMessage}</p>

        <form action={continueToQuestionTwoAction} className={styles.form}>
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

          </fieldset>

          <button type="submit" disabled={!canSubmit} className={styles.submit}>
            Continue
          </button>
        </form>

        <footer className={styles.footer}>
          <Link href="/admin/login">Admin Mode</Link>
        </footer>
      </section>
    </main>
  );
}
