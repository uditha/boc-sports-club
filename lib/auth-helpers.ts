import { auth } from "@/auth";
import { redirect } from "next/navigation";

type Role = "admin" | "editor" | "viewer";

async function getSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireUser() {
  return getSession();
}

export async function requireEditor() {
  const session = await getSession();
  const role = (session.user as { role?: Role }).role;
  if (role !== "admin" && role !== "editor") redirect("/dashboard");
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  const role = (session.user as { role?: Role }).role;
  if (role !== "admin") redirect("/dashboard");
  return session;
}
