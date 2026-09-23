import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://zero-downtime-api-1052752541109.asia-south1.run.app";

function waitForAuthenticatedUser(): Promise<User> {
  return new Promise((resolve, reject) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();

        if (user) {
          resolve(user);
        } else {
          reject(new Error("Not authenticated"));
        }
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const user = await waitForAuthenticatedUser();
  const token = await user.getIdToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));

    throw new Error(
      payload.error || `API request failed (${response.status})`
    );
  }

  return response.json();
}
