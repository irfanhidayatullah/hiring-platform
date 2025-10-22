"use client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { createBrowserSupabase } from "@/utils/supabase/client";
import type {
  FieldStateMap,
  ProfileFieldKey,
} from "@/features/joblist/schemas/ApplyJobSchema";

export interface ApplyJobPayload {
  job_id: string;
  full_name: string;
  date_of_birth: string;
  gender: "female" | "male";
  domicile: string;
  phone_number: string;
  email: string;
  linkedin_link: string;
  photo_file: File | null;
  field_states: FieldStateMap; // <<— baru
}

type InsertedCandidate = { id: string };

const LABELS: Record<ProfileFieldKey, string> = {
  photo_profile: "Photo Profile",
  full_name: "Full Name",
  date_of_birth: "Date of Birth",
  gender: "Gender",
  domicile: "Domicile",
  phone_number: "Phone Number",
  email: "Email",
  linkedin_link: "LinkedIn",
};

const useApplyJob = () => {
  const supabase = createBrowserSupabase();

  return useMutation({
    mutationFn: async (payload: ApplyJobPayload) => {
      const {
        job_id,
        full_name,
        date_of_birth,
        gender,
        domicile,
        phone_number,
        email,
        linkedin_link,
        photo_file,
        field_states,
      } = payload;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const applicantId = session.user.id;

      // 1) Upload foto hanya jika field 'photo_profile' tidak OFF dan ada file
      let photoUrl: string | null = null;
      const photoOn = field_states.photo_profile !== "off";
      if (photoOn && photo_file) {
        const key = `${applicantId}/${Date.now()}-${photo_file.name}`;
        const { error: upErr } = await supabase.storage
          .from("candidate-photos")
          .upload(key, photo_file, {
            upsert: true,
            cacheControl: "3600",
            contentType: photo_file.type,
          });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage
          .from("candidate-photos")
          .getPublicUrl(key);
        photoUrl = pub.publicUrl ?? null;
      }

      // 2) insert ke candidates
      const { data: cand, error: insErr } = await supabase
        .from("candidates")
        .insert({ job_id, applicant_id: applicantId })
        .select("id")
        .single<InsertedCandidate>();
      if (insErr) throw insErr;
      const candidateId = cand.id;

      // 3) build attributes sesuai field_states (skip "off")
      const rawMap: Record<ProfileFieldKey, string> = {
        photo_profile: photoUrl ?? "",
        full_name,
        date_of_birth,
        gender,
        domicile,
        phone_number,
        email,
        linkedin_link,
      };

      const orderedKeys: ProfileFieldKey[] = [
        "photo_profile",
        "full_name",
        "date_of_birth",
        "gender",
        "domicile",
        "phone_number",
        "email",
        "linkedin_link",
      ];

      const attrs = orderedKeys
        .filter((k) => field_states[k] !== "off")
        .map((k, idx) => ({
          key: k,
          label: LABELS[k],
          value: rawMap[k] ?? "",
          order: idx + 1,
          candidate_id: candidateId,
        }));

      const { error: attrErr } = await supabase
        .from("candidate_attributes")
        .insert(attrs);
      if (attrErr) {
        // rollback sederhana jika attributes gagal
        await supabase.from("candidates").delete().eq("id", candidateId);
        throw attrErr;
      }

      return { candidateId };
    },
    onSuccess: () => {
      toast.success("Application submitted");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Submit application failed");
    },
  });
};

export default useApplyJob;
