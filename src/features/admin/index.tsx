"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/utils/supabase/client";
import LogoutButton from "@/components/logoutbutton";

export default function AdminPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      const supabase = createBrowserSupabase();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("users")
        .select("user_roles")
        .eq("id", session.user.id)
        .single();

      if (profile?.user_roles !== "ADMIN") {
        router.replace("/joblist");
        return;
      }
      setAllowed(true);
    };
    checkRole();
  }, [router]);

  if (allowed === null) return <div>Checking permission...</div>;
  return (
    <div>
      Welcome Admin Dashboard
      <div>
        <LogoutButton />
      </div>
    </div>
  );
}
