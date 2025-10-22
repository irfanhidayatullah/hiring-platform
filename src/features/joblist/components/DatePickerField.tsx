"use client";

import dynamic from "next/dynamic";
import { ChevronDown, CalendarDays } from "lucide-react";
import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarValue } from "../types";

const ReactCalendar = dynamic(() => import("react-calendar"), { ssr: false });

export default function DatePickerField({
  valueStr,
  onChange,
  onBlur,
}: {
  valueStr: string;
  onChange: (iso: string) => void;
  onBlur?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const valueDate = valueStr ? new Date(valueStr) : null;

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const handleSelect = (v: CalendarValue) => {
    if (!v) return;
    onChange(fmt(v));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onBlur={onBlur}
          className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm hover:bg-gray-50 focus:outline-none"
        >
          <div className="gap-3 flex items-center">
            <CalendarDays className="h-4 w-4 text-gray-500" />
            <span className={valueDate ? "text-[#1D1F20]" : "text-gray-400"}>
              {valueDate
                ? valueDate.toLocaleDateString()
                : "Select date of birth"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="p-0 rounded-2xl shadow-lg w-[376px]"
      >
        <div
          className="rounded-2xl bg-white overflow-hidden"
          style={{ width: 376, height: 220 }}
        >
          <ReactCalendar
            onChange={(val: any) => handleSelect(val as Date)}
            value={valueDate}
            maxDate={new Date()}
            prev2Label="«"
            next2Label="»"
            nextLabel="›"
            prevLabel="‹"
            minDetail="century"
            className="rcard"
          />
        </div>

        <style jsx global>{`
          .rcard {
            width: 100% !important;
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            border: none !important;
            background: transparent !important;
            font-family: inherit;
          }
          .rcard > .react-calendar__navigation,
          .rcard > .react-calendar__viewContainer {
            padding: 10px 12px 12px 12px;
          }
          .rcard .react-calendar__navigation {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: 0 !important;
            height: 36px;
          }
          .rcard .react-calendar__navigation button {
            min-width: 28px !important;
            height: 28px !important;
            border-radius: 8px;
            font-size: 13px;
          }
          .rcard .react-calendar__navigation__label {
            flex: 1;
            text-align: center;
            font-weight: 600;
            font-size: 14px;
          }
          .rcard .react-calendar__navigation button:enabled:hover {
            background: #f3f4f6 !important;
          }
          .rcard .react-calendar__viewContainer {
            flex: 1 1 auto;
            height: calc(100% - 36px);
          }
          .rcard .react-calendar__month-view__weekdays {
            display: grid !important;
            grid-template-columns: repeat(7, 1fr);
            margin-bottom: 6px;
            padding: 0;
          }
          .rcard .react-calendar__month-view__weekdays__weekday {
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            padding: 0;
          }
          .rcard .react-calendar__month-view__weekdays__weekday abbr[title] {
            text-decoration: none;
          }
          .rcard .react-calendar__month-view__days {
            display: grid !important;
            grid-template-columns: repeat(7, 1fr);
            grid-auto-rows: 26px;
            gap: 2px;
          }
          .rcard .react-calendar__year-view__months,
          .rcard .react-calendar__decade-view__years,
          .rcard .react-calendar__century-view__decades {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr);
            grid-auto-rows: 30px;
            gap: 6px 18px;
            align-content: start;
            margin-top: 4px;
          }
          .rcard .react-calendar__tile {
            border-radius: 8px;
            padding: 0 !important;
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .rcard .react-calendar__tile:enabled:hover {
            background: #f4f6f8 !important;
          }
          .rcard .react-calendar__tile--now {
            background: #f0fbfc !important;
          }
          .rcard .react-calendar__tile--active {
            background: #ebf6f7 !important;
            font-weight: 600;
            color: #1d1f20;
          }
          .rcard .react-calendar__month-view__days__day--neighboringMonth {
            color: #c0c4cc !important;
          }
          .rcard .react-calendar__viewContainer > div {
            height: 100%;
          }
        `}</style>
      </PopoverContent>
    </Popover>
  );
}
