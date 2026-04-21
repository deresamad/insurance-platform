"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  createUser,
  updateUser,
  ApiRequestError,
  type AdminCreateUserPayload,
  type AdminUpdateUserPayload
} from "@/lib/api";
import Alert from "@/components/feedback/Alert";
import type { User } from "@/types/user";

const roleOptions = [
  "ADMIN",
  "AGENT",
  "CUSTOMER",
  "UNDERWRITER",
  "CLAIMS_ADJUSTER"
] as const;

const accountStatuses = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;

const createSchema = z.object({
  username: z.string().min(2, "Username is required").max(64),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  firstName: z.string().min(1, "First name is required").max(80),
  lastName: z.string().min(1, "Last name is required").max(80),
  email: z.string().email("Invalid email"),
  phone: z.string().max(40).optional(),
  city: z.string().max(80).optional(),
  country: z.string().max(80).optional(),
  userType: z.string().min(1, "User type is required").max(40),
  roles: z.array(z.string()).min(1, "At least one role is required"),
  accountStatus: z.enum(accountStatuses)
});

const editSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(80),
  lastName: z.string().min(1, "Last name is required").max(80),
  email: z.string().email("Invalid email"),
  phone: z.string().max(40).optional(),
  city: z.string().max(80).optional(),
  country: z.string().max(80).optional(),
  userType: z.string().min(1, "User type is required").max(40),
  accountStatus: z.enum(accountStatuses)
});

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues = z.infer<typeof editSchema>;

interface UserFormProps {
  mode: "create" | "edit";
  initialUser?: User | null;
}

