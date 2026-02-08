import Link from "next/link";
import { SessionStatus } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { submitParticipantAction } from "@/app/actions/participant";
import { SUBMITTED_COOKIE_NAME } from "@/lib/cookies";
import { prisma } from "@/lib/prisma";
import { parseParticipantAnswer1 } from "@/lib/validation";

import styles from "../page.module.css";

type QuestionTwoPageProps = {
  searchParams: Promise<{
    answer1?: string;
    error?: string;
  }>;
};

export default async function QuestionTwoPage({ searchParams }: QuestionTwoPageProps) {
  const params = await searchParams;
  const parsedAnswer1 = parseParticipantAnswer1(params.answer1 ?? "");

  if (!parsedAnswer1.success) {
    const redirectParams = new URLSearchParams({ error: "Please complete question 1 first." });
    redirect(`/?${redirectParams.toString()}`);
  }

  const cookieStore = await cookies();

  const activeSession = await prisma.studySession.findFirst({
    where: { status: SessionStatus.OPEN },
    orderBy: { startedAt: "desc" },
  });

  const hasSubmitted = Boolean(cookieStore.get(SUBMITTED_COOKIE_NAME));
  const canSubmit = Boolean(activeSession) && !hasSubmitted;

  const statusMessage =
    params.error ||
    (hasSubmitted
      ? "This browser session already submitted a response."
      : activeSession
        ? `Step 2 of 2. Your first answer is ${parsedAnswer1.answer1}.`
        : "No session is currently open.");

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <header className={styles.header}>
          <h1>Number Estimation Survey</h1>
          <p>Step 2 of 2: finish your response.</p>
        </header>

        <p className={params.error ? styles.statusError : styles.statusInfo}>{statusMessage}</p>

        <form action={submitParticipantAction} className={styles.form}>
          <fieldset disabled={!canSubmit} className={styles.fieldset}>
            <input name="answer1" type="hidden" value={parsedAnswer1.answer1} />

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
          <Link href="/">Back to Question 1</Link>
        </footer>
      </section>
    </main>
  );
}
