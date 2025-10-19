import axios from "axios";

const apikey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  headers: {
    apikey,
    Authorization: `Bearer ${apikey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
});
