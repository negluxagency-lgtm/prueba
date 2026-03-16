import { Metadata } from 'next';
import ChatClient from './ChatClient';
import { getContacts } from './actions';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'WhatsApp Admin | Imperio',
  description: 'Gestión premium de mensajes de WhatsApp',
};

export default async function AdminMensajesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Whitelist de emails autorizados
  const ADMIN_EMAILS = ['alexgaarcia19@gmail.com'];
  const envAdmin = process.env.ADMIN_EMAIL;
  if (envAdmin) ADMIN_EMAILS.push(envAdmin);

  if (!user) {
    redirect('/login');
  }

  if (!ADMIN_EMAILS.includes(user.email || '')) {
    redirect('/'); // Redirigir a home si está logueado pero no es admin
  }

  const contacts = await getContacts();

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-zinc-100 overflow-hidden">
      <ChatClient initialContacts={contacts} />
    </div>
  );
}