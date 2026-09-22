import { auth } from "./firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://zero-downtime-api-1052752541109.asia-south1.run.app";

export async function apiFetch<T>(path: string): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || `Request failed (${res.status})`);
  }
  return res.json();
}
