"use client";

import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

export default function LogoutButton({ all = false }: { all?: boolean }) {
  const router = useRouter();
  const runningRef = useRef(false);

  const onClick = async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    const supabase = createBrowserSupabase();
    const scope = all ? { scope: "global" as const } : undefined;

    try {
      await supabase.auth.signOut(scope);
    } finally {
      router.replace("/login?logged_out=1");
    }
  };

  return (
    <Button variant="outline" onClick={onClick} className="">
      Logout
    </Button>
  );
}
