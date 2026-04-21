"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import RoleGuard from "@/components/guards/RoleGuard";
import PageShell from "@/components/layout/PageShell";
import SectionHeader from "@/components/layout/SectionHeader";
import UserForm from "@/components/forms/UserForm";
import Loader from "@/components/feedback/Loader";
import { fetchAdminUser, ApiRequestError } from "@/lib/api";
import type { User } from "@/types/user";

export default function EditAdminUserPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        const response = await fetchAdminUser(id);
        setUser(response.data);
      } catch (e) {
        if (e instanceof ApiRequestError) {
          setError(e.message);
        } else {
          setError("Unable to load user");
        }
      }
    }

    void load();
  }, [id]);

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={["ADMIN"]}>
        <PageShell>
          <SectionHeader
            title="Edit user"
            subtitle="Update profile fields and account status. Role changes are managed on the RBAC page."
          />

          <div className="max-w-3xl">
            {error ? <p className="form-error full-span">{error}</p> : null}
            {!error && !user ? <Loader label="Loading user…" /> : null}
            {user ? <UserForm mode="edit" initialUser={user} /> : null}
          </div>
        </PageShell>
      </RoleGuard>
    </ProtectedRoute>
  );
}
