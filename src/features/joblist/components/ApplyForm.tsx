"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildApplyJobSchema,
  type FieldState,
  type FieldStateMap,
  type ProfileFieldKey,
} from "@/features/joblist/schemas/ApplyJobSchema";
import useApplyJob from "@/hooks/api/job/useApplyJob";
import { useFormik } from "formik";
import React from "react";
import DatePickerField from "./DatePickerField";
import PhoneWithCountry from "./PhoneWithCountry";
import HandCaptureModal from "./HandCaptureModal";
import { createBrowserSupabase } from "@/utils/supabase/client";

type Province = { id: string; name: string };

const DEFAULT_STATES: FieldStateMap = {
  photo_profile: "mandatory",
  full_name: "mandatory",
  date_of_birth: "mandatory",
  gender: "mandatory",
  domicile: "mandatory",
  phone_number: "mandatory",
  email: "mandatory",
  linkedin_link: "mandatory",
};

export default function ApplyForm({
  jobId,
  onClose,
  onApplied,
}: {
  jobId: string;
  onClose: () => void;
  onApplied: (jobId: string) => void;
}) {
  const { mutateAsync: applyJob, isPending } = useApplyJob();
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [camOpen, setCamOpen] = React.useState(false);

  const [provinces, setProvinces] = React.useState<Province[]>([]);
  const [provLoading, setProvLoading] = React.useState(false);
  const [provErr, setProvErr] = React.useState<string | null>(null);

  const [configLoading, setConfigLoading] = React.useState(true);
  const [fieldStates, setFieldStates] =
    React.useState<FieldStateMap>(DEFAULT_STATES);

  // Load job config (application_form sections -> fields [{key, state}])
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setConfigLoading(true);
        const sb = createBrowserSupabase();
        const { data, error } = await sb
          .from("job_configs")
          .select("config_json")
          .eq("job_id", jobId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        let states = { ...DEFAULT_STATES };
        const raw = data?.config_json as any | undefined;
        const fields: Array<{ key: ProfileFieldKey; state: FieldState }> =
          raw?.application_form?.sections?.[0]?.fields ?? [];

        if (Array.isArray(fields) && fields.length > 0) {
          for (const f of fields) {
            if (
              f?.key &&
              (["mandatory", "optional", "off"] as FieldState[]).includes(
                f.state
              )
            ) {
              states[f.key] = f.state;
            }
          }
        }
        if (!cancelled) setFieldStates(states);
      } catch {
        // fallback: DEFAULT_STATES (semua mandatory)
      } finally {
        if (!cancelled) setConfigLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  React.useEffect(() => {
    const ctrl = new AbortController();
    const load = async () => {
      try {
        setProvLoading(true);
        setProvErr(null);
        const res = await fetch(
          "https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json",
          { signal: ctrl.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const list = (await res.json()) as Province[];
        setProvinces(list);
      } catch (e: any) {
        if (e?.name !== "AbortError") setProvErr("Failed to load provinces");
      } finally {
        setProvLoading(false);
      }
    };
    load();
    return () => ctrl.abort();
  }, []);

  const formik = useFormik({
    initialValues: {
      photo_profile: "",
      full_name: "",
      date_of_birth: "",
      gender: "",
      domicile: "",
      phone_number: "",
      email: "",
      linkedin_link: "",
    },
    enableReinitialize: true,
    validationSchema: React.useMemo(
      () => buildApplyJobSchema(fieldStates),
      [fieldStates]
    ),
    validateOnMount: true,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values, helpers) => {
      await applyJob({
        job_id: jobId,
        full_name: values.full_name.trim(),
        date_of_birth: values.date_of_birth,
        gender: values.gender as "female" | "male",
        domicile: values.domicile.trim(),
        phone_number: values.phone_number.trim(),
        email: values.email.trim(),
        linkedin_link: values.linkedin_link.trim(),
        photo_file: photoFile,
        field_states: fieldStates, // kirim map state agar insert atribut ikut dinamis
      });
      helpers.resetForm();
      onApplied(jobId);
      onClose();
    },
  });

  const show = (k: ProfileFieldKey) => fieldStates[k] !== "off";
  const isOptional = (k: ProfileFieldKey) => fieldStates[k] === "optional";

  if (configLoading) {
    return (
      <div className="p-6 text-sm text-gray-500">Loading application form…</div>
    );
  }

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="flex-1 overflow-y-auto px-6 pb-6 pt-4 space-y-5"
    >
      {/* Photo */}
      {show("photo_profile") && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-[#1D1F20]">
            Photo Profile{isOptional("photo_profile") ? " (optional)" : ""}
          </div>
          <div>
            {(() => {
              const roundedClass = previewUrl ? "rounded-sm" : "rounded-full";
              return (
                <div
                  className={`h-24 w-24 ${roundedClass} bg-[#E6F3F4] ring-1 ring-[#CFE8EA] overflow-hidden flex items-center justify-center`}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-12 w-12 text-[#01959F]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <circle cx="12" cy="8" r="3.5" />
                      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                    </svg>
                  )}
                </div>
              );
            })()}
            <div>
              <button
                type="button"
                onClick={() => setCamOpen(true)}
                className="inline-flex mt-3 items-center gap-2 rounded-sm border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#1F2937] hover:bg-gray-50"
              >
                Take a Picture
              </button>
              {!!formik.touched.photo_profile &&
                !!formik.errors.photo_profile && (
                  <p className="mt-2 text-xs text-red-500">
                    {formik.errors.photo_profile as string}
                  </p>
                )}
            </div>
          </div>

          <HandCaptureModal
            open={camOpen}
            onOpenChange={setCamOpen}
            onDone={({ file, previewUrl }) => {
              setPhotoFile(file);
              setPreviewUrl(previewUrl);
              formik.setFieldValue("photo_profile", file.name, true);
              formik.setFieldTouched("photo_profile", true, true);
            }}
          />
        </div>
      )}

      {/* Full Name */}
      {show("full_name") && (
        <div className="space-y-2">
          <Label className="text-sm">
            Full name{isOptional("full_name") ? " (optional)" : ""}
            {fieldStates.full_name === "mandatory" && (
              <span className="text-red-500">*</span>
            )}
          </Label>
          <Input
            name="full_name"
            placeholder="Enter your full name"
            value={formik.values.full_name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {!!formik.touched.full_name && !!formik.errors.full_name && (
            <p className="text-xs text-red-500">
              {formik.errors.full_name as string}
            </p>
          )}
        </div>
      )}

      {/* Date of birth */}
      {show("date_of_birth") && (
        <div className="space-y-2">
          <Label className="text-sm">
            Date of birth{isOptional("date_of_birth") ? " (optional)" : ""}
            {fieldStates.date_of_birth === "mandatory" && (
              <span className="text-red-500">*</span>
            )}
          </Label>
          <DatePickerField
            valueStr={formik.values.date_of_birth}
            onChange={(iso) => formik.setFieldValue("date_of_birth", iso, true)}
            onBlur={() => formik.setFieldTouched("date_of_birth", true, true)}
          />
          {!!formik.touched.date_of_birth && !!formik.errors.date_of_birth && (
            <p className="text-xs text-red-500">
              {formik.errors.date_of_birth as string}
            </p>
          )}
        </div>
      )}

      {/* Gender */}
      {show("gender") && (
        <div className="space-y-2">
          <Label className="text-sm">
            Pronoun (gender){isOptional("gender") ? " (optional)" : ""}
            {fieldStates.gender === "mandatory" && (
              <span className="text-red-500">*</span>
            )}
          </Label>
          <div className="flex items-center gap-6 mt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={formik.values.gender === "female"}
                onChange={formik.handleChange}
                className="h-5 w-5 accent-blue-600 cursor-pointer"
              />
              <span className="text-sm">She/her (Female)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="male"
                checked={formik.values.gender === "male"}
                onChange={formik.handleChange}
                className="h-5 w-5 accent-blue-600 cursor-pointer"
              />
              <span className="text-sm">He/him (Male)</span>
            </label>
          </div>
          {formik.touched.gender && formik.errors.gender && (
            <p className="text-xs text-red-500">
              {formik.errors.gender as string}
            </p>
          )}
        </div>
      )}

      {/* Domicile */}
      {show("domicile") && (
        <div className="space-y-2 w-full">
          <Label className="text-sm">
            Domicile{isOptional("domicile") ? " (optional)" : ""}
            {fieldStates.domicile === "mandatory" && (
              <span className="text-red-500">*</span>
            )}
          </Label>
          <Select
            value={formik.values.domicile}
            onValueChange={(v) => formik.setFieldValue("domicile", v, true)}
            disabled={provLoading || !!provErr}
          >
            <SelectTrigger className="h-10 w-full justify-between">
              <SelectValue
                placeholder={
                  provLoading ? "Loading..." : "Choose your domicile"
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {provinces.map((p) => (
                <SelectItem
                  key={p.id}
                  value={p.name}
                  className="cursor-pointer"
                >
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {provErr && <p className="text-xs text-red-500">{provErr}</p>}
          {formik.touched.domicile && formik.errors.domicile && (
            <p className="text-xs text-red-500">
              {formik.errors.domicile as string}
            </p>
          )}
        </div>
      )}

      {/* Phone */}
      {show("phone_number") && (
        <div className="space-y-2">
          <Label className="text-sm">
            Phone number{isOptional("phone_number") ? " (optional)" : ""}
            {fieldStates.phone_number === "mandatory" && (
              <span className="text-red-500">*</span>
            )}
          </Label>
          <PhoneWithCountry
            value={formik.values.phone_number}
            onChange={(full) =>
              formik.setFieldValue("phone_number", full, true)
            }
            onBlur={() => formik.setFieldTouched("phone_number", true, true)}
          />
          {!!formik.touched.phone_number && !!formik.errors.phone_number && (
            <p className="text-xs text-red-500">
              {formik.errors.phone_number as string}
            </p>
          )}
        </div>
      )}

      {/* Email */}
      {show("email") && (
        <div className="space-y-2">
          <Label className="text-sm">
            Email{isOptional("email") ? " (optional)" : ""}
            {fieldStates.email === "mandatory" && (
              <span className="text-red-500">*</span>
            )}
          </Label>
          <Input
            type="email"
            name="email"
            placeholder="your@email.com"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {!!formik.touched.email && !!formik.errors.email && (
            <p className="text-xs text-red-500">
              {formik.errors.email as string}
            </p>
          )}
        </div>
      )}

      {/* LinkedIn */}
      {show("linkedin_link") && (
        <div className="space-y-2">
          <Label className="text-sm">
            Link LinkedIn{isOptional("linkedin_link") ? " (optional)" : ""}
            {fieldStates.linkedin_link === "mandatory" && (
              <span className="text-red-500">*</span>
            )}
          </Label>
          <Input
            name="linkedin_link"
            placeholder="https://linkedin.com/in/username"
            value={formik.values.linkedin_link}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {!!formik.touched.linkedin_link && !!formik.errors.linkedin_link && (
            <p className="text-xs text-red-500">
              {formik.errors.linkedin_link as string}
            </p>
          )}
        </div>
      )}

      <div className="border-t pt-4">
        <Button
          type="submit"
          disabled={!formik.isValid || isPending}
          className="w-full bg-[#03959f] hover:bg-[#01777F]"
        >
          {isPending ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </form>
  );
}
