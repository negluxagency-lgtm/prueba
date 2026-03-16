'use client';

import { useState, useEffect, useRef } from 'react';
import { getMessages, sendMessage } from './actions';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, Send, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';

type Contact = {
  telefono: string;
  ultimo_mensaje?: string;
  fecha_ultimo?: string;
};

type Mensaje = {
  id: number;
  created_at: string;
  mensaje: string;
  recibido: boolean;
  telefono: string;
};

export default function ChatClient({ initialContacts }: { initialContacts: Contact[] }) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [messages, setMessages] = useState<Mensaje[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact);
      setShowMobileChat(true);
    } else {
      setShowMobileChat(false);
    }
  }, [selectedContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Suscripción Global para la lista de Contactos (Sidebar)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('contacts-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mis_mensajes' },
        (payload) => {
          const newMsg = payload.new as Mensaje;
          setContacts((prev) => {
            const updatedContact = {
              telefono: newMsg.telefono,
              ultimo_mensaje: newMsg.mensaje,
              fecha_ultimo: newMsg.created_at
            };
            const exists = prev.some((c) => String(c.telefono).trim() === String(newMsg.telefono).trim());
            if (exists) {
              return [updatedContact, ...prev.filter((c) => String(c.telefono).trim() !== String(newMsg.telefono).trim())];
            }
            return [updatedContact, ...prev];
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Suscripción para el hilo de Chat activo
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('chat-thread-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mis_mensajes' },
        (payload) => {
          const newMsg = payload.new as Mensaje;
          if (selectedContact && String(newMsg.telefono).trim() === String(selectedContact).trim()) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('connected');
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setRealtimeStatus('error');
      });
    return () => { supabase.removeChannel(channel); };
  }, [selectedContact]);

  const loadMessages = async (telefono: string) => {
    setLoading(true);
    const msgs = await getMessages(telefono);
    setMessages(msgs);
    setLoading(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;
    const texto = newMessage;
    setNewMessage('');
    const optimisticMsg: Mensaje = { id: Date.now(), created_at: new Date().toISOString(), mensaje: texto, recibido: false, telefono: selectedContact };
    setMessages((prev) => [...prev, optimisticMsg]);
    const result = await sendMessage(selectedContact, texto);
    if (!result.success) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    } else {
      loadMessages(selectedContact);
    }
  };

  const StatusDot = () => (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-800 text-[10px] font-bold uppercase tracking-widest ${
      realtimeStatus === 'connected' ? 'text-green-500' : 'text-amber-500'
    }`}>
      <div className={`w-2 h-2 rounded-full ${realtimeStatus === 'connected' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
      {realtimeStatus === 'connected' ? 'Live' : 'Syncing'}
    </div>
  );

  return (
    <div className="flex w-full h-[100dvh] lg:h-full bg-[#0a0a0a] overflow-hidden lg:p-4 lg:gap-4">
      {/* Sidebar de Contactos */}
      <div className={`
        ${showMobileChat ? 'hidden lg:flex' : 'flex'} 
        w-full lg:w-[380px] flex-col bg-[#111111] border border-zinc-800 lg:rounded-2xl overflow-hidden shrink-0
      `}>
        <div className="p-6 border-b border-zinc-800 bg-[#161616]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black uppercase tracking-tighter text-amber-500 italic">WhatsApp</h2>
            <StatusDot />
          </div>
          <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Centro de Operaciones</div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {contacts.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center gap-4 opacity-30">
              <MessageSquare className="w-8 h-8" />
              <p className="text-xs font-bold uppercase tracking-widest">Silencio en la red</p>
            </div>
          ) : (
            contacts.map((c) => (
              <button
                key={c.telefono}
                onClick={() => setSelectedContact(c.telefono)}
                className={`w-full text-left p-4 border-b border-zinc-800/30 transition-all hover:bg-zinc-900 group relative ${
                  selectedContact === c.telefono ? 'bg-zinc-900' : ''
                }`}
              >
                {selectedContact === c.telefono && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                )}
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-black transition-all shrink-0 ${
                    selectedContact === c.telefono 
                    ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                    : 'bg-zinc-800 border-zinc-700 text-zinc-500 group-hover:border-zinc-500'
                  }`}>
                    {c.telefono.slice(-2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <div className={`text-sm font-black uppercase tracking-tight truncate ${
                        selectedContact === c.telefono ? 'text-amber-500' : 'text-zinc-200'
                      }`}>
                        +{c.telefono}
                      </div>
                      {c.fecha_ultimo && (
                        <span className="text-[9px] font-black text-zinc-600">
                          {new Date(c.fecha_ultimo).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    {c.ultimo_mensaje && (
                      <div className="text-[11px] text-zinc-500 truncate font-medium group-hover:text-zinc-400 transition-colors">
                        {c.ultimo_mensaje}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Área Principal de Chat */}
      <div className={`
        ${showMobileChat ? 'flex' : 'hidden lg:flex'} 
        flex-1 flex-col bg-[#111111] border border-zinc-800 lg:rounded-2xl overflow-hidden relative shadow-2xl
      `}>
        {selectedContact ? (
          <>
            <div className="p-4 border-b border-zinc-800 bg-[#161616] flex items-center justify-between z-10 shrink-0">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedContact(null)}
                  className="lg:hidden p-2 hover:bg-zinc-800 rounded-lg text-zinc-400"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center font-black text-amber-500 border border-zinc-700 shadow-inner">
                  {selectedContact.slice(-2)}
                </div>
                <div>
                  <div className="text-sm font-black text-zinc-100 uppercase tracking-widest">+{selectedContact}</div>
                  <div className="text-[10px] font-black text-green-500 uppercase flex items-center gap-1.5 pt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e] animate-pulse" />
                    Enlace Seguro
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] custom-scrollbar">
              {loading && messages.length === 0 ? (
                <div className="flex justify-center p-20">
                  <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center p-12 bg-zinc-900/40 backdrop-blur-xl rounded-3xl border border-zinc-800/50 max-w-sm mx-auto shadow-2xl">
                    <MessageSquare className="w-8 h-8 text-zinc-800 mx-auto mb-4" />
                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">Iniciando transcripción...</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.recibido ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div
                      className={`max-w-[85%] lg:max-w-[70%] rounded-2xl p-4 shadow-2xl border ${
                        msg.recibido
                          ? 'bg-[#161616] text-zinc-300 border-zinc-800 rounded-bl-none'
                          : 'bg-zinc-100 text-[#0a0a0a] border-white rounded-br-none shadow-amber-500/5 transition-transform hover:scale-[1.01]'
                      }`}
                    >
                      <span className="whitespace-pre-wrap text-[13px] leading-relaxed font-semibold">{msg.mensaje}</span>
                      <div className={`text-[9px] mt-2 font-black uppercase tracking-widest flex items-center gap-1 ${msg.recibido ? 'text-zinc-600' : 'text-zinc-500 opacity-60'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {!msg.recibido && <CheckCircle2 className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 lg:p-6 bg-[#161616] border-t border-zinc-800 shrink-0">
              <form onSubmit={handleSend} className="flex gap-3 max-w-5xl mx-auto">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  className="flex-1 px-5 py-4 bg-[#0a0a0a] border border-zinc-800 rounded-2xl text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/5 transition-all text-sm font-bold shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-14 h-14 bg-amber-500 text-black rounded-2xl flex items-center justify-center hover:bg-amber-400 disabled:opacity-20 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(245,158,11,0.25)] shrink-0"
                >
                  <Send className="w-6 h-6" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-10 text-center">
            <div className="max-w-md animate-in zoom-in-95 fade-in duration-1000">
              <div className="w-28 h-28 bg-zinc-900 rounded-[2.5rem] border border-zinc-800 flex items-center justify-center mx-auto mb-10 shadow-2xl relative group">
                  <div className="absolute inset-0 bg-amber-500/5 blur-3xl rounded-full group-hover:bg-amber-500/10 transition-all" />
                  <MessageSquare className="w-12 h-12 text-amber-500 relative group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-black text-4xl text-zinc-100 mb-6 uppercase tracking-tighter italic scale-y-110">Centro de Mensajería</h3>
              <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px] leading-loose max-w-[280px] mx-auto opacity-60">
                Selecciona una señal para iniciar la comunicación
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}