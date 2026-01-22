"use client";

import React from 'react';
import { User, Send } from 'lucide-react';
import { motion } from 'framer-motion';

interface DemoMessage {
    id: number;
    content: string;
    isMine: boolean;
    time: string;
    isManual?: boolean;
}

const DemoChatPreview: React.FC = () => {
    // Demo conversation showing AI + manual intervention
    const messages: DemoMessage[] = [
        { id: 1, content: 'Hola buenas me gustaría pedir cita para mañana', isMine: false, time: '10:32' },
        { id: 2, content: 'Hola! Claro, tenemos hueco mañana a las 10:00, 11:30 o 17:00. ¿Cuál te viene mejor?', isMine: true, time: '10:32' },
        { id: 3, content: 'Las 11:30 perfecto', isMine: false, time: '10:33' },
        { id: 4, content: 'Cita confirmada para mañana a las 11:30. Te esperamos!', isMine: true, time: '10:33' },
        { id: 5, content: 'Por cierto, ¿hacéis diseños con navaja?', isMine: false, time: '10:34' },
        { id: 6, content: 'Sí! Tenemos a Dani que es especialista en diseños. Hace diseños muy muy top!', isMine: true, time: '10:35', isManual: true },
    ];

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl md:rounded-[2rem] backdrop-blur-sm shadow-2xl overflow-hidden max-w-md mx-auto">
            {/* Chat Header */}
            <div className="h-14 md:h-16 border-b border-zinc-800 flex items-center px-4 md:px-5 justify-between bg-zinc-950/80">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <User className="text-black w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div>
                        <h2 className="font-bold text-sm md:text-base leading-none text-white">+34 654 321 098</h2>
                        <span className="text-[10px] md:text-xs text-zinc-500 font-medium">Cliente nuevo</span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 bg-green-500/10 text-green-500 px-2.5 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold">EN LÍNEA</span>
                </div>
            </div>

            {/* Messages Area */}
            <div className="p-4 md:p-5 space-y-3 md:space-y-4 bg-[#0f0f11] min-h-[280px] max-h-[350px] overflow-y-auto">
                {messages.map((msg, idx) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.1 }}
                        className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className="relative">
                            <div className={`max-w-[260px] rounded-2xl p-3 shadow-lg ${msg.isMine
                                ? 'bg-amber-600 text-white rounded-tr-sm'
                                : 'bg-zinc-800 text-zinc-200 rounded-tl-sm'
                                }`}>
                                <p className="text-xs md:text-sm leading-relaxed">{msg.content}</p>
                                <p className={`text-[9px] md:text-[10px] mt-1.5 text-right opacity-70 ${msg.isMine ? 'text-white/80' : 'text-zinc-500'}`}>
                                    {msg.time}
                                </p>
                            </div>
                            {/* Manual intervention badge */}
                            {msg.isManual && (
                                <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                                    TÚ
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-3 md:p-4 border-t border-zinc-800 bg-zinc-950">
                <div className="flex gap-2 md:gap-3">
                    <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm text-zinc-500 flex items-center">
                        Toma el control cuando quieras...
                    </div>
                    <button className="bg-amber-500 hover:bg-amber-600 text-black p-2.5 md:p-3 rounded-xl transition-all shadow-lg shadow-amber-500/20">
                        <Send className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DemoChatPreview;
