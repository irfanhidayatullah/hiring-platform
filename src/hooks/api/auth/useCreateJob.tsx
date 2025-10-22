"use client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { createBrowserSupabase } from "@/utils/supabase/client";

export interface CreateJobPayload {
  title: string;
  department: string;
  description: string;
  needed: string;
  salary_min: string;
  salary_max: string;
  status?: "active" | "inactive" | "draft";
  currency?: string;
}

type InsertedJob = { id: string };

const useCreateJob = () => {
  const router = useRouter();
  const supabase = createBrowserSupabase();

  return useMutation({
    mutationFn: async (payload: CreateJobPayload) => {
      const {
        title,
        department,
        description,
        needed,
        salary_min,
        salary_max,
        status = "active",
        currency = "IDR",
      } = payload;

      const neededNum = needed?.trim()
        ? Number(needed.replace(/[^0-9]/g, ""))
        : null;
      const salMinNum = salary_min?.trim()
        ? Number(salary_min.replace(/[^0-9]/g, ""))
        : null;
      const salMaxNum = salary_max?.trim()
        ? Number(salary_max.replace(/[^0-9]/g, ""))
        : null;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const insertBody = {
        title: title.trim(),
        department,
        description: description.trim(),
        needed: neededNum,
        salary_min: salMinNum,
        salary_max: salMaxNum,
        status,
        currency,
        users_id: session.user.id,
      };

      const { data, error } = await supabase
        .from("jobs")
        .insert(insertBody)
        .select("id")
        .single<InsertedJob>();

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      toast.success("Job vacancy successfully created");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Create job vacancy failed");
    },
  });
};

export default useCreateJob;
