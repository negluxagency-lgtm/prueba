"use client";

import React, { useState } from "react";
import { sendResetEmail } from "@/app/actions/send-reset";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function ResetPasswordButton() {
    const [isPending, setIsPending] = useState(false);

    const handleReset = async () => {
        setIsPending(true);
        try {
            const result = await sendResetEmail();
            if (result.success) {
                toast.success("✅ Correo enviado. Revisa tu bandeja de entrada.");
            } else {
                toast.error(`Error: ${result.error}`);
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado.");
            console.error(error);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <button
            onClick={handleReset}
            disabled={isPending}
            className="text-zinc-500 hover:text-zinc-300 text-sm mt-4 underline cursor-pointer transition-colors flex items-center gap-2"
        >
            {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
            ¿Olvidaste tu contraseña? Cámbiala aquí
        </button>
    );
}
