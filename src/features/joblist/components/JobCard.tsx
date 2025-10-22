"use client";

import { Image as ImageIcon, MapPin, Wallet } from "lucide-react";
import { Job } from "../types";
import React from "react";
import Image from "next/image";

export default function JobCard({
  job,
  active,
  onClick,
}: {
  job: Job;
  active: boolean;
  onClick: () => void;
}) {
  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min || !max) return "Negotiable";
    const f = (n: number) => new Intl.NumberFormat("id-ID").format(n);
    return `Rp${f(min)} - Rp${f(max)}`;
  };
  return (
    <button
      onClick={onClick}
      className={[
        "w-full text-left transition rounded-xl border-2 p-3 mr-1",
        active
          ? "border-[#1E7D83] bg-[#F4FBFB] shadow-[0_0_0_2px_rgba(30,125,131,0.06)]"
          : "border-gray-200 bg-white hover:shadow-sm",
      ].join(" ")}
    >
      <div className="relative">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 shrink-0 rounded-sm border border-gray-200 bg-white flex items-center justify-center overflow-hidden relative">
            {job.company?.company_logo_url ? (
              <Image
                src={job.company.company_logo_url}
                alt="Company"
                fill
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-[#404040] leading-5 line-clamp-1">
              {job.title}
            </div>
            <div className="text-[13px] text-[#6C6C6C] line-clamp-1">
              {job.company?.company_name ?? "—"}
            </div>
          </div>
        </div>

        <div className="my-3 h-px border-t border-dashed border-gray-300" />

        <div>
          <div className="flex items-center gap-2 text-[13px] text-[#6C6C6C]">
            <MapPin className="h-[14px] w-[14px]" />
            <span className="truncate">
              {job.company?.location ?? "Location not specified"}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[13px] text-[#6C6C6C]">
            <Wallet className="h-[14px] w-[14px]" />
            <span className="truncate">
              {formatSalary(job.salary_min, job.salary_max)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
