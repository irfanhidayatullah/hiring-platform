"use client";

import LogoutButton from "@/components/logoutbutton";
import { User2 } from "lucide-react";
import React from "react";
import Image from "next/image";

type Props = {
  fullName: string;
  companyLogoUrl?: string | null;
};

export default function HeaderUserMenu({ fullName, companyLogoUrl }: Props) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.("#jobseeker-user-menu")) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div id="jobseeker-user-menu" className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 ring-1 ring-gray-200 hover:bg-gray-200 overflow-hidden"
        aria-haspopup="menu"
        aria-expanded={open}
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

      {open && (
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
  );
}
