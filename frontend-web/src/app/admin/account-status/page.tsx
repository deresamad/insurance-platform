"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import RoleGuard from "@/components/guards/RoleGuard";
import PageShell from "@/components/layout/PageShell";
import SectionHeader from "@/components/layout/SectionHeader";
import { apiRequest, updateUserStatus, ApiRequestError } from "@/lib/api";
import Alert from "@/components/feedback/Alert";
import StatusBadge from "@/components/tables/StatusBadge";
import type { User } from "@/types/user";

const statuses = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;

export default function AdminAccountStatusPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  useEffect(() => {
    async function load() {
      const response = await apiRequest<User[]>("/admin/users");
      setUsers(response.data);
    }

    void load();
  }, []);

  async function changeStatus(userId: string, accountStatus: (typeof statuses)[number]) {
    setMessage(null);
    try {
      const response = await updateUserStatus(userId, accountStatus);
      setUsers((prev) => prev.map((u) => (u._id === userId ? response.data : u)));
      setMessage({ type: "success", text: "Status updated" });
    } catch (e) {
      if (e instanceof ApiRequestError) {
        setMessage({ type: "error", text: e.message });
      } else {
        setMessage({ type: "error", text: "Update failed" });
      }
    }
  }

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={["ADMIN"]}>
        <PageShell>
          <SectionHeader
            title="Account status"
            subtitle="Activate, pause, or suspend user accounts. Reactivation of self-suspended accounts is performed here."
            action={
              <Link href="/admin/users" className="btn btn-secondary">
                Back to users
              </Link>
            }
          />

          {message ? <Alert variant={message.type === "success" ? "success" : "error"} message={message.text} /> : null}

          <div className="table-wrap" style={{ marginTop: 20 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Current</th>
                  <th>Set status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.username}</td>
                    <td>
                      {user.profile.firstName} {user.profile.lastName}
                    </td>
                    <td>{user.profile.email}</td>
                    <td>
                      <StatusBadge value={user.accountStatus} />
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={user.accountStatus}
                        onChange={(e) =>
                          void changeStatus(user._id, e.target.value as (typeof statuses)[number])
                        }
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PageShell>
      </RoleGuard>
    </ProtectedRoute>
  );
}
