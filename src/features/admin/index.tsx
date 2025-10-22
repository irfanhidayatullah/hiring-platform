"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/utils/supabase/client";
import { Search, User2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useFormik } from "formik";
import useCreateJob, {
  type CreateJobPayload,
} from "@/hooks/api/auth/useCreateJob";
import { CreateJobSchema } from "./schemas/CreateJobSchema";
import LogoutButton from "@/components/logoutbutton";
import Image from "next/image";

export type JobStatus = "active" | "inactive" | "draft";

export type Job = {
  id: string;
  slug: string;
  title: string;
  location?: string | null;
  department?: string | null;
  status: JobStatus;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string | null;
  created_at: string;
};

type FieldState = "mandatory" | "optional" | "off";
type ProfileFieldKey =
  | "full_name"
  | "email"
  | "linkedin_link"
  | "domicile"
  | "photo_profile"
  | "gender"
  | "phone_number"
  | "date_of_birth";

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export default function AdminPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState<string>("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { mutateAsync: createJob, isPending: isCreating } = useCreateJob();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const openModal = () => setOpen(true);

  const [profileFields, setProfileFields] = useState<
    Record<ProfileFieldKey, FieldState>
  >({
    full_name: "mandatory",
    photo_profile: "mandatory",
    gender: "mandatory",
    domicile: "optional",
    email: "mandatory",
    phone_number: "mandatory",
    linkedin_link: "mandatory",
    date_of_birth: "optional",
  });

  const setField = (k: ProfileFieldKey, v: FieldState) =>
    setProfileFields((s) => ({ ...s, [k]: v }));

  const currencyOnly = (v: string) =>
    v.replace(/[^0-9]/g, "").replace(/^0+/, "");

  const formik = useFormik<CreateJobPayload>({
    initialValues: {
      title: "",
      department: "",
      description: "",
      needed: "",
      salary_min: "",
      salary_max: "",
      status: "active",
      currency: "IDR",
    },
    validationSchema: CreateJobSchema,
    validateOnMount: true,
    onSubmit: async (values, helpers) => {
      const inserted = await createJob(values);

      if (inserted?.id) {
        const sb = createBrowserSupabase();
        await sb.from("job_configs").insert({
          job_id: inserted.id,
          config_json: {
            application_form: {
              sections: [
                {
                  title: "Minimum Profile Information Required",
                  fields: (
                    Object.entries(profileFields) as [
                      ProfileFieldKey,
                      FieldState
                    ][]
                  ).map(([key, state]) => ({ key, state })),
                },
              ],
            },
          },
        });
      }

      setOpen(false);
      helpers.resetForm();
      fetchJobs();
    },
  });

  const numericGuard = (field: keyof CreateJobPayload, raw: string) => {
    formik.setFieldValue(field, raw.replace(/[^0-9]/g, ""));
  };

  const isSalaryOrderValid = useMemo(() => {
    const min = Number(formik.values.salary_min || 0);
    const max = Number(formik.values.salary_max || 0);
    if (!min || !max) return false;
    return min <= max;
  }, [formik.values.salary_min, formik.values.salary_max]);

  const overallValid =
    formik.isValid &&
    formik.values.title.trim() &&
    formik.values.department &&
    formik.values.description.trim() &&
    formik.values.needed &&
    formik.values.salary_min &&
    formik.values.salary_max &&
    isSalaryOrderValid;

  useEffect(() => {
    const checkRole = async () => {
      const sb = createBrowserSupabase();
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      const { data: profile } = await sb
        .from("users")
        .select("user_roles, full_name, company_logo_url")
        .eq("id", session.user.id)
        .single();

      if (profile?.user_roles !== "ADMIN") {
        router.replace("/joblist");
        return;
      }
      setFullName(profile?.full_name ?? "");
      setCompanyLogoUrl(profile?.company_logo_url ?? null);
      setAllowed(true);
    };
    checkRole();
  }, [router]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.("#admin-user-menu")) setUserMenuOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [userMenuOpen]);

  const fetchJobs = async () => {
    setLoading(true);
    const sb = createBrowserSupabase();
    try {
      const { data } = await sb
        .from("jobs")
        .select(
          "id, slug, title, location, department, status, created_at, salary_min, salary_max, currency"
        )
        .order("created_at", { ascending: false })
        .throwOnError();
      setJobs((data ?? []) as Job[]);
    } catch (e) {
      console.error("Fetch jobs failed:", e);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filtered = useMemo(() => {
    return (jobs ?? []).filter((j) =>
      [
        j.title,
        j.location,
        j.department,
        j.status,
        j.salary_min,
        j.salary_max,
        j.currency,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase())
    );
  }, [jobs, q]);

  if (allowed === null)
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600 text-sm">
          <svg
            className="h-5 w-5 animate-spin text-[#01959F]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          <p className="flex items-center gap-[1px]">
            Checking permission
            <span className="ml-1 inline-flex">
              <span className="animate-pulse [animation-delay:0ms]">.</span>
              <span className="animate-pulse [animation-delay:200ms]">.</span>
              <span className="animate-pulse [animation-delay:400ms]">.</span>
            </span>
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 relative">
          <h1 className="text-lg font-semibold tracking-tight">Job List</h1>

          <div id="admin-user-menu" className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((s) => !s)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 ring-1 ring-gray-200 hover:bg-gray-200"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              aria-label="User menu"
            >
              {companyLogoUrl ? (
                <Image
                  src={companyLogoUrl}
                  alt="Company Logo"
                  width={36}
                  height={36}
                  className="object-cover rounded-full"
                />
              ) : (
                <User2 className="h-5 w-5 text-gray-600" />
              )}
            </button>

            {userMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-fit rounded-xl border border-gray-200 bg-white shadow-lg focus:outline-none"
              >
                <div className="px-4 py-3 border-b whitespace-nowrap">
                  <p className="text-xs text-gray-500">Signed in as</p>
                  <p className="mt-0.5 text-sm font-medium text-gray-900 line-clamp-1">
                    {fullName || "User"}
                  </p>
                </div>
                <div className="p-2">
                  <LogoutButton />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-12">
        <div className="lg:col-span-9">
          <div className="rounded-xl border border-gray-200 px-3 py-2 flex items-center justify-between gap-2 focus-within:ring-1 focus-within:ring-[#01959F]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by job details"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400"
              aria-label="Search jobs"
            />
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#01959F] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#01959F]"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>

          <div className="my-3">
            {loading ? (
              <LoadingState />
            ) : filtered.length === 0 ? (
              <EmptyState onCreate={openModal} />
            ) : (
              <ul>
                {filtered.map((job) => (
                  <li key={job.id} className="mb-3">
                    <JobCard job={job} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="lg:col-span-3">
          <PromoCard onCreate={openModal} />
        </aside>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="w-[95vw] max-w-[880px] p-0 sm:max-w-[880px]"
          aria-describedby={undefined}
        >
          <div className="flex max-h-[85vh] w-full flex-col">
            <div className="border-b px-6 pt-5 pb-3">
              <DialogHeader>
                <DialogTitle className="text-base">Job Opening</DialogTitle>
              </DialogHeader>
            </div>

            <form
              onSubmit={formik.handleSubmit}
              className="flex-1 overflow-y-auto px-6 pb-6 pt-4 space-y-5"
            >
              <div className="space-y-2">
                <Label className="text-sm">
                  Job Name<span className="text-red-500">*</span>
                </Label>
                <Input
                  name="title"
                  placeholder="Ex. Front End Engineer"
                  value={formik.values.title}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {!!formik.touched.title && !!formik.errors.title ? (
                  <p className="text-xs text-red-500">
                    {formik.errors.title as string}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="text-sm">
                  Job Type<span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formik.values.department}
                  onValueChange={(v) => formik.setFieldValue("department", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="part_time">Part-time</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
                {!!formik.touched.department && !!formik.errors.department ? (
                  <p className="text-xs text-red-500">
                    {formik.errors.department as string}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="text-sm">
                  Job Description<span className="text-red-500">*</span>
                </Label>
                <Textarea
                  name="description"
                  rows={4}
                  placeholder="Ex."
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {!!formik.touched.description && !!formik.errors.description ? (
                  <p className="text-xs text-red-500">
                    {formik.errors.description as string}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="text-sm">
                  Number of Candidate Needed
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  name="needed"
                  inputMode="numeric"
                  placeholder="Ex. 2"
                  value={formik.values.needed}
                  onChange={(e) => numericGuard("needed", e.target.value)}
                  onBlur={formik.handleBlur}
                />
                {!!formik.touched.needed && !!formik.errors.needed ? (
                  <p className="text-xs text-red-500">
                    {formik.errors.needed as string}
                  </p>
                ) : null}
              </div>

              <hr className="border-dashed" />

              <div className="space-y-2">
                <Label className="text-sm">Job Salary</Label>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <div className="text-xs text-gray-500">
                      Minimum Estimated Salary
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                        Rp
                      </span>
                      <Input
                        name="salary_min"
                        className="pl-9"
                        inputMode="numeric"
                        placeholder="7.000.000"
                        value={formik.values.salary_min}
                        onChange={(e) =>
                          formik.setFieldValue(
                            "salary_min",
                            currencyOnly(e.target.value)
                          )
                        }
                        onBlur={formik.handleBlur}
                      />
                    </div>
                    {!!formik.touched.salary_min &&
                    !!formik.errors.salary_min ? (
                      <p className="text-xs text-red-500">
                        {formik.errors.salary_min as string}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs text-gray-500">
                      Maximum Estimated Salary
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                        Rp
                      </span>
                      <Input
                        name="salary_max"
                        className="pl-9"
                        inputMode="numeric"
                        placeholder="8.000.000"
                        value={formik.values.salary_max}
                        onChange={(e) =>
                          formik.setFieldValue(
                            "salary_max",
                            currencyOnly(e.target.value)
                          )
                        }
                        onBlur={formik.handleBlur}
                      />
                    </div>
                    {!!formik.touched.salary_max &&
                    !!formik.errors.salary_max ? (
                      <p className="text-xs text-red-500">
                        {formik.errors.salary_max as string}
                      </p>
                    ) : null}

                    {formik.values.salary_min &&
                      formik.values.salary_max &&
                      !isSalaryOrderValid && (
                        <p className="text-xs text-red-500">
                          Minimum salary should not be greater than maximum
                          salary.
                        </p>
                      )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border">
                  <div className="px-4 py-3 text-sm font-semibold mb-3">
                    Minimum Profile Information Required
                  </div>

                  <table className="w-full text-sm">
                    <colgroup>
                      <col />
                      <col className="w-[340px]" />
                    </colgroup>
                    <tbody>
                      {(
                        [
                          ["full_name", "Full name"],
                          ["photo_profile", "Photo Profile"],
                          ["gender", "Gender"],
                          ["domicile", "Domicile"],
                          ["email", "Email"],
                          ["phone_number", "Phone number"],
                          ["linkedin_link", "LinkedIn link"],
                          ["date_of_birth", "Date of birth"],
                        ] as [ProfileFieldKey, string][]
                      ).map(([k, label], i) => (
                        <React.Fragment key={k}>
                          {i > 0 && (
                            <tr aria-hidden>
                              <td colSpan={2} className="py-0">
                                <div className="mx-8 h-px bg-gray-200" />
                              </td>
                            </tr>
                          )}
                          <tr>
                            <td className="px-8 py-3 text-gray-700">{label}</td>
                            <td className="px-8 py-3">
                              <div className="flex justify-end">
                                <TriState
                                  value={profileFields[k]}
                                  onChange={(v) => setField(k, v)}
                                />
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t px-6 py-4 flex items-center justify-end gap-2">
                <Button
                  type="submit"
                  disabled={!overallValid || isCreating}
                  className="bg-[#03959f] hover:bg-[#01777F] hover:cursor-pointer disabled:opacity-60"
                >
                  {isCreating ? "Publishing..." : "Publish Job"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="animate-pulse text-sm text-gray-500">Loading jobs…</div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <svg
        viewBox="0 0 200 140"
        className="mb-6 h-44 w-auto text-gray-300"
        aria-hidden="true"
      >
        <rect
          x="20"
          y="50"
          width="80"
          height="55"
          rx="10"
          className="fill-gray-200"
        />
        <circle cx="120" cy="50" r="20" className="fill-gray-200" />
        <rect
          x="110"
          y="72"
          width="60"
          height="8"
          rx="4"
          className="fill-gray-200"
        />
        <rect
          x="110"
          y="86"
          width="40"
          height="8"
          rx="4"
          className="fill-gray-200"
        />
      </svg>
      <p className="text-base font-semibold text-gray-700">
        No job openings available
      </p>
      <p className="mt-1 max-w-sm text-sm text-gray-500">
        Create a job opening now and start the candidate process.
      </p>
      <button
        onClick={onCreate}
        className="mt-6 inline-flex items-center rounded-sm bg-[#fbc038] py-[7px] px-[16px] text-sm font-semibold text-[#404040] shadow transition hover:bg-[#F8A92F] focus:outline-none focus:ring-4 focus:ring-amber-200 hover:cursor-pointer"
      >
        Create a new job
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: JobStatus }) {
  const map: Record<JobStatus, string> = {
    active: "bg-[#f8fbf9] text-[#43936C] ring-[#B8DBCA]",
    inactive: "bg-[#fffafa] text-[#E11428] ring-[#F5B1B7]",
    draft: "bg-[#fffcf5] text-[#FBC037] ring-[#FEEABC]",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center text-center rounded-sm px-2.5 py-1 text-xs font-medium ring-1",
        map[status]
      )}
    >
      {status[0].toUpperCase() + status.slice(1)}
    </span>
  );
}

function JobCard({ job }: { job: Job }) {
  return (
    <div className="rounded-2xl border border-gray-200 p-5 shadow-sm transition hover:shadow-md">
      <div className="flex gap-3">
        <StatusBadge status={job.status} />
        <span className="inline-flex items-center text-center rounded-xs px-2.5 py-1 text-xs font-medium ring-1 ring-[#E0E0E0] text-[#404040]">
          started on {new Date(job.created_at).toLocaleDateString()}
        </span>
      </div>
      <h3 className="line-clamp-1 text-sm font-semibold text-[#1D1F20] mt-3">
        {job.title}
      </h3>
      <div className="flex justify-between">
        <p className="text-sm text-gray-500 mt-3">
          {`Rp${new Intl.NumberFormat("id-ID").format(
            Number(job.salary_min ?? 0)
          )} - Rp${new Intl.NumberFormat("id-ID").format(
            Number(job.salary_max ?? 0)
          )}`}
        </p>
        <Link href={`/admin/jobs/${job.slug}`}>
          <span className="text-xs bg-[#01959F] py-[4px] px-[16px] text-white rounded-sm font-semibold">
            Manage Job
          </span>
        </Link>
      </div>
    </div>
  );
}

function PromoCard({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gray-900 text-white shadow-lg">
      <img
        src="hiring.jpg"
        alt="Team meeting"
        className="absolute inset-0 h-full w-full object-cover opacity-50"
      />
      <div className="relative p-5">
        <p className="text-sm font-semibold">Recruit the best candidates</p>
        <p className="text-xs  mt-1">Create jobs, invite, and hire with ease</p>
        <button
          onClick={onCreate}
          className="inline-flex w-full items-center justify-center rounded-sm bg-[#01959F] px-4 py-2 text-xs font-semibold text-white shadow hover:cursor-pointer mt-5 hover:bg-[#01777F]"
        >
          Create a new job
        </button>
      </div>
    </div>
  );
}

function TriState({
  value,
  onChange,
}: {
  value: FieldState;
  onChange: (v: FieldState) => void;
}) {
  const opts: { key: FieldState; label: string }[] = [
    { key: "mandatory", label: "Mandatory" },
    { key: "optional", label: "Optional" },
    { key: "off", label: "Off" },
  ];

  const base =
    "rounded-full px-4 py-1.5 text-xs font-medium transition-colors border";

  return (
    <div className="flex items-center gap-2">
      {opts.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={
              active
                ? `${base} border-[#03959f] text-[#03959f] bg-white`
                : `${base} border-gray-300 text-gray-500 bg-white hover:bg-gray-100 hover:cursor-pointer`
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
