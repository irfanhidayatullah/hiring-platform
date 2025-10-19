"use client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { createBrowserSupabase } from "@/utils/supabase/client";

interface LoginPayload {
  email: string;
  password: string;
}

const useLogin = () => {
  const router = useRouter();
  const supabase = createBrowserSupabase();

  return useMutation({
    mutationFn: async ({ email, password }: LoginPayload) => {
      const { data: loginData, error } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );
      if (error) throw error;
      const user = loginData.user;
      if (!user) throw new Error("User not found");

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("user_roles")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.user_roles === "ADMIN") {
        router.push("/admin");
      } else if (profile.user_roles === "JOBSEEKER") {
        router.push("/joblist");
      } else {
        router.push("/");
      }

      return profile;
    },
    onSuccess: async () => {
      toast.success("Login Success");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Login failed");
    },
  });
};

export default useLogin;
