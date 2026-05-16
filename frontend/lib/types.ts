// Types for the TITOFLIX streaming app — aligned with backend DTOs

export interface Genero {
  id: number;
  nombre: string;
}

export interface Contenido {
  id: number;
  titulo: string;
  tipo: "pelicula" | "serie";
  anio: number;
  descripcion?: string | null;
  duracion_min?: number | null;
  clasificacion_edad: string;
  generos: Genero[];
  promedio_calificaciones?: number | null;
  storage_folder_id?: string | null;
  video_storage_key?: string | null;
  video_mime?: string | null;
  video_size?: number | null;
}

export interface Temporada {
  id: number;
  contenido_id: number;
  numero: number;
  anio: number;
  storage_folder_id?: string | null;
}

export interface Episodio {
  id: number;
  temporada_id: number;
  numero: number;
  titulo: string;
  duracion_min: number;
  video_storage_key?: string | null;
  video_mime?: string | null;
  video_size?: number | null;
}

export interface Vista {
  id: number;
  perfil_id: number;
  episodio_id?: number | null;
  contenido_id?: number | null;
  fecha?: string | null;
  segundos_vistos: number;
  terminado: boolean;
}

export interface Calificacion {
  id: number;
  perfil_id: number;
  contenido_id: number;
  puntaje: number;
  fecha?: string | null;
}

export interface PlaybackResponse {
  stream_url: string;
  mime_type: string;
}

export interface VideoVariant {
  quality: string;
  url: string;
  mime_type: string;
}

// Auth
export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface PerfilAuthResponse {
  message: string;
  perfil_id: number;
  cuenta_id: number;
}

// User / Cuenta
export interface CuentaResponse {
  id: number;
  email: string;
  plan: string;
  is_admin: boolean;
  fecha_alta?: string | null;
}

// Perfil
export interface Perfil {
  id: number;
  cuenta_id: number;
  nombre: string;
  es_infantil: boolean;
  avatar?: string | null;
}
