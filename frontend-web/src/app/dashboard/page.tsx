"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import PageShell from "@/components/layout/PageShell";
import SectionHeader from "@/components/layout/SectionHeader";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import StatCard from "@/components/dashboard/StatCard";
import Alert from "@/components/feedback/Alert";
import { api, ApiRequestError } from "@/lib/api";
import type { DashboardSummary } from "@/types/dashboard";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await api.get<DashboardSummary>("/dashboard/summary");
        setSummary(response.data);
      } catch (err) {
        if (err instanceof ApiRequestError) {
          setError(err.message);
        } else {
          setError("Could not load dashboard metrics.");
        }
        setSummary(null);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <ProtectedRoute>
      <PageShell>
        <SectionHeader
          title="Dashboard"
          subtitle="Unified secure workspace for customers, internal staff, and administrators."
        />

        {error ? <Alert variant="error" message={error} /> : null}

        <DashboardGrid>
          <StatCard
            title="Policies"
            value={loading ? "…" : (summary?.policies ?? 0)}
            subtitle="Protected insurance records"
          />
          <StatCard
            title="Claims"
            value={loading ? "…" : (summary?.claims ?? 0)}
            subtitle="Claims lifecycle"
          />
          <StatCard
            title="Amendments"
            value={loading ? "…" : (summary?.amendments ?? 0)}
            subtitle="Change requests"
          />
          <StatCard
            title="Reductions"
            value={loading ? "…" : (summary?.reductions ?? 0)}
            subtitle="Coverage adjustment requests"
          />
        </DashboardGrid>
      </PageShell>
    </ProtectedRoute>
  );
}
