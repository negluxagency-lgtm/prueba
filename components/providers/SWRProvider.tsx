"use client";

import React from "react";
import { SWRConfig } from "swr";

export const SWRProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <SWRConfig
            value={{
                revalidateOnFocus: true,
                revalidateIfStale: true,
                dedupingInterval: 2000,
                // Si necesitas un fetcher global por defecto, puedes añadirlo aquí
                // Pero como usamos Supabase, solemos definirlo en el hook
            }}
        >
            {children}
        </SWRConfig>
    );
};
