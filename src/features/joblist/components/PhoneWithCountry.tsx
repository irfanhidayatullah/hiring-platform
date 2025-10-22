"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { COUNTRIES } from "../constants";

export default function PhoneWithCountry({
  value,
  onChange,
  onBlur,
}: {
  value: string;
  onChange: (full: string) => void;
  onBlur?: () => void;
}) {
  const defaultCountry = COUNTRIES[0];

  const parse = (v: string) => {
    const m = v?.match(/^(\+\d+)\s?(.*)$/);
    const dial = m?.[1] ?? defaultCountry.dial;
    const local = m?.[2] ?? "";
    const c = COUNTRIES.find((x) => x.dial === dial) ?? defaultCountry;
    return { dial, local, flag: c.flag };
  };

  const init = parse(value);
  const [dial, setDial] = React.useState(init.dial);
  const [flag, setFlag] = React.useState(init.flag);
  const [local, setLocal] = React.useState(init.local);

  React.useEffect(() => {
    const p = parse(value);
    setDial(p.dial);
    setFlag(p.flag);
    setLocal(p.local);
  }, [value]);

  React.useEffect(() => {
    onChange(local ? `${dial} ${local}` : "");
  }, [dial, local]);

  const onlyDigits = (s: string) => s.replace(/[^\d]/g, "");

  return (
    <div
      className="flex items-center gap-2 rounded-2xl border border-gray-300 bg-white px-2 py-1"
      onBlur={onBlur}
    >
      <Select
        value={dial}
        onValueChange={(v) => {
          const c = COUNTRIES.find((x) => x.dial === v) ?? defaultCountry;
          setDial(c.dial);
          setFlag(c.flag);
        }}
      >
        <SelectTrigger className="h-10 w-[56px] rounded-xl border-0 bg-transparent px-0 justify-center">
          <div className="h-6 w-6 rounded-full bg-white ring-1 ring-[#E5E7EB] flex items-center justify-center shadow-[inset_0_0_0_2px_rgba(0,0,0,0.02)]">
            <span className="text-[14px] leading-none object-cover">
              {flag}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {COUNTRIES.map((c) => (
            <SelectItem key={c.code} value={c.dial} className="cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">{c.flag}</span>
                <span className="min-w-[56px]">{c.dial}</span>
                <span className="text-gray-600">{c.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="h-6 w-px bg-gray-300" aria-hidden />
      <div className="flex flex-1 items-center">
        <span className="pl-2 pr-2 text-sm text-[#1D1F20]">{dial}</span>
        <input
          inputMode="numeric"
          className="h-10 flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400"
          placeholder="81XXXXXXXXX"
          value={local}
          onChange={(e) => setLocal(onlyDigits(e.target.value))}
        />
      </div>
    </div>
  );
}
