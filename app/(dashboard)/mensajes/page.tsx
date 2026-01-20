"use client";

import React, { useRef, useEffect, useState, Suspense } from 'react';
import { useChat } from '@/hooks/useChat';
import { User, Send, Phone, Clock, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

function ChatInterface() {
    const { loading, conversations, selectedTlf, setSelectedTlf, sendMessage } = useChat();
    const [inputMessage, setInputMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const selectedConversation = conversations.find(c => c.tlf === selectedTlf);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [selectedConversation?.messages]);

    const handleSend = async () => {
        if (!inputMessage.trim()) return;

        const promise = sendMessage(inputMessage);

        toast.promise(promise, {
            loading: 'Enviando...',
            success: () => {
                setInputMessage("");
                return 'Mensaje enviado';
            },
            error: 'Error al enviar'
        });
    };

    const formatTime = (isoString: string) => {
        try {
            const date = new Date(isoString);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            // If today, show time only
            if (diffDays === 0 && date.getDate() === now.getDate()) {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            // If yesterday
            else if (diffDays === 1 || (diffDays === 0 && date.getDate() !== now.getDate())) {
                return 'Ayer';
            }
            // If within last week
            else if (diffDays < 7) {
                return date.toLocaleDateString([], { weekday: 'short' });
            }
            // Older messages
            else {
                return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
            }
        } catch (e) {
            return '--:--';
        }
    };

    return (
        <div className="flex bg-[#0a0a0a] text-zinc-100 overflow-hidden absolute inset-x-0 top-10 bottom-20 md:inset-0">
            {/* LEFT SIDEBAR: CONTACTS */}
            <div className={`w-full md:w-[350px] border-r border-zinc-800 flex flex-col bg-zinc-950/50 ${selectedTlf ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 md:p-6 border-b border-zinc-800">
                    <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Mensajes</h1>
                    <p className="text-zinc-500 text-[10px] md:text-xs font-bold mt-0.5 md:mt-1">
                        {loading ? 'Cargando...' : `${conversations.length} Conversaciones`}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {conversations.map(convo => (
                        <div
                            key={convo.tlf}
                            onClick={() => setSelectedTlf(convo.tlf)}
                            className={`p-4 border-b border-zinc-900 cursor-pointer transition-colors hover:bg-zinc-900 group ${selectedTlf === convo.tlf ? 'bg-zinc-900 border-l-4 border-l-amber-500' : 'border-l-4 border-l-transparent'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`font-bold ${selectedTlf === convo.tlf ? 'text-amber-500' : 'text-zinc-300'}`}>
                                    {convo.tlf}
                                </span>
                                <span className="text-[10px] text-zinc-600 ">
                                    {formatTime(convo.lastTimestamp)}
                                </span>
                            </div>
                            <p className="text-sm text-zinc-500 truncate group-hover:text-zinc-400 transition-colors">
                                {convo.messages[convo.messages.length - 1].isMine ? 'Tú: ' : ''}{convo.lastMessage}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT SIDE: CHAT */}
            <div className={`flex-1 flex flex-col bg-[#0f0f11] ${selectedTlf ? 'flex' : 'hidden md:flex'}`}>
                {selectedConversation ? (
                    <>
                        {/* CHAT HEADER */}
                        <div className="h-16 md:h-20 border-b border-zinc-800 flex items-center px-4 md:px-8 justify-between bg-zinc-950/80 backdrop-blur-md">
                            <div className="flex items-center gap-3 md:gap-4">
                                <button
                                    onClick={() => setSelectedTlf(null)}
                                    className="md:hidden p-2 -ml-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                    <User className="text-black w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-base md:text-lg leading-none">{selectedConversation.tlf}</h2>
                                    {selectedConversation.clientName && (
                                        <span className="text-[10px] md:text-xs text-zinc-500 font-medium mt-1 block">
                                            {selectedConversation.clientName}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <a
                                href={`tel:${selectedConversation.tlf}`}
                                className="p-2 md:p-3 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white flex items-center justify-center"
                            >
                                <Phone className="w-[18px] h-[18px] md:w-5 md:h-5" />
                            </a>
                        </div>

                        {/* MESSAGES AREA */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 custom-scrollbar bg-[url('/noise.svg')]">
                            {selectedConversation.messages.map((msg, idx) => (
                                <div key={`${msg.id}-${idx}`} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] md:max-w-[70%] rounded-xl md:rounded-2xl p-3 md:p-4 shadow-lg ${msg.isMine
                                        ? 'bg-amber-600 text-white rounded-tr-none'
                                        : 'bg-zinc-800 text-zinc-200 rounded-tl-none'
                                        }`}>
                                        <p className="text-xs md:text-sm leading-relaxed">{msg.content}</p>
                                        <p className={`text-[9px] md:text-[10px] mt-1.5 md:mt-2 text-right opacity-70 ${msg.isMine ? 'text-white/80' : 'text-zinc-500'}`}>
                                            {formatTime(msg.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* INPUT AREA */}
                        <div className="p-3 md:p-6 border-t border-zinc-800 bg-zinc-950">
                            <div className="flex gap-2 md:gap-4">
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Mensaje..."
                                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg md:rounded-xl px-3 py-3 md:px-4 md:py-4 text-xs md:text-sm focus:outline-none focus:border-amber-500 transition-colors text-white placeholder-zinc-600"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!inputMessage.trim()}
                                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-black p-3 md:p-4 rounded-lg md:rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                                >
                                    <Send className="w-[18px] h-[18px] md:w-5 md:h-5" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 gap-4">
                        <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
                            <Clock size={48} className="opacity-20" />
                        </div>
                        <p className="text-sm">Selecciona una conversación para leer</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MensajesPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <ChatInterface />
        </Suspense>
    );
}
