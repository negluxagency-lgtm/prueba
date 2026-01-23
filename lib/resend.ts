import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const RESEND_FROM = 'Nelux App <contacto@app.nelux.es>';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
    try {
        const { data, error } = await resend.emails.send({
            from: RESEND_FROM,
            to,
            subject,
            html,
        });

        if (error) {
            console.error('Error sending email via Resend:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Unexpected error sending email:', error);
        return { success: false, error };
    }
}
