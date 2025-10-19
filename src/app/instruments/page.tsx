import { createClient } from "@/utils/supabase/server";

export default async function Instruments() {
  const supabase = createClient();
  const { data, error } = await supabase.from("instruments").select("*");
  if (error) return <pre>{error.message}</pre>;
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
