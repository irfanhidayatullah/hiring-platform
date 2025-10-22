"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { Job } from "../types";
import ApplyForm from "./ApplyForm";

export default function JobDetails({
  selected,
  applied,
  applyOpen,
  setApplyOpen,
  onApplied,
}: {
  selected: Job;
  applied: boolean;
  applyOpen: boolean;
  setApplyOpen: (v: boolean) => void;
  onApplied: (jobId: string) => void;
}) {
  return (
    <div className="border rounded-xl p-6 bg-white shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 shrink-0 rounded-sm border border-gray-200 bg-white flex items-center justify-center overflow-hidden">
            {selected.company?.company_logo_url ? (
              <img
                src={selected.company.company_logo_url}
                alt="Company logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div>
            <span className="inline-block rounded bg-green-100 text-green-700 text-xs px-2 py-0.5 font-semibold">
              {selected.department
                ? selected.department
                    .split("_")
                    .map(
                      (w) =>
                        w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
                    )
                    .join("-")
                : "Full-Time"}
            </span>
            <h2 className="text-xl font-semibold mt-2">{selected.title}</h2>
            <p className="text-gray-600 text-sm">
              {selected.company?.company_name ?? "—"}
            </p>
          </div>
        </div>

        <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
          <DialogContent aria-describedby={undefined}>
            <div className="flex max-h-[85vh] w-full flex-col">
              <div className="border-b px-6 pt-5 pb-3">
                <DialogHeader>
                  <div className="flex items-start justify-between gap-4">
                    <DialogTitle className="text-base font-semibold text-[#1D1F20]">
                      Apply {selected?.title ?? ""}{" "}
                      {selected?.company?.company_name ? (
                        <>
                          at{" "}
                          <span className="font-semibold">
                            {selected.company.company_name}
                          </span>
                        </>
                      ) : null}
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-b from-[#8FB1C8] to-[#3F6F92] shadow-inner">
                        <span className="text-white text-[11px] font-bold leading-none">
                          i
                        </span>
                      </span>
                      <span className="text-[13px] text-[#404040]">
                        This field required to fill
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs font-medium text-[#E11428]">
                    * Required
                  </p>
                </DialogHeader>
              </div>

              <ApplyForm
                jobId={selected.id}
                onClose={() => setApplyOpen(false)}
                onApplied={onApplied}
              />
            </div>
          </DialogContent>
        </Dialog>

        <Button
          onClick={() => setApplyOpen(true)}
          disabled={applied}
          className={[
            "rounded px-4 py-2 text-sm font-semibold transition",
            applied
              ? "bg-gray-200 text-gray-600 cursor-default"
              : "bg-[#FBC038] text-[#404040] hover:bg-[#F8A92F]",
          ].join(" ")}
        >
          {applied ? "Applied" : "Apply"}
        </Button>
      </div>

      <hr className="my-4 border-gray-200" />

      <div className="text-gray-700 text-sm leading-relaxed">
        {selected.description ? (
          <ul className="list-disc pl-5 space-y-1">
            {selected.description.split("\n").map((li, i) => (
              <li key={i}>{li}</li>
            ))}
          </ul>
        ) : (
          <div>-</div>
        )}
      </div>
    </div>
  );
}
