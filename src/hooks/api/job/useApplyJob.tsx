"use client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { createBrowserSupabase } from "@/utils/supabase/client";

export interface ApplyJobPayload {
  job_id: string;
  full_name: string;
  date_of_birth: string;
  gender: "female" | "male";
  domicile: string;
  phone_number: string;
  email: string;
  linkedin_link: string;
  // file asli untuk diupload
  photo_file: File | null;
}

type InsertedCandidate = { id: string };

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
      } = payload;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const applicantId = session.user.id;

      // 1) upload foto (opsional). pastikan bucket "candidate-photos" sudah ada dan public.
      let photoUrl: string | null = null;
      if (photo_file) {
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

      // 3) insert attributes (bulk)
      const attrs = [
        {
          key: "photo_profile",
          label: "Photo Profile",
          value: photoUrl ?? "",
          order: 1,
        },
        { key: "full_name", label: "Full Name", value: full_name, order: 2 },
        {
          key: "date_of_birth",
          label: "Date of Birth",
          value: date_of_birth,
          order: 3,
        },
        { key: "gender", label: "Gender", value: gender, order: 4 },
        { key: "domicile", label: "Domicile", value: domicile, order: 5 },
        {
          key: "phone_number",
          label: "Phone Number",
          value: phone_number,
          order: 6,
        },
        { key: "email", label: "Email", value: email, order: 7 },
        {
          key: "linkedin_link",
          label: "LinkedIn",
          value: linkedin_link,
          order: 8,
        },
      ].map((a) => ({ ...a, candidate_id: candidateId }));

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
