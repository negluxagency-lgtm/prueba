'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getContacts() {
  const supabase = await createClient();
  
  // Obtenemos todos los mensajes ordenados por fecha descendente
  const { data, error } = await supabase
    .from('mis_mensajes')
    .select('telefono, mensaje, created_at')
    .order('created_at', { ascending: false });
    
  if (error || !data) {
    console.error('Error fetching contacts:', error);
    return [];
  }

  // Agrupamos por teléfono para obtener el último mensaje de cada uno
  const latestMessagesMap = new Map();
  data.forEach((m: any) => {
    if (m.telefono && !latestMessagesMap.has(m.telefono)) {
      latestMessagesMap.set(m.telefono, {
        telefono: m.telefono,
        ultimo_mensaje: m.mensaje,
        fecha_ultimo: m.created_at
      });
    }
  });

  return Array.from(latestMessagesMap.values());
}

export async function getMessages(telefono: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('mis_mensajes')
    .select('*')
    .eq('telefono', telefono)
    .order('created_at', { ascending: true }); // ID ascendente para leer de arriba a abajo
    
  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data;
}

export async function sendMessage(telefono: string, mensaje: string) {
  const supabase = await createClient();
  
  const newMsg = {
    telefono,
    mensaje,
    recibido: false
  };

  const { data, error } = await supabase
    .from('mis_mensajes')
    .insert([newMsg])
    .select();

  if (error) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/mensajes');
  return { success: true, data };
}