import LoginPage from "@/features/login";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import React from "react";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Login() {
  const sb = createClient();
  const {
    data: { session },
  } = await sb.auth.getSession();

  if (session) {
    const { data: profile } = await sb
      .from("users")
      .select("user_roles")
      .eq("id", session.user.id)
      .single();

    if (profile?.user_roles === "ADMIN") {
      redirect("/admin");
    }
    redirect("/joblist");
  }

  return (
    <Suspense fallback={<div>Loading…</div>}>
      <LoginPage />
    </Suspense>
  );
}
