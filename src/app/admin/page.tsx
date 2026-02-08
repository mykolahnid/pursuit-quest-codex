import Link from "next/link";
import { SessionStatus } from "@prisma/client";
import { redirect } from "next/navigation";

import {
  adminLogoutAction,
  clearSessionResponsesAction,
  closeStudySessionAction,
  deleteAllStudyDataAction,
  generateRandomDataAction,
  startStudySessionAction,
} from "@/app/actions/admin";
import { AdminChart } from "@/components/AdminChart";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  correlationInterpretation,
  mean,
  pearsonCorrelation,
  pearsonCorrelationSignificance,
  simpleRegression,
} from "@/lib/stats";

import styles from "./admin.module.css";

type AdminPageProps = {
  searchParams: Promise<{
    sessionId?: string;
    notice?: string;
    error?: string;
  }>;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatValue(value: number | null, digits = 3): string {
  if (value === null || Number.isNaN(value)) {
    return "N/A";
  }

  return value.toFixed(digits);
}

function formatPValue(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "N/A";
  }

  if (value > 0 && value < 0.0001) {
    return "< 0.0001";
  }

  return value.toFixed(4);
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const params = await searchParams;

  const sessions = await prisma.studySession.findMany({
    orderBy: { startedAt: "desc" },
    include: {
      _count: { select: { responses: true } },
    },
  });

  const openSession = sessions.find((session) => session.status === SessionStatus.OPEN) ?? null;

  const selectedSessionId =
    typeof params.sessionId === "string" && sessions.some((session) => session.id === params.sessionId)
      ? params.sessionId
      : sessions[0]?.id;

  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null;

  const selectedResponses = selectedSession
    ? await prisma.response.findMany({
        where: { sessionId: selectedSession.id },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const answerPairs = selectedResponses.map((response) => ({
    answer1: response.answer1,
    answer2: response.answer2,
  }));

  const sortedChartResponses = [...selectedResponses].sort((left, right) => left.answer1 - right.answer1);
  const answer1Values = sortedChartResponses.map((response) => response.answer1);
  const answer2Values = sortedChartResponses.map((response) => response.answer2);
  const labels = sortedChartResponses.map((_, index) => `Person ${index + 1}`);

  const avgAnswer1 = mean(answer1Values);
  const avgAnswer2 = mean(answer2Values);
  const correlation = pearsonCorrelation(answerPairs);
  const correlationSignificance = pearsonCorrelationSignificance(answerPairs);
  const regression = simpleRegression(answerPairs);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.header}>
          <div className={styles.headerTitle}>
            <h1>Priming Study Admin</h1>
            <p>Manage sessions, inspect responses, and evaluate correlation.</p>
          </div>
          <div>
            {openSession ? (
              <span className={styles.statusBadgeOpen}>Open: {openSession.name}</span>
            ) : (
              <span className={styles.statusBadgeClosed}>No Active Session</span>
            )}
          </div>
        </section>

        {params.notice ? <p className={styles.notice}>{params.notice}</p> : null}
        {params.error ? <p className={styles.error}>{params.error}</p> : null}

        <section className={styles.grid}>
          <article className={`${styles.panel} ${styles.panelActions}`}>
            <h2>Session Controls</h2>

            <div className={styles.actions}>
              <form action={startStudySessionAction} className={styles.actionForm}>
                <label>
                  Start New Session (optional name)
                  <input name="name" type="text" placeholder="e.g., Session A" maxLength={80} />
                </label>
                <button type="submit">Start Session</button>
              </form>

              <form action={closeStudySessionAction} className={styles.actionForm}>
                <input type="hidden" name="sessionId" value={openSession?.id ?? ""} />
                <button type="submit" className={styles.secondaryButton} disabled={!openSession}>
                  Close Active Session
                </button>
              </form>

              <form action={generateRandomDataAction} className={styles.actionForm}>
                <input type="hidden" name="sessionId" value={selectedSession?.id ?? ""} />
                <label>
                  Random Rows
                  <input name="count" type="number" min={1} max={1000} step={1} defaultValue="25" />
                </label>
                <label>
                  Random Mode
                  <select name="mode" defaultValue="correlated">
                    <option value="correlated">Correlated</option>
                    <option value="independent">Independent</option>
                  </select>
                </label>
                <button type="submit" disabled={!selectedSession}>
                  Generate Test Data
                </button>
              </form>

              <form action={clearSessionResponsesAction} className={styles.actionForm}>
                <input type="hidden" name="sessionId" value={selectedSession?.id ?? ""} />
                <button type="submit" className={styles.dangerButton} disabled={!selectedSession}>
                  Clear Selected Session Data
                </button>
              </form>

              <form action={deleteAllStudyDataAction} className={styles.actionForm}>
                <button type="submit" className={styles.dangerButton}>
                  Delete All Sessions + Data
                </button>
              </form>

              <form action={adminLogoutAction} className={styles.actionForm}>
                <button type="submit" className={styles.logout}>
                  Logout
                </button>
              </form>
            </div>
          </article>

          <article className={`${styles.panel} ${styles.panelAnalytics}`}>
            <h2>Selected Session Analytics</h2>

            {selectedSession ? (
              <>
                <p>
                  <strong>{selectedSession.name}</strong> ({selectedSession.status.toLowerCase()}) -{" "}
                  {selectedResponses.length} responses
                </p>

                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <p className={styles.statLabel}>Average Answer 1</p>
                    <p className={styles.statValue}>{formatValue(avgAnswer1, 2)}</p>
                  </div>
                  <div className={styles.statCard}>
                    <p className={styles.statLabel}>Average Answer 2</p>
                    <p className={styles.statValue}>{formatValue(avgAnswer2, 2)}</p>
                  </div>
                  <div className={styles.statCard}>
                    <p className={styles.statLabel}>Pearson r</p>
                    <p className={styles.statValue}>{formatValue(correlation, 3)}</p>
                  </div>
                  <div className={styles.statCard}>
                    <p className={styles.statLabel}>t-statistic</p>
                    <p className={styles.statValue}>{formatValue(correlationSignificance?.tStatistic ?? null, 3)}</p>
                  </div>
                  <div className={styles.statCard}>
                    <p className={styles.statLabel}>p-value (two-tailed)</p>
                    <p className={styles.statValue}>{formatPValue(correlationSignificance?.pValue ?? null)}</p>
                  </div>
                  <div className={styles.statCard}>
                    <p className={styles.statLabel}>Linear Model (y = ax + b)</p>
                    <p className={styles.statValue}>
                      {regression ? `a=${regression.slope.toFixed(3)}, b=${regression.intercept.toFixed(3)}` : "N/A"}
                    </p>
                  </div>
                </div>

                <div className={styles.suggestions}>
                  <p>
                    <strong>Interpretation:</strong> {correlationInterpretation(correlation)}
                  </p>
                  <p>
                    Suggested hypothesis checks: Pearson correlation, Spearman rank correlation, and a permutation test
                    to verify that observed correlation is unlikely by chance.
                  </p>
                </div>

                <div className={styles.chartBox}>
                  {selectedResponses.length > 0 ? (
                    <AdminChart labels={labels} answer1Values={answer1Values} answer2Values={answer2Values} />
                  ) : (
                    <p>No responses in this session yet.</p>
                  )}
                </div>
              </>
            ) : (
              <p>No sessions available. Start a new session to begin collecting data.</p>
            )}
          </article>
        </section>

        <section className={styles.panel}>
          <h2>Session History</h2>
          <div className={styles.historyTableWrap}>
            <table className={styles.historyTable}>
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Closed</th>
                  <th>Responses</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No sessions created yet.</td>
                  </tr>
                ) : (
                  sessions.map((session) => (
                    <tr
                      key={session.id}
                      className={session.id === selectedSessionId ? styles.selectedRow : undefined}
                    >
                      <td>
                        <Link href={`/admin?sessionId=${session.id}`} className={styles.sessionLink}>
                          {session.name}
                        </Link>
                      </td>
                      <td>{session.status.toLowerCase()}</td>
                      <td>{dateFormatter.format(session.startedAt)}</td>
                      <td>{session.closedAt ? dateFormatter.format(session.closedAt) : "Open"}</td>
                      <td>{session._count.responses}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selectedSession ? (
          <section className={styles.panel}>
            <h2>Selected Session Response Log</h2>
            <div className={styles.responseTableWrap}>
              <table className={styles.responseTable}>
                <thead>
                  <tr>
                    <th>Person</th>
                    <th>Answer 1</th>
                    <th>Answer 2</th>
                    <th>Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedResponses.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No responses yet.</td>
                    </tr>
                  ) : (
                    selectedResponses.map((response, index) => (
                      <tr key={response.id}>
                        <td>{index + 1}</td>
                        <td>{response.answer1}</td>
                        <td>{response.answer2}</td>
                        <td>{dateFormatter.format(response.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <section className={styles.panel}>
          <p>
            Participant entry form: <Link href="/">open participant page</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