export default function UserForm({ mode, initialUser }: UserFormProps) {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      city: "",
      country: "",
      userType: "CUSTOMER",
      roles: ["CUSTOMER"],
      accountStatus: "ACTIVE"
    }
  });

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      city: "",
      country: "",
      userType: "CUSTOMER",
      accountStatus: "ACTIVE"
    }
  });

  const selectedRoles = createForm.watch("roles");

  useEffect(() => {
    if (!initialUser || mode !== "edit") return;
    editForm.reset({
      firstName: initialUser.profile.firstName,
      lastName: initialUser.profile.lastName,
      email: initialUser.profile.email,
      phone: initialUser.profile.phone ?? "",
      city: initialUser.profile.city ?? "",
      country: initialUser.profile.country ?? "",
      userType: initialUser.profile.userType,
      accountStatus: initialUser.accountStatus as EditFormValues["accountStatus"]
    });
  }, [initialUser, mode, editForm]);

  function toggleRole(role: string) {
    if (mode !== "create") return;
    const current = createForm.getValues("roles") || [];
    if (current.includes(role)) {
      createForm.setValue(
        "roles",
        current.filter((r) => r !== role),
        { shouldValidate: true }
      );
    } else {
      createForm.setValue("roles", [...current, role], { shouldValidate: true });
    }
  }

  async function submitCreate(data: CreateFormValues) {
    setApiError(null);
    try {
      const payload: AdminCreateUserPayload = {
        username: data.username.trim(),
        password: data.password,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || "",
        city: data.city?.trim() || "",
        country: data.country?.trim() || "",
        userType: data.userType.trim().toUpperCase(),
        roles: data.roles.map((r) => r.toUpperCase()),
        accountStatus: data.accountStatus
      };
      await createUser(payload);
      router.push("/admin/users");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setApiError(err.message);
      } else {
        setApiError("Failed to save user");
      }
    }
  }

  async function submitEdit(data: EditFormValues) {
    if (!initialUser) return;
    setApiError(null);
    try {
      const payload: AdminUpdateUserPayload = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || "",
        city: data.city?.trim() || "",
        country: data.country?.trim() || "",
        userType: data.userType.trim().toUpperCase(),
        accountStatus: data.accountStatus
      };
      await updateUser(initialUser._id, payload);
      router.push("/admin/users");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setApiError(err.message);
      } else {
        setApiError("Failed to save user");
      }
    }
  }

  const ce = createForm.formState.errors;
  const ee = editForm.formState.errors;

  return mode === "create" ? (
    <form onSubmit={createForm.handleSubmit(submitCreate)} className="form-grid content-panel">
      <div className="full-span">
        <h2 className="section-title">Create user</h2>
        {apiError ? <Alert variant="error" message={apiError} /> : null}
      </div>

      <div>
        <label>Username</label>
        <input {...createForm.register("username")} autoComplete="username" />
        {ce.username ? <p className="form-error">{ce.username.message}</p> : null}
      </div>
      <div>
        <label>Password</label>
        <input type="password" {...createForm.register("password")} autoComplete="new-password" />
        {ce.password ? <p className="form-error">{ce.password.message}</p> : null}
      </div>

      <div>
        <label>First name</label>
        <input {...createForm.register("firstName")} />
        {ce.firstName ? <p className="form-error">{ce.firstName.message}</p> : null}
      </div>
      <div>
        <label>Last name</label>
        <input {...createForm.register("lastName")} />
        {ce.lastName ? <p className="form-error">{ce.lastName.message}</p> : null}
      </div>

      <div className="full-span">
        <label>Email</label>
        <input type="email" {...createForm.register("email")} />
        {ce.email ? <p className="form-error">{ce.email.message}</p> : null}
      </div>

      <div>
        <label>Phone</label>
        <input {...createForm.register("phone")} />
      </div>
      <div>
        <label>City</label>
        <input {...createForm.register("city")} />
      </div>
      <div>
        <label>Country</label>
        <input {...createForm.register("country")} />
      </div>

      <div>
        <label>User type</label>
        <input {...createForm.register("userType")} placeholder="e.g. CUSTOMER" />
        {ce.userType ? <p className="form-error">{ce.userType.message}</p> : null}
      </div>

      <div>
        <label>Account status</label>
        <select {...createForm.register("accountStatus")}>
          {accountStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="full-span">
        <label>Roles</label>
        <div className="role-toggle-row">
          {roleOptions.map((role) => (
            <button
              type="button"
              key={role}
              className={`btn btn-secondary role-chip ${selectedRoles?.includes(role) ? "role-chip-active" : ""}`}
              onClick={() => toggleRole(role)}
            >
              {role}
            </button>
          ))}
        </div>
        {ce.roles ? <p className="form-error">{ce.roles.message}</p> : null}
      </div>

      <div className="full-span form-actions">
        <button type="button" className="btn btn-secondary" onClick={() => router.push("/admin/users")}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={createForm.formState.isSubmitting}>
          {createForm.formState.isSubmitting ? "Saving…" : "Create user"}
        </button>
      </div>
    </form>
  ) : (
    <form onSubmit={editForm.handleSubmit(submitEdit)} className="form-grid content-panel">
      <div className="full-span">
        <h2 className="section-title">Edit user</h2>
        {apiError ? <Alert variant="error" message={apiError} /> : null}
      </div>

      {initialUser ? (
        <div className="full-span demo-box">
          <p className="muted-label">Username</p>
          <p className="read-only-value">{initialUser.username}</p>
          <p className="muted-label" style={{ marginTop: 12 }}>
            Roles (manage under RBAC)
          </p>
          <p className="read-only-value">{initialUser.roles.join(", ")}</p>
        </div>
      ) : null}

      <div>
        <label>First name</label>
        <input {...editForm.register("firstName")} />
        {ee.firstName ? <p className="form-error">{ee.firstName.message}</p> : null}
      </div>
      <div>
        <label>Last name</label>
        <input {...editForm.register("lastName")} />
        {ee.lastName ? <p className="form-error">{ee.lastName.message}</p> : null}
      </div>

      <div className="full-span">
        <label>Email</label>
        <input type="email" {...editForm.register("email")} />
        {ee.email ? <p className="form-error">{ee.email.message}</p> : null}
      </div>

      <div>
        <label>Phone</label>
        <input {...editForm.register("phone")} />
      </div>
      <div>
        <label>City</label>
        <input {...editForm.register("city")} />
      </div>
      <div>
        <label>Country</label>
        <input {...editForm.register("country")} />
      </div>

      <div>
        <label>User type</label>
        <input {...editForm.register("userType")} />
        {ee.userType ? <p className="form-error">{ee.userType.message}</p> : null}
      </div>

      <div>
        <label>Account status</label>
        <select {...editForm.register("accountStatus")}>
          {accountStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="full-span form-actions">
        <button type="button" className="btn btn-secondary" onClick={() => router.push("/admin/users")}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={editForm.formState.isSubmitting}>
          {editForm.formState.isSubmitting ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
