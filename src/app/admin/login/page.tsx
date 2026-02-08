import Link from "next/link";
import { redirect } from "next/navigation";

import { adminLoginAction } from "@/app/actions/admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

import styles from "../admin.module.css";

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }

  const params = await searchParams;

  return (
    <main className={styles.loginPage}>
      <section className={styles.loginCard}>
        <h1>Admin Login</h1>
        <p>Use the password from the `ADMIN_PASSWORD` environment variable.</p>

        {params.error ? <p className={styles.error}>{params.error}</p> : null}

        <form action={adminLoginAction} className={styles.actionForm}>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button type="submit">Sign In</button>
        </form>

        <Link href="/">Back to Participant Page</Link>
      </section>
    </main>
  );
}

