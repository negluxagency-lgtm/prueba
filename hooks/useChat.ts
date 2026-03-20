import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { MessageRow, Conversation, ChatMessage } from "@/types";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import useSWR from "swr";

export function useChat() {
    const [userId, setUserId] = useState<string | null>(null);
    const [selectedTlf, setSelectedTlf] = useState<string | null>(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) setUserId(data.user.id);
        });
    }, []);

    // Fetcher for SWR
    const fetchChatData = async () => {
        if (!userId) return [];

        // 1. Fetch messages and names in parallel
        const [messagesResult, namesResult] = await Promise.all([
            supabase.from('Mensajes')
                .select('*')
                .eq('barberia_id', userId)
                .order('numero', { ascending: true }),
            supabase.from('citas')
                .select('Nombre, Telefono')
                .eq('barberia_id', userId)
        ]);

        if (messagesResult.error) throw messagesResult.error;

        // 2. Build Name Lookup
        const nameMap: Record<string, string> = {};
        if (namesResult.data) {
            namesResult.data.forEach((row: any) => {
                if (row.Telefono && row.Nombre) {
                    const cleanTlf = String(row.Telefono).replace(/\+/g, '').replace(/\s/g, '').trim();
                    nameMap[cleanTlf] = row.Nombre;
                    nameMap[String(row.Telefono).trim()] = row.Nombre;
                }
            });
        }

        // 3. Process Messages
        const grouped: Record<string, ChatMessage[]> = {};
        (messagesResult.data as MessageRow[]).forEach(row => {
            if (row.Tlf === null || row.Tlf === undefined) return;
            const tlfStr = String(row.Tlf);
            const content = row.mensaje_enviado || row.mensaje_recibido;
            if (!content) return;

            if (!grouped[tlfStr]) grouped[tlfStr] = [];
            grouped[tlfStr].push({
                id: row.numero,
                content: content,
                isMine: !!row.mensaje_enviado,
                timestamp: row.fecha || row.created_at || new Date().toISOString()
            });
        });

        // 4. Map to Conversations
        return Object.keys(grouped).map(tlf => {
            const msgs = grouped[tlf].sort((a, b) => a.id - b.id);
            const last = msgs[msgs.length - 1];
            const cleanTlf = tlf.replace(/\+/g, '').replace(/\s/g, '').trim();
            return {
                tlf,
                messages: msgs,
                lastMessage: last.content,
                lastTimestamp: last.timestamp,
                lastId: last.id,
                clientName: nameMap[tlf] || nameMap[cleanTlf]
            };
        }).sort((a, b) => b.lastId - a.lastId);
    };

    const { 
        data: conversations = [], 
        error, 
        isLoading, 
        mutate 
    } = useSWR(
        userId ? ['chat-conversations', userId] : null,
        fetchChatData,
        {
            revalidateOnFocus: true,
            onError: (err) => {
                console.error("Error fetching chat data:", err);
                toast.error("Error al cargar el chat");
            }
        }
    );

    // Deep Linking & Initial Selection
    useEffect(() => {
        const tlfParam = searchParams.get('tlf');
        if (tlfParam) {
            setSelectedTlf(tlfParam);
        } else if (!selectedTlf && conversations.length > 0) {
            const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
            if (isDesktop) setSelectedTlf(conversations[0].tlf);
        }
    }, [searchParams, conversations]);

    const sendMessage = async (text: string) => {
        if (!selectedTlf || !text.trim() || !userId) return;

        const tempId = Date.now();
        const optimisticMessage: ChatMessage = {
            id: tempId,
            content: text,
            isMine: true,
            timestamp: new Date().toISOString()
        };

        // Optimistic Update
        const updatedConversations = conversations.map(conv => {
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
        });

        try {
            mutate(updatedConversations, false);

            const { error } = await supabase
                .from('Mensajes')
                .insert({
                    Tlf: selectedTlf,
                    mensaje_enviado: text,
                    manual: true,
                    fecha: new Date().toISOString(),
                    barberia_id: userId
                });

            if (error) throw error;
            mutate();
        } catch (err) {
            mutate();
            toast.error("Error al enviar el mensaje");
            throw err;
        }
    };

    // Realtime Sync
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`chat-${userId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'Mensajes',
                filter: `barberia_id=eq.${userId}`
            }, () => mutate())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, mutate]);

    return { 
        loading: isLoading, 
        conversations, 
        selectedTlf, 
        setSelectedTlf, 
        sendMessage 
    };
}

