export interface Appointment {
    id: number;
    created_at: string;
    Nombre: string;
    Servicio: string;
    Dia: string;
    Hora: string;
    Telefono: string;
    Precio: string | number;
}

export interface AppointmentFormData {
    Nombre: string;
    Servicio: string;
    Dia: string;
    Hora: string;
    Telefono: string;
    Precio: string;
}

export interface MessageRow {
    id: number;
    numero: number; // Identity/PK
    created_at?: string; // Optional now
    fecha?: string; // New manual timestamp column
    Tlf: number | string; // Handle numeric DB type
    mensaje_enviado: string | null;
    mensaje_recibido: string | null;
    mensaje_manual?: boolean;
}

export interface ChatMessage {
    id: number;
    content: string;
    isMine: boolean;
    timestamp: string;
}

export interface Conversation {
    tlf: string;
    messages: ChatMessage[];
    lastMessage: string;
    lastTimestamp: string;
    lastId: number;
    clientName?: string;
}
