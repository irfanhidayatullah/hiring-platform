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
import { ApplyJobSchema } from "@/features/joblist/schemas/ApplyJobSchema";
import useApplyJob from "@/hooks/api/job/useApplyJob";
import { useFormik } from "formik";
import React from "react";
import DatePickerField from "./DatePickerField";
import PhoneWithCountry from "./PhoneWithCountry";
import HandCaptureModal from "./HandCaptureModal";

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

  type Province = { id: string; name: string };
  const [provinces, setProvinces] = React.useState<Province[]>([]);
  const [provLoading, setProvLoading] = React.useState(false);
  const [provErr, setProvErr] = React.useState<string | null>(null);

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
    validationSchema: ApplyJobSchema,
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
      });
      helpers.resetForm();
      onApplied(jobId);
      onClose();
    },
  });

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="flex-1 overflow-y-auto px-6 pb-6 pt-4 space-y-5"
    >
      <div className="space-y-2">
        <div className="text-sm font-medium text-[#1D1F20]">Photo Profile</div>
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

      <div className="space-y-2">
        <Label className="text-sm">
          Full name<span className="text-red-500">*</span>
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

      <div className="space-y-2">
        <Label className="text-sm">
          Date of birth<span className="text-red-500">*</span>
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

      <div className="space-y-2">
        <Label className="text-sm">
          Pronoun (gender)<span className="text-red-500">*</span>
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

      <div className="space-y-2 w-full">
        <Label className="text-sm">
          Domicile<span className="text-red-500">*</span>
        </Label>
        <Select
          value={formik.values.domicile}
          onValueChange={(v) => formik.setFieldValue("domicile", v, true)}
          disabled={provLoading || !!provErr}
        >
          <SelectTrigger className="h-10 w-full justify-between">
            <SelectValue
              placeholder={provLoading ? "Loading..." : "Choose your domicile"}
            />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {provinces.map((p) => (
              <SelectItem key={p.id} value={p.name} className="cursor-pointer">
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

      <div className="space-y-2">
        <Label className="text-sm">
          Phone number<span className="text-red-500">*</span>
        </Label>
        <PhoneWithCountry
          value={formik.values.phone_number}
          onChange={(full) => formik.setFieldValue("phone_number", full, true)}
          onBlur={() => formik.setFieldTouched("phone_number", true, true)}
        />
        {!!formik.touched.phone_number && !!formik.errors.phone_number && (
          <p className="text-xs text-red-500">
            {formik.errors.phone_number as string}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm">
          Email<span className="text-red-500">*</span>
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

      <div className="space-y-2">
        <Label className="text-sm">
          Link LinkedIn<span className="text-red-500">*</span>
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
