"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import RoleGuard from "@/components/guards/RoleGuard";
import PageShell from "@/components/layout/PageShell";
import SectionHeader from "@/components/layout/SectionHeader";
import DataTable, { type DataTableColumn } from "@/components/tables/DataTable";
import StatusBadge from "@/components/tables/StatusBadge";
import { apiRequest } from "@/lib/api";
import type { User } from "@/types/user";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    async function load() {
      const response = await apiRequest<User[]>("/admin/users");
      setUsers(response.data);
    }

    void load();
  }, []);

  const columns: DataTableColumn<User>[] = [
    { key: "username", label: "Username", render: (row) => row.username },
    {
      key: "fullName",
      label: "Full name",
      render: (row) => `${row.profile.firstName} ${row.profile.lastName}`
    },
    { key: "email", label: "Email", render: (row) => row.profile.email },
    { key: "roles", label: "Roles", render: (row) => row.roles.join(", ") },
    {
      key: "accountStatus",
      label: "Status",
      render: (row) => <StatusBadge value={row.accountStatus} />
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="table-actions">
          <Link className="text-link" href={`/admin/users/${row._id}/edit`}>
            Edit
          </Link>
          <Link className="text-link" href={`/admin/rbac`}>
            Roles
          </Link>
          <Link className="text-link" href={`/admin/account-status`}>
            Status
          </Link>
        </div>
      )
    }
  ];

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={["ADMIN"]}>
        <PageShell>
          <SectionHeader
            title="Admin users"
            subtitle="Directory of platform accounts, roles, and lifecycle state."
            action={
              <Link href="/admin/users/create" className="btn btn-primary">
                Create user
              </Link>
            }
          />
          <DataTable columns={columns} data={users} rowKey={(row) => row._id} />
        </PageShell>
      </RoleGuard>
    </ProtectedRoute>
  );
}
