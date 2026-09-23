"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, UserCog, Users as UsersIcon } from "lucide-react";

import Protected from "@/components/Protected";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch } from "@/lib/api";
import type { AppUser } from "@/lib/types";

const roleLabel = (role: string) =>
  role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function Users() {
  const { me } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!me || me.role === "standard") return;

    apiFetch<AppUser[]>("/api/users")
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load users"));
  }, [me]);

  const activeCount = useMemo(() => users.filter((user) => !user.disabled).length, [users]);
  const adminCount = useMemo(
    () => users.filter((user) => user.role === "client_admin" || user.role === "super_admin").length,
    [users]
  );

  return (
    <Protected>
      <div className="hero">
        <div>
          <div className="eyebrow">Access governance</div>
          <h1>
            <span className="gradient-text">User management</span>
          </h1>
          <p>Review who can access the platform, their tenant scope and assigned role.</p>
        </div>
      </div>

      {me?.role === "standard" ? (
        <div className="card empty">You do not have permission to manage users.</div>
      ) : (
        <>
          <div className="grid grid-3">
            <div className="card compact-metric">
              <UsersIcon size={18} />
              <div>
                <span>Visible users</span>
                <strong>{users.length}</strong>
              </div>
            </div>
            <div className="card compact-metric">
              <ShieldCheck size={18} />
              <div>
                <span>Active accounts</span>
                <strong>{activeCount}</strong>
              </div>
            </div>
            <div className="card compact-metric">
              <UserCog size={18} />
              <div>
                <span>Administrators</span>
                <strong>{adminCount}</strong>
              </div>
            </div>
          </div>

          {error && <div className="notice notice-error">{error}</div>}

          <div className="table-wrap users-table">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Tenant</th>
                  <th>Status</th>
                  <th>Last sign-in</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.uid}>
                    <td>
                      <strong>{user.email}</strong>
                      <div className="subtle-text">{user.uid.slice(0, 10)}…</div>
                    </td>
                    <td>
                      <span className="role-pill">{roleLabel(user.role)}</span>
                    </td>
                    <td>{user.client_id === "GLOBAL" ? "All clients" : user.client_id}</td>
                    <td>
                      <span className={`status-pill ${user.disabled ? "disabled" : "active"}`}>
                        {user.disabled ? "Disabled" : "Active"}
                      </span>
                    </td>
                    <td>{user.last_sign_in ? new Date(user.last_sign_in).toLocaleString() : "Never"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Protected>
  );
}
