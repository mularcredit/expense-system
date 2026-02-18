"use client";

import { useState, useRef, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, setMonth, setYear, isValid } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { PiCalendar, PiCaretLeft, PiCaretRight, PiCaretDown } from "react-icons/pi";

interface StudioDatePickerProps {
    value: Date;
    onChange: (date: Date) => void;
    placeholder?: string;
    className?: string;
    align?: 'left' | 'right';
}

type ViewMode = 'day' | 'month' | 'year';

export function StudioDatePicker({ value, onChange, placeholder = "Select date", className, align = 'left' }: StudioDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(value && isValid(value) ? value : new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('day');
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setViewMode('day'); // Reset view on close
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (value && isValid(value)) setViewDate(value);
    }, [value]);

    const handlePrev = () => {
        if (viewMode === 'day') setViewDate(subMonths(viewDate, 1));
        if (viewMode === 'year') setViewDate(new Date(viewDate.getFullYear() - 12, 0, 1));
    };

    const handleNext = () => {
        if (viewMode === 'day') setViewDate(addMonths(viewDate, 1));
        if (viewMode === 'year') setViewDate(new Date(viewDate.getFullYear() + 12, 0, 1));
    };

    const handleDayClick = (day: Date) => {
        onChange(day);
        setIsOpen(false);
    };

    const handleMonthClick = (monthIndex: number) => {
        setViewDate(setMonth(viewDate, monthIndex));
        setViewMode('day');
    };

    const handleYearClick = (year: number) => {
        setViewDate(setYear(viewDate, year));
        setViewMode('month');
    };

    // Calendar Generation Logic
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const months = Array.from({ length: 12 }, (_, i) => format(new Date(0, i), "MMM"));

    // Year Grid Generation
    const currentYear = viewDate.getFullYear();
    const startYear = currentYear - 5;
    const years = Array.from({ length: 12 }, (_, i) => startYear + i);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* Input Trigger */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full h-[42px] px-3 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer transition-all group select-none hover:border-slate-600
                    ${isOpen ? 'ring-2 ring-indigo-500/50 border-indigo-500' : ''}
                `}
            >
                <span className={`text-sm font-medium font-mono ${value && isValid(value) ? 'text-slate-200' : 'text-slate-500'}`}>
                    {value && isValid(value) ? format(value, "dd MMM yyyy") : placeholder}
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
                                            const isSelected = value && isSameDay(day, value);
                                            const isCurrentMonth = isSameMonth(day, viewDate);
                                            const isTodayDate = isToday(day);
                                            return (
                                                <button
                                                    type="button"
                                                    key={idx}
                                                    onClick={() => handleDayClick(day)}
                                                    className={`
                                                        h-7 w-7 rounded-md flex items-center justify-center text-xs font-medium transition-all relative
                                                        ${!isCurrentMonth ? 'text-slate-600' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}
                                                        ${isSelected ? '!bg-indigo-600 !text-white shadow-lg shadow-indigo-500/30' : ''}
                                                        ${isTodayDate && !isSelected ? 'text-indigo-400 font-bold bg-indigo-500/10' : ''}
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

                        {/* Today Footer */}
                        <div className="mt-2 pt-3 border-t border-slate-700 flex justify-center">
                            <button
                                type="button"
                                onClick={() => { onChange(new Date()); setIsOpen(false); }}
                                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
                            >
                                Jump to Today
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
