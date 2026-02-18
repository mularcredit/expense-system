"use client";

import { useState, useRef, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, setMonth, setYear, isValid, isAfter, isBefore } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { PiCalendar, PiCaretLeft, PiCaretRight } from "react-icons/pi";

interface StudioDateRangePickerProps {
    startDate: Date | null;
    endDate: Date | null;
    onChange: (startDate: Date | null, endDate: Date | null) => void;
    placeholder?: string;
    className?: string;
    align?: 'left' | 'right';
}

type ViewMode = 'day' | 'month' | 'year';

export function StudioDateRangePicker({
    startDate,
    endDate,
    onChange,
    placeholder = "Select date range",
    className,
    align = 'left'
}: StudioDateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(startDate && isValid(startDate) ? startDate : new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('day');
    const [tempStartDate, setTempStartDate] = useState<Date | null>(startDate);
    const [tempEndDate, setTempEndDate] = useState<Date | null>(endDate);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setViewMode('day');
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (startDate && isValid(startDate)) setViewDate(startDate);
    }, [startDate]);

    const handlePrev = () => {
        if (viewMode === 'day') setViewDate(subMonths(viewDate, 1));
        if (viewMode === 'year') setViewDate(new Date(viewDate.getFullYear() - 12, 0, 1));
    };

    const handleNext = () => {
        if (viewMode === 'day') setViewDate(addMonths(viewDate, 1));
        if (viewMode === 'year') setViewDate(new Date(viewDate.getFullYear() + 12, 0, 1));
    };

    const handleDayClick = (day: Date) => {
        if (!tempStartDate || (tempStartDate && tempEndDate)) {
            // Start new selection
            setTempStartDate(day);
            setTempEndDate(null);
        } else if (tempStartDate && !tempEndDate) {
            // Complete the range
            if (isBefore(day, tempStartDate)) {
                // Clicked before start, swap them
                setTempEndDate(tempStartDate);
                setTempStartDate(day);
                onChange(day, tempStartDate);
                setIsOpen(false);
            } else {
                // Normal case: end after start
                setTempEndDate(day);
                onChange(tempStartDate, day);
                setIsOpen(false);
            }
        }
    };

    const handleMonthClick = (monthIndex: number) => {
        setViewDate(setMonth(viewDate, monthIndex));
        setViewMode('day');
    };

    const handleYearClick = (year: number) => {
        setViewDate(setYear(viewDate, year));
        setViewMode('month');
    };

    const isInRange = (day: Date) => {
        if (!tempStartDate) return false;
        if (!tempEndDate) return false;
        return (isAfter(day, tempStartDate) || isSameDay(day, tempStartDate)) &&
            (isBefore(day, tempEndDate) || isSameDay(day, tempEndDate));
    };

    const isRangeStart = (day: Date) => {
        return tempStartDate && isSameDay(day, tempStartDate);
    };

    const isRangeEnd = (day: Date) => {
        return tempEndDate && isSameDay(day, tempEndDate);
    };

    // Calendar Generation Logic
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);
    const startDateCalendar = startOfWeek(monthStart);
    const endDateCalendar = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDateCalendar, end: endDateCalendar });
    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const months = Array.from({ length: 12 }, (_, i) => format(new Date(0, i), "MMM"));

    // Year Grid Generation
    const currentYear = viewDate.getFullYear();
    const startYear = currentYear - 5;
    const years = Array.from({ length: 12 }, (_, i) => startYear + i);

    const displayText = () => {
        if (startDate && isValid(startDate) && endDate && isValid(endDate)) {
            return `${format(startDate, "dd MMM yyyy")} - ${format(endDate, "dd MMM yyyy")}`;
        }
        if (startDate && isValid(startDate)) {
            return `${format(startDate, "dd MMM yyyy")} - ...`;
        }
        return placeholder;
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* Input Trigger */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full h-[42px] px-3 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer transition-all group select-none hover:border-slate-600
                    ${isOpen ? 'ring-2 ring-indigo-500/50 border-indigo-500' : ''}
                `}
            >
                <span className={`text-sm font-medium font-mono ${(startDate && endDate) ? 'text-slate-200' : 'text-slate-500'}`}>
                    {displayText()}
                </span>
                <PiCalendar className={`text-lg transition-colors ${isOpen ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
            </div>

            {/* Dropdown Popup */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute top-full mt-2 z-[9999] bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-4 w-[280px] select-none overflow-hidden
                            ${align === 'right' ? 'right-0' : 'left-0'}
                        `}
                    >
                        {/* Header Controls */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                type="button"
                                onClick={handlePrev}
                                className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                            >
                                <PiCaretLeft />
                            </button>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setViewMode(viewMode === 'month' ? 'day' : 'month')}
                                    className={`text-xs font-bold px-2 py-1 rounded-md transition-colors flex items-center gap-1
                                        ${viewMode === 'month' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-300 hover:bg-slate-700'}
                                    `}
                                >
                                    {format(viewDate, "MMMM")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode(viewMode === 'year' ? 'day' : 'year')}
                                    className={`text-xs font-bold px-2 py-1 rounded-md transition-colors flex items-center gap-1
                                        ${viewMode === 'year' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-300 hover:bg-slate-700'}
                                    `}
                                >
                                    {format(viewDate, "yyyy")}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={handleNext}
                                className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                            >
                                <PiCaretRight />
                            </button>
                        </div>

                        {/* VIEWS */}
                        <div className="relative h-[220px]">
                            {/* Day View */}
                            {viewMode === 'day' && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="absolute inset-0"
                                >
                                    <div className="grid grid-cols-7 mb-2">
                                        {weekDays.map(day => (
                                            <div key={day} className="text-center text-[10px] font-bold text-slate-500 uppercase">
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-1">
                                        {calendarDays.map((day, idx) => {
                                            const isCurrentMonth = isSameMonth(day, viewDate);
                                            const isTodayDate = isToday(day);
                                            const inRange = isInRange(day);
                                            const rangeStart = isRangeStart(day);
                                            const rangeEnd = isRangeEnd(day);

                                            return (
                                                <button
                                                    type="button"
                                                    key={idx}
                                                    onClick={() => handleDayClick(day)}
                                                    className={`
                                                        h-7 w-7 rounded-md flex items-center justify-center text-xs font-medium transition-all relative
                                                        ${!isCurrentMonth ? 'text-slate-600' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}
                                                        ${rangeStart || rangeEnd ? '!bg-indigo-600 !text-white shadow-lg shadow-indigo-500/30' : ''}
                                                        ${inRange && !rangeStart && !rangeEnd ? 'bg-indigo-500/20 text-indigo-300' : ''}
                                                        ${isTodayDate && !rangeStart && !rangeEnd && !inRange ? 'text-indigo-400 font-bold bg-indigo-500/10' : ''}
                                                    `}
                                                >
                                                    {format(day, "d")}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}

                            {/* Month View */}
                            {viewMode === 'month' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="grid grid-cols-3 gap-2 absolute inset-0 content-start"
                                >
                                    {months.map((month, idx) => (
                                        <button
                                            type="button"
                                            key={month}
                                            onClick={() => handleMonthClick(idx)}
                                            className={`
                                                h-10 rounded-lg text-xs font-medium transition-all border
                                                ${viewDate.getMonth() === idx ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'}
                                            `}
                                        >
                                            {month}
                                        </button>
                                    ))}
                                </motion.div>
                            )}

                            {/* Year View */}
                            {viewMode === 'year' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="grid grid-cols-3 gap-2 absolute inset-0 content-start"
                                >
                                    {years.map((year) => (
                                        <button
                                            type="button"
                                            key={year}
                                            onClick={() => handleYearClick(year)}
                                            className={`
                                                h-10 rounded-lg text-xs font-medium transition-all border
                                                ${viewDate.getFullYear() === year ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'}
                                            `}
                                        >
                                            {year}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </div>

                        {/* Clear & Today Footer */}
                        <div className="mt-2 pt-3 border-t border-slate-700 flex justify-between items-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setTempStartDate(null);
                                    setTempEndDate(null);
                                    onChange(null, null);
                                }}
                                className="text-[10px] font-bold text-slate-400 hover:text-slate-300 uppercase tracking-wider"
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const today = new Date();
                                    setTempStartDate(today);
                                    setTempEndDate(today);
                                    onChange(today, today);
                                    setIsOpen(false);
                                }}
                                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
                            >
                                Today
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
