"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/utils/supabase/client";
import HeaderUserMenu from "./components/HeaderUserMenu";
import JobCard from "./components/JobCard";
import JobDetails from "./components/JobDetails";
import { Job } from "./types";

export default function JobListPage() {
  const sb = createBrowserSupabase();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selected, setSelected] = useState<Job | null>(null);
  const [fullName, setFullName] = useState("");
  const [applyOpen, setApplyOpen] = useState(false);
  const [appliedSet, setAppliedSet] = useState<Set<string>>(new Set());
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!session) {
        window.location.href = "/login";
        return;
      }
      const { data } = await sb
        .from("users")
        .select("full_name, company_logo_url")
        .eq("id", session.user.id)
        .single();
      setFullName(data?.full_name ?? "User");
      setCompanyLogoUrl(data?.company_logo_url ?? null);
    };
    loadUser();
  }, [sb]);

  const fetchJobs = async () => {
    const { data, error } = await sb
      .from("jobs")
      .select(
        `
        id, title, department, description, location,
        salary_min, salary_max, currency, status, created_at,
        company:users!jobs_users_id_fkey ( company_name, company_logo_url, location )
      `
      )
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setJobs([]);
      return;
    }

    const normalized = (data ?? []).map((row: any) => ({
      ...row,
      company: Array.isArray(row.company)
        ? row.company[0] ?? null
        : row.company,
    })) as Job[];

    setJobs(normalized);
    setSelected((prev) => prev ?? normalized[0] ?? null);
  };

  useEffect(() => {
    fetchJobs();
  }, []); // eslint-disable-line

  useEffect(() => {
    const loadApplied = async () => {
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!session) return;
      const { data } = await sb
        .from("candidates")
        .select("job_id")
        .eq("applicant_id", session.user.id);
      setAppliedSet(new Set((data ?? []).map((r: any) => r.job_id)));
    };
    loadApplied();
  }, [sb]);

  const selectedApplied = useMemo(
    () => (selected ? appliedSet.has(selected.id) : false),
    [appliedSet, selected]
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">
            Job Opportunities
          </h1>
          <HeaderUserMenu fullName={fullName} companyLogoUrl={companyLogoUrl} />
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-6 py-8">
        <div className="col-span-4 border-r max-h-[calc(100vh-150px)] overflow-y-auto scrollbar-teal pr-4 space-y-3">
          {jobs.length === 0 ? (
            <div className="text-sm text-gray-500">No active jobs.</div>
          ) : (
            jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                active={selected?.id === job.id}
                onClick={() => setSelected(job)}
              />
            ))
          )}
        </div>

        <div className="col-span-8">
          {selected ? (
            <JobDetails
              selected={selected}
              applied={selectedApplied}
              applyOpen={applyOpen}
              setApplyOpen={setApplyOpen}
              onApplied={(jobId) => setAppliedSet((s) => new Set(s).add(jobId))}
            />
          ) : (
            <div className="flex items-center justify-center text-gray-500 h-full">
              Select a job to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
