"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import PageShell from "@/components/layout/PageShell";
import SectionHeader from "@/components/layout/SectionHeader";
import ProfileForm, { type ProfileFormValues } from "@/components/forms/ProfileForm";
import Loader from "@/components/feedback/Loader";
import Alert from "@/components/feedback/Alert";
import { apiRequest, ApiRequestError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/types/user";

export default function EditProfilePage() {
  const [profile, setProfile] = useState<User | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const router = useRouter();
  const { refreshUser } = useAuth();

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

  async function handleSubmit(payload: ProfileFormValues) {
    setSaveError(null);
    try {
      await apiRequest<User>("/profile/me", {
        method: "PUT",
        body: payload
      });
      await refreshUser();
      router.push("/profile?updated=1");
    } catch (e) {
      if (e instanceof ApiRequestError) {
        setSaveError(e.message);
      } else {
        setSaveError("Update failed");
      }
    }
  }

  return (
    <ProtectedRoute>
      <PageShell>
        <SectionHeader
          title="Edit profile"
          subtitle="Update your personal contact details. Roles and account status are managed by an administrator."
        />

        {loadError ? <Alert variant="error" message={loadError} /> : null}
        {saveError ? <Alert variant="error" message={saveError} /> : null}

        {!loadError && !profile ? <Loader label="Loading profile…" /> : null}
        {profile ? <ProfileForm initialValue={profile.profile} onSubmit={handleSubmit} /> : null}
      </PageShell>
    </ProtectedRoute>
  );
}
