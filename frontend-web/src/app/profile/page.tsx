"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import PageShell from "@/components/layout/PageShell";
import SectionHeader from "@/components/layout/SectionHeader";
import Loader from "@/components/feedback/Loader";
import Alert from "@/components/feedback/Alert";
import { apiRequest, ApiRequestError } from "@/lib/api";
import { getAuthMode } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/types/user";

function isAdminUser(user: User | null) {
  return Boolean(user?.roles?.includes("ADMIN"));
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<User | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [suspendStep, setSuspendStep] = useState<"idle" | "confirm">("idle");
  const [suspendBusy, setSuspendBusy] = useState(false);
  const [suspendError, setSuspendError] = useState<string | null>(null);
  const [showUpdated, setShowUpdated] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setShowUpdated(params.get("updated") === "1");
  }, []);

  const canSelfSuspend = useMemo(() => user && !isAdminUser(user), [user]);

  useEffect(() => {
    async function load() {
      try {
        const response = await apiRequest<User>("/profile/me");
        setProfile(response.data);
      } catch (e) {
        if (e instanceof ApiRequestError) {
          setLoadError(e.message);
        } else {
          setLoadError("Unable to load profile");
        }
      }
    }

    void load();
  }, []);

  async function confirmSuspend() {
    setSuspendError(null);
    setSuspendBusy(true);
    try {
      const authMode = getAuthMode();
      await apiRequest("/profile/me/suspend", { method: "POST" });
      setSuspendStep("idle");
      await logout();
      if (authMode !== "KEYCLOAK") {
        router.push("/login");
      }
    } catch (e) {
      if (e instanceof ApiRequestError) {
        setSuspendError(e.message);
      } else {
        setSuspendError("Could not suspend account");
      }
    } finally {
      setSuspendBusy(false);
    }
  }

  return (
    <ProtectedRoute>
      <PageShell>
        <SectionHeader
          title="Your profile"
          subtitle="Identity, roles, and contact information for your NorthStar account."
          action={
            <Link href="/profile/edit" className="btn btn-secondary">
              Edit profile
            </Link>
          }
        />

        {showUpdated ? (
          <Alert variant="success" message="Profile updated successfully." />
        ) : null}
        {loadError ? <Alert variant="error" message={loadError} /> : null}

        {!loadError && !profile ? <Loader label="Loading profile…" /> : null}

        {profile ? (
          <div className="profile-layout">
            <section className="content-panel profile-card">
              <h2>Identity</h2>
              <dl className="profile-dl">
                <div>
                  <dt>Username</dt>
                  <dd>{profile.username}</dd>
                </div>
                <div>
                  <dt>Full name</dt>
                  <dd>
                    {profile.profile.firstName} {profile.profile.lastName}
                  </dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{profile.profile.email}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{profile.profile.phone || "—"}</dd>
                </div>
                <div>
                  <dt>Roles</dt>
                  <dd>{profile.roles.join(", ")}</dd>
                </div>
                <div>
                  <dt>Account status</dt>
                  <dd>{profile.accountStatus}</dd>
                </div>
                <div>
                  <dt>User type</dt>
                  <dd>{profile.profile.userType}</dd>
                </div>
                <div>
                  <dt>City</dt>
                  <dd>{profile.profile.city || "—"}</dd>
                </div>
                <div>
                  <dt>Country</dt>
                  <dd>{profile.profile.country || "—"}</dd>
                </div>
              </dl>
            </section>

            {canSelfSuspend ? (
              <section className="content-panel profile-card profile-danger-zone">
                <h2>Account deactivation</h2>
                <p className="muted-copy">
                  Suspending your account signs you out immediately. You will not be able to sign in again
                  until an administrator reactivates your account.
                </p>
                {suspendError ? <Alert variant="error" message={suspendError} /> : null}
                {suspendStep === "idle" ? (
                  <button type="button" className="btn btn-secondary" onClick={() => setSuspendStep("confirm")}>
                    Suspend my account
                  </button>
                ) : (
                  <div className="confirm-stack">
                    <p className="confirm-warning">Are you sure you want to suspend your account?</p>
                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={suspendBusy}
                        onClick={() => setSuspendStep("idle")}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={suspendBusy}
                        onClick={() => void confirmSuspend()}
                      >
                        {suspendBusy ? "Working…" : "Yes, suspend account"}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            ) : null}
          </div>
        ) : null}
      </PageShell>
    </ProtectedRoute>
  );
}
