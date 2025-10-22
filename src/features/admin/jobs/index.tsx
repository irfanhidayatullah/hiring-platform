"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/utils/supabase/client";
import { Search, User2 } from "lucide-react";
import LogoutButton from "@/components/logoutbutton";

type Job = {
  id: string;
  title: string;
  slug: string;
};

type CandidateRow = {
  id: string;
  created_at: string;
  applicant: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
  candidate_attributes: {
    key: string;
    label: string;
    value: string | null;
  }[];
};

type ApplicantView = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone_number?: string;
  date_of_birth?: string;
  domicile?: string;
  gender?: string;
  linkedin_link?: string;
};

interface JobApplicantListPageProps {
  jobSlug: string;
}

const JobApplicantListPage: React.FC<JobApplicantListPageProps> = ({
  jobSlug,
}) => {
  const router = useRouter();
  const sb = useMemo(() => createBrowserSupabase(), []);

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [job, setJob] = useState<Job | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);

  const [candidates, setCandidates] = useState<ApplicantView[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);

  const [q, setQ] = useState("");

  useEffect(() => {
    const checkRole = async () => {
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await sb
        .from("users")
        .select("user_roles, full_name")
        .eq("id", session.user.id)
        .single();

      if (profile?.user_roles !== "ADMIN") {
        router.replace("/joblist");
        return;
      }

      setFullName(profile?.full_name ?? "");
      setAllowed(true);
    };
    checkRole();
  }, [router, sb]);

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

  useEffect(() => {
    if (!allowed) return;
    const fetchJob = async () => {
      setLoadingJob(true);
      const { data, error } = await sb
        .from("jobs")
        .select("id, title, slug")
        .eq("slug", jobSlug)
        .single();

      if (error) console.error("Failed to load job:", error);
      setJob(data as Job);
      setLoadingJob(false);
    };
    fetchJob();
  }, [allowed, jobSlug, sb]);

  useEffect(() => {
    if (!job?.id) return;
    const fetchCandidates = async () => {
      setLoadingCandidates(true);
      const { data, error } = await sb
        .from("candidates")
        .select(
          `
        id,
        created_at,
        applicant:users!candidates_applicant_id_fkey (
          id,
          full_name,
          email
        ),
        candidate_attributes (
          key,
          label,
          value
        )
      `
        )
        .eq("job_id", job.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to load candidates:", error);
        setCandidates([]);
        setLoadingCandidates(false);
        return;
      }

      const rows = (data ?? []) as any[];

      const formatted: ApplicantView[] = rows.map((row) => {
        const applicantRaw = Array.isArray(row.applicant)
          ? row.applicant[0]
          : row.applicant;

        const attrMap: Record<string, string | undefined> = {};
        for (const attr of (row.candidate_attributes ?? []) as any[]) {
          const k = String(attr.key ?? "")
            .trim()
            .toLowerCase();
          if (k) attrMap[k] = attr.value ?? undefined;
        }

        return {
          id: String(row.id),
          created_at: String(row.created_at),
          full_name: (applicantRaw?.full_name as string) ?? "-",
          email: (applicantRaw?.email as string) ?? "-",
          phone_number: attrMap["phone_number"],
          date_of_birth: attrMap["date_of_birth"],
          domicile: attrMap["domicile"],
          gender: attrMap["gender"],
          linkedin_link: attrMap["linkedin_link"],
        };
      });

      setCandidates(formatted);
      setLoadingCandidates(false);
    };
    fetchCandidates();
  }, [job?.id, sb]);

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    if (!key) return candidates;
    return candidates.filter((c) =>
      [
        c.full_name,
        c.email,
        c.phone_number,
        c.date_of_birth,
        c.domicile,
        c.gender,
        c.linkedin_link,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(key)
    );
  }, [candidates, q]);

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
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/admin" className="hover:underline">
              Job List
            </Link>
            <span>›</span>
            <span className="text-gray-900 font-medium">Manage Candidate</span>
          </div>

          <div id="admin-user-menu" className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((s) => !s)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 ring-1 ring-gray-200 hover:bg-gray-200"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              aria-label="User menu"
            >
              <User2 className="h-5 w-5 text-gray-600" />
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

      <div className="mx-auto max-w-7xl px-6 pt-6">
        {loadingJob ? (
          <div className="animate-pulse h-6 w-48 rounded bg-gray-100" />
        ) : job ? (
          <h1 className="text-lg font-semibold tracking-tight">{job.title}</h1>
        ) : (
          <div className="text-sm text-red-600">
            Job not found.{" "}
            <Link href="/admin" className="underline">
              Back to Job List
            </Link>
          </div>
        )}
      </div>

      {/* Search
      <div className="mx-auto max-w-7xl px-6 mt-4">
        <div className="rounded-xl border border-gray-200 px-3 py-2 flex items-center justify-between gap-2 focus-within:ring-1 focus-within:ring-[#01959F]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search candidate by name, email, phone, etc."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400"
            aria-label="Search candidates"
          />
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#01959F]"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div> */}

      <div className="mx-auto max-w-7xl px-6 py-6">
        {loadingCandidates ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-pulse text-sm text-gray-500">
              Loading candidates…
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Nama Lengkap</th>
                  <th className="px-4 py-3 text-left">Email Address</th>
                  <th className="px-4 py-3 text-left">Phone Number</th>
                  <th className="px-4 py-3 text-left">Date of Birth</th>
                  <th className="px-4 py-3 text-left">Domicile</th>
                  <th className="px-4 py-3 text-left">Gender</th>
                  <th className="px-4 py-3 text-left">LinkedIn</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t hover:bg-gray-50/60 transition"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {row.full_name || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.email || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.phone_number || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.date_of_birth
                        ? new Date(row.date_of_birth).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            }
                          )
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.domicile || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.gender || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {row.linkedin_link ? (
                        <a
                          href={row.linkedin_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#01959F] underline"
                        >
                          {row.linkedin_link}
                        </a>
                      ) : (
                        <span className="text-gray-700">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobApplicantListPage;

function EmptyState() {
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
        No candidates found
      </p>
      <p className="mt-1 max-w-sm text-sm text-gray-500">
        Share your job vacancy so that more candidates can apply.
      </p>
    </div>
  );
}
