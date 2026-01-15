import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { MessageRow, Conversation, ChatMessage } from "@/types";
import { useSearchParams } from "next/navigation";

export function useChat() {
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedTlf, setSelectedTlf] = useState<string | null>(null);
    const searchParams = useSearchParams();

    // Deep Linking: Check URL param on mount
    useEffect(() => {
        const tlfParam = searchParams.get('tlf');
        if (tlfParam) {
            setSelectedTlf(tlfParam);
        }
    }, [searchParams]);

    const fetchMessages = async () => {
        try {
            // Only show loader on initial fetch if empty
            if (conversations.length === 0) setLoading(true);

            // Parallel fetch: Messages + Client Names
            const [messagesResult, namesResult] = await Promise.all([
                supabase.from('Mensajes').select('*').order('numero', { ascending: true }),
                supabase.from('citas').select('Nombre, Telefono')
            ]);

            const { data: messagesData, error: messagesError } = messagesResult;
            const { data: namesData, error: namesError } = namesResult;

            if (messagesError) throw messagesError;
            if (namesError) console.error("Error fetching names:", namesError);

            // Create Name Lookup Map
            const nameMap: Record<string, string> = {};
            if (namesData) {
                namesData.forEach((row: any) => {
                    if (row.Telefono && row.Nombre) {
                        // Normalize: remove spaces and + signs
                        const cleanTlf = String(row.Telefono).replace(/\+/g, '').replace(/\s/g, '').trim();
                        nameMap[cleanTlf] = row.Nombre;

                        // Also map raw value just in case
                        nameMap[String(row.Telefono).trim()] = row.Nombre;
                    }
                });
            }

            if (messagesData) {
                processMessages(messagesData as MessageRow[], nameMap);
            }
        } catch (err: any) {
            console.error("Error fetching chat data:", err.message || err);
        } finally {
            setLoading(false);
        }
    };

    const processMessages = (rows: MessageRow[], nameMap: Record<string, string> = {}) => {
        const grouped: Record<string, ChatMessage[]> = {};

        rows.forEach(row => {
            // Robust check for Tlf (handle 0 or valid numbers)
            if (row.Tlf === null || row.Tlf === undefined) return;
            const tlfStr = String(row.Tlf); // Normalize to string

            const content = row.mensaje_enviado || row.mensaje_recibido;
            if (!content) return;

            const isMine = !!row.mensaje_enviado;

            // Fallback for timestamp: prefer 'fecha', then 'created_at', then current time
            const timestamp = row.fecha || row.created_at || new Date().toISOString();

            // Debug: Log first few messages to see what values are coming from DB
            if (Object.keys(grouped).length === 0 && grouped[tlfStr] === undefined) {
                console.log('🔍 First message - fecha:', row.fecha, '| created_at:', row.created_at, '| using:', timestamp);
            }

            if (!grouped[tlfStr]) {
                grouped[tlfStr] = [];
            }

            grouped[tlfStr].push({
                id: row.numero,
                content: content,
                isMine: isMine,
                timestamp: timestamp
            });
        });

        // Convert to array and sort conversations by latest message ID (numero)
        const convos: Conversation[] = Object.keys(grouped).map(tlf => {
            const msgs = grouped[tlf].sort((a, b) => a.id - b.id); // Ensure messages inside are sorted by numero (asc)
            const last = msgs[msgs.length - 1];

            // Try to look up name using raw or cleaned phone
            const cleanTlf = tlf.replace(/\+/g, '').replace(/\s/g, '').trim();
            const clientName = nameMap[tlf] || nameMap[cleanTlf];

            // Debug: Log lastTimestamp for each conversation
            console.log('📊 Conversation:', tlf, '| lastTimestamp:', last.timestamp, '| lastId:', last.id);

            return {
                tlf,
                messages: msgs,
                lastMessage: last.content,
                lastTimestamp: last.timestamp,
                lastId: last.id,
                clientName: clientName
            };
        }).sort((a, b) => b.lastId - a.lastId);

        // console.log("Processed Conversations:", convos); 
        setConversations(convos);

        // If deep link set a TLF but we have data, we're good. 
        // If NO deep link and no selection, select first by default ONLY ON DESKTOP
        if (!searchParams.get('tlf') && !selectedTlf && convos.length > 0) {
            const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
            if (isDesktop) {
                setSelectedTlf(convos[0].tlf);
            }
        }
    };

    const sendMessage = async (text: string) => {
        if (!selectedTlf || !text.trim()) return;

        // Optimistic update: Add message to UI immediately
        const tempId = Date.now();
        const optimisticMessage: ChatMessage = {
            id: tempId,
            content: text,
            isMine: true,
            timestamp: new Date().toISOString()
        };

        // Update local state immediately for instant feedback
        setConversations(prev => prev.map(conv => {
            if (conv.tlf === selectedTlf) {
                return {
                    ...conv,
                    messages: [...conv.messages, optimisticMessage],
                    lastMessage: text,
                    lastTimestamp: optimisticMessage.timestamp,
                    lastId: tempId
                };
            }
            return conv;
        }));

        try {
            const { error } = await supabase
                .from('Mensajes')
                .insert({
                    Tlf: selectedTlf,
                    mensaje_enviado: text,
                    mensaje_recibido: null,
                    mensaje_manual: true,
                    fecha: new Date().toISOString()
                });

            if (error) throw error;

            // Fetch immediately to replace optimistic message with real one
            await fetchMessages();
        } catch (err) {
            console.error("Error sending message:", err);
            // Revert optimistic update on error
            setConversations(prev => prev.map(conv => {
                if (conv.tlf === selectedTlf) {
                    return {
                        ...conv,
                        messages: conv.messages.filter(m => m.id !== tempId)
                    };
                }
                return conv;
            }));
            throw err;
        }
    };

    useEffect(() => {
        fetchMessages();

        // Realtime Subscription
        const channel = supabase
            .channel('mensajes-realtime')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'Mensajes'
            }, (payload) => {
                console.log('🔔 Cambio en Mensajes:', payload.eventType, payload);
                fetchMessages();
            })
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Subscripción Realtime activa para Mensajes');
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.error('❌ Error en Subscripción Realtime:', status, err);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return { loading, conversations, selectedTlf, setSelectedTlf, sendMessage };
}
