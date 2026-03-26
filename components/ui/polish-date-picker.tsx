"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MONTHS_PL = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

const DAYS_PL = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];

interface PolishDatePickerProps {
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatToDisplay(isoDate: string): string {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length !== 3) return "";
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function parseDisplayToIso(display: string): string | null {
  const cleaned = display.replace(/\s/g, "");
  const match = cleaned.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const day = parseInt(d, 10);
  const month = parseInt(m, 10);
  const year = parseInt(y, 10);
  if (month < 1 || month > 12 || day < 1 || day > getDaysInMonth(year, month - 1)) return null;
  if (year < 1900 || year > 2100) return null;
  return `${y}-${m}-${d}`;
}

export function PolishDatePicker({
  value,
  onChange,
  placeholder = "DD.MM.RRRR",
  className,
  inputClassName,
  disabled = false,
  id,
  name,
}: PolishDatePickerProps) {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [textValue, setTextValue] = useState(() => formatToDisplay(value));
  const [viewYear, setViewYear] = useState(() => {
    if (value) {
      const y = parseInt(value.split("-")[0], 10);
      if (y >= 1900 && y <= 2100) return y;
    }
    return today.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) {
      const m = parseInt(value.split("-")[1], 10);
      if (m >= 1 && m <= 12) return m - 1;
    }
    return today.getMonth();
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTextValue(formatToDisplay(value));
    if (value) {
      const parts = value.split("-");
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (y >= 1900 && y <= 2100 && m >= 1 && m <= 12) {
        setViewYear(y);
        setViewMonth(m - 1);
      }
    }
  }, [value]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    const digits = raw.replace(/\D/g, "");
    if (digits.length <= 8) {
      let formatted = "";
      for (let i = 0; i < digits.length; i++) {
        if (i === 2 || i === 4) formatted += ".";
        formatted += digits[i];
      }
      raw = formatted;
    }

    setTextValue(raw);

    const iso = parseDisplayToIso(raw);
    if (iso) {
      onChange(iso);
    }
  }, [onChange]);

  const handleTextBlur = useCallback(() => {
    if (!textValue) {
      onChange("");
      return;
    }
    const iso = parseDisplayToIso(textValue);
    if (iso) {
      onChange(iso);
    } else {
      setTextValue(formatToDisplay(value));
    }
  }, [textValue, value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTextBlur();
    }
  }, [handleTextBlur]);

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const selectDay = useCallback((day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const iso = `${viewYear}-${mm}-${dd}`;
    onChange(iso);
    setOpen(false);
  }, [viewMonth, viewYear, onChange]);

  const goToday = useCallback(() => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const iso = `${now.getFullYear()}-${mm}-${dd}`;
    onChange(iso);
    setOpen(false);
  }, [onChange]);

  const clearDate = useCallback(() => {
    onChange("");
    setTextValue("");
    setOpen(false);
  }, [onChange]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const selectedParts = value ? value.split("-").map(Number) : null;
  const isSelectedDay = (day: number) =>
    selectedParts &&
    selectedParts[0] === viewYear &&
    selectedParts[1] === viewMonth + 1 &&
    selectedParts[2] === day;

  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative", className)}>
        <Input
          ref={inputRef}
          id={id}
          name={name}
          value={textValue}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn("pr-9", inputClassName)}
          maxLength={10}
        />
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            tabIndex={-1}
          >
            <Calendar className="w-4 h-4 text-slate-400" />
          </button>
        </PopoverTrigger>
      </div>

      <PopoverContent className="w-auto p-3" align="start" sideOffset={4}>
        {/* Month/Year navigation */}
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={prevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold select-none">
            {MONTHS_PL[viewMonth]} {viewYear}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day names header */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_PL.map((d) => (
            <div
              key={d}
              className="text-center text-[11px] font-medium text-muted-foreground py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => (
            <button
              key={i}
              type="button"
              disabled={!day}
              onClick={() => day && selectDay(day)}
              className={cn(
                "h-8 w-8 rounded-md text-sm transition-colors",
                !day && "invisible",
                day && "hover:bg-accent hover:text-accent-foreground",
                day && isToday(day) && !isSelectedDay(day) && "border border-blue-300 text-blue-600 font-medium",
                day && isSelectedDay(day) && "bg-blue-600 text-white font-semibold hover:bg-blue-700",
              )}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-red-500 hover:text-red-600 h-7 px-2"
            onClick={clearDate}
          >
            Wyczyść
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-blue-600 hover:text-blue-700 h-7 px-2"
            onClick={goToday}
          >
            Dzisiaj
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
