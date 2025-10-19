"use client";
import { useEffect } from "react";
import axios from "axios";
import { createBrowserSupabase } from "@/utils/supabase/client";

export const axiosSupabase = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`,
  headers: {
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
});

const useAxios = () => {
  useEffect(() => {
    const supabase = createBrowserSupabase();

    const requestIntercept = axiosSupabase.interceptors.request.use(
      async (config) => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
          config.headers.apikey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        }
        return config;
      }
    );

    return () => {
      axiosSupabase.interceptors.request.eject(requestIntercept);
    };
  }, []);

  return { axiosInstance: axiosSupabase };
};

export default useAxios;
