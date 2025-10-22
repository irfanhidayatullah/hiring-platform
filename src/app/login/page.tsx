import LoginPage from "@/features/login";
import React from "react";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const Login = () => {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <LoginPage />
    </Suspense>
  );
};

export default Login;
