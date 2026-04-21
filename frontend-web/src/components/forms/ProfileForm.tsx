"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UserProfile } from "@/types/user";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(80),
  lastName: z.string().min(1, "Last name is required").max(80),
  email: z.string().email("Invalid email"),
  phone: z.string().max(40).optional(),
  city: z.string().max(80).optional(),
  country: z.string().max(80).optional()
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialValue: UserProfile;
  onSubmit: (payload: ProfileFormValues) => Promise<void>;
}

export default function ProfileForm({ initialValue, onSubmit }: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: initialValue.firstName,
      lastName: initialValue.lastName,
      email: initialValue.email,
      phone: initialValue.phone ?? "",
      city: initialValue.city ?? "",
      country: initialValue.country ?? ""
    }
  });

  return (
    <form className="form-grid content-panel" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>First name</label>
        <input {...register("firstName")} />
        {errors.firstName ? <p className="form-error">{errors.firstName.message}</p> : null}
      </div>

      <div>
        <label>Last name</label>
        <input {...register("lastName")} />
        {errors.lastName ? <p className="form-error">{errors.lastName.message}</p> : null}
      </div>

      <div className="full-span">
        <label>Email</label>
        <input type="email" {...register("email")} />
        {errors.email ? <p className="form-error">{errors.email.message}</p> : null}
      </div>

      <div>
        <label>Phone</label>
        <input {...register("phone")} />
      </div>

      <div>
        <label>City</label>
        <input {...register("city")} />
      </div>

      <div>
        <label>Country</label>
        <input {...register("country")} />
      </div>

      <div className="full-span form-actions">
        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save profile changes"}
        </button>
      </div>
    </form>
  );
}
