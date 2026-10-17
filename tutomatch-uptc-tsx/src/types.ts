export type Category = 'licenciaturas' | 'ingenierias' | 'arquitectura';
export type PqrsType = 'peticion' | 'queja' | 'reclamo' | 'sugerencia';

export interface Subject { id: string; nombre: string; categoria: Category; activa: boolean; created_at: string; }
export interface Tutoria { id: string; nombre: string; email_corp: string; codigo_est: string; materia_id: string; fecha_registro: string; }
export interface Pqrs { id: string; nombre: string; email_corp: string; tipo: PqrsType; asunto: string; mensaje: string; estado: 'pendiente' | 'en_revision' | 'resuelta'; created_at: string; }
