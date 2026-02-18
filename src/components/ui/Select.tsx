"use client";

import { useState, useRef, useEffect } from "react";
import { PiCaretDown, PiMagnifyingGlass, PiCheck } from "react-icons/pi";
import { cn } from "@/lib/utils";

interface Option {
    value: string;
    label: string;
}

interface SelectProps {
    value?: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    searchable?: boolean;
    className?: string;
}

export function Select({ value, onChange, options, placeholder = "Select...", searchable = false, className = "" }: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(o => o.value === value);

    const filteredOptions = searchable
        ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
        : options;

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full px-4 min-h-[42px] py-2 bg-white border border-gray-300 rounded-[5px] flex items-center justify-between cursor-pointer transition-all group select-none text-xs",
                    isOpen ? 'ring-1 ring-[#29258D]/30 border-indigo-200' : 'hover:border-gray-400',
                    className
                )}
            >
                <span className={`font-medium truncate ${selectedOption ? "text-gray-900" : "text-gray-400"}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <PiCaretDown className={`text-gray-400 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#29258D]' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-100 rounded-[5px] z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
                    {searchable && (
                        <div className="relative mb-2 px-1">
                            <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                            <input
                                autoFocus
                                className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border-0 rounded-[5px] text-xs focus:ring-1 focus:ring-[#29258D]/30 placeholder:text-gray-400 text-gray-900 focus:outline-none"
                                placeholder="Search..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onClick={e => e.stopPropagation()}
                            />
                        </div>
                    )}

                    <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                        setSearch("");
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-[5px] text-sm transition-colors flex items-center justify-between group
                                        ${value === option.value
                                            ? 'bg-[#29258D]/5 text-[#29258D] font-medium'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    type="button"
                                >
                                    <span>{option.label}</span>
                                    {value === option.value && <PiCheck className="text-[#29258D] text-xs" />}
                                </button>
                            ))
                        ) : (
                            <div className="px-2 py-3 text-xs text-center text-gray-400">
                                No options found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
