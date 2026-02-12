"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePicker24hProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export const TimePicker24h: React.FC<TimePicker24hProps> = ({ value, onChange, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const hourScrollRef = useRef<HTMLDivElement>(null);
    const minuteScrollRef = useRef<HTMLDivElement>(null);

    const [hour, minute] = (value || '09:00').split(':');

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

    const updateCoords = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            // Dropdown absolute positioning based on viewport coordinates + scroll
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;

            setCoords({
                top: rect.bottom + scrollY + 4,
                left: rect.left + scrollX,
                width: Math.max(rect.width, 160)
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            // Close on scroll to avoid alignment issues in complex layouts
            const handleClose = () => setIsOpen(false);
            window.addEventListener('resize', handleClose);
            return () => window.removeEventListener('resize', handleClose);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                buttonRef.current && !buttonRef.current.contains(target) &&
                dropdownRef.current && !dropdownRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll into view when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                const hEl = hourScrollRef.current?.querySelector(`[data-hour="${hour}"]`);
                const mEl = minuteScrollRef.current?.querySelector(`[data-minute="${minute}"]`);
                hEl?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                mEl?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }, 50);
        }
    }, [isOpen, hour, minute]);

    const handleSelectHour = (h: string) => {
        onChange(`${h}:${minute || '00'}`);
    };

    const handleSelectMinute = (m: string) => {
        onChange(`${hour || '09'}:${m}`);
    };

    return (
        <div className={cn("relative inline-block w-full", className)} ref={containerRef}>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs md:text-sm text-white flex items-center justify-between hover:border-amber-500/50 transition-all focus:border-amber-500 outline-none h-full min-h-[38px]"
            >
                <span className="font-mono font-bold">{value || '09:00'}</span>
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
            </button>

            {isOpen && typeof document !== 'undefined' && createPortal(
                <div
                    ref={dropdownRef}
                    style={{
                        position: 'absolute',
                        top: coords.top,
                        left: coords.left,
                        minWidth: coords.width,
                        zIndex: 9999
                    }}
                    className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex gap-3 z-[9999]"
                >
                    <div
                        ref={hourScrollRef}
                        className="h-44 overflow-y-auto scrollbar-none flex flex-col gap-1 pr-1 custom-scrollbar"
                    >
                        <span className="text-[9px] text-zinc-500 font-black uppercase sticky top-0 bg-zinc-900 py-1 z-10 px-1 text-center">Hora</span>
                        {hours.map(h => (
                            <button
                                key={h}
                                data-hour={h}
                                type="button"
                                onClick={() => handleSelectHour(h)}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-xs transition-all",
                                    hour === h ? "bg-amber-500 text-black font-black scale-105" : "text-zinc-500 hover:bg-zinc-800 hover:text-white"
                                )}
                            >
                                {h}
                            </button>
                        ))}
                    </div>

                    <div className="w-[1px] bg-zinc-800 self-stretch my-2"></div>

                    <div
                        ref={minuteScrollRef}
                        className="h-44 overflow-y-auto scrollbar-none flex flex-col gap-1 pr-1 custom-scrollbar"
                    >
                        <span className="text-[9px] text-zinc-500 font-black uppercase sticky top-0 bg-zinc-900 py-1 z-10 px-1 text-center">Min</span>
                        {minutes.map(m => (
                            <button
                                key={m}
                                data-minute={m}
                                type="button"
                                onClick={() => handleSelectMinute(m)}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-xs transition-all",
                                    minute === m ? "bg-amber-500 text-black font-black scale-105" : "text-zinc-500 hover:bg-zinc-800 hover:text-white"
                                )}
                            >
                                {m}
                            </button>
                        ))}
                    </div>

                    <style jsx>{`
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 2px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: #27272a;
                            border-radius: 10px;
                        }
                    `}</style>
                </div>,
                document.body
            )}
        </div>
    );
};
