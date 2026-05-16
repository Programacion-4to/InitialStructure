// API configuration and utility functions for TITOFLIX
// Aligned with backend routers: auth_router, user_router, product_router

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
const DIRECT_API_BASE_URL = process.env.NEXT_PUBLIC_DIRECT_API_URL || "/api/v1";
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

// Max upload size (bytes). Can be overridden at build time with NEXT_PUBLIC_MAX_UPLOAD_SIZE.
export const MAX_UPLOAD_SIZE = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE) || 10 * 1024 * 1024; // 10MB

export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export function getBackendUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${BACKEND_BASE_URL}${path}`;
}

export function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("titoflix_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = getApiUrl(path);
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...options.headers,
  };

  if (hasBody && !isFormData) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  // Client-side check to avoid sending bodies larger than MAX_UPLOAD_SIZE.
  if (hasBody) {
    try {
      let bodySize = 0;
      if (isFormData && typeof FormData !== "undefined") {
        const fd = options.body as FormData;
        for (const entry of fd.entries()) {
          const value = entry[1] as any;
          if (typeof File !== "undefined" && value instanceof File) {
            bodySize += value.size || 0;
          } else if (typeof value === "string") {
            bodySize += new Blob([value]).size;
          }
        }
      } else if (typeof options.body === "string") {
        bodySize = new Blob([options.body]).size;
      } else if (typeof options.body === "object") {
        // Fallback for objects that weren't stringified by the caller.
        try {
          const text = JSON.stringify(options.body as any);
          bodySize = new Blob([text]).size;
        } catch {}
      }

      if (bodySize > MAX_UPLOAD_SIZE) {
        const actualMB = Math.round((bodySize / 1024 / 1024) * 10) / 10;
        const allowedMB = Math.round((MAX_UPLOAD_SIZE / 1024 / 1024) * 10) / 10;
        throw new Error(`El archivo es demasiado grande (${actualMB}MB). Tamaño máximo permitido: ${allowedMB}MB.`);
      }
    } catch (err) {
      if (err instanceof Error) throw err;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new Error("No se pudo conectar con el backend. Verifica que Docker esté corriendo y que la app esté configurada para usar la IP del servidor.");
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Error desconocido" }));
    const err = new Error(error.detail || `Error ${response.status}`);
    (err as ApiError).status = response.status;
    throw err;
  }

  // Handle 204 No Content
  if (response.status === 204) return undefined as T;
  return response.json();
}

export interface ApiError extends Error {
  status?: number;
}

// ─── Auth state helpers ─────────────────────────────────────────────────────

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("titoflix_token");
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("titoflix_token");
}

export function setToken(token: string): void {
  localStorage.setItem("titoflix_token", token);
}

export function removeToken(): void {
  localStorage.removeItem("titoflix_token");
}

// ─── Profile state helpers ──────────────────────────────────────────────────

export function getSelectedProfile(): Perfil | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("titoflix_profile");
  return raw ? JSON.parse(raw) : null;
}

export function setSelectedProfile(profile: Perfil): void {
  localStorage.setItem("titoflix_profile", JSON.stringify(profile));
}

export function removeSelectedProfile(): void {
  localStorage.removeItem("titoflix_profile");
}

// Store cuenta_id so we can fetch profiles for the logged-in user
export function getCuentaId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("titoflix_cuenta_id");
  return raw ? Number(raw) : null;
}

export function setCuentaId(id: number): void {
  localStorage.setItem("titoflix_cuenta_id", String(id));
}

export function logout(): void {
  removeToken();
  removeSelectedProfile();
  localStorage.removeItem("titoflix_cuenta_id");
}

// ─── Auth endpoints (/auth) ─────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function authPerfil(
  perfilId: number,
  pin?: string | null
): Promise<{ message: string; perfil_id: number; cuenta_id: number }> {
  return apiRequest(`/auth/perfiles/${perfilId}`, {
    method: "POST",
    body: JSON.stringify({ pin: pin ?? null }),
  });
}

// ─── Cuentas endpoints (/cuentas) ───────────────────────────────────────────

export async function register(
  email: string,
  password: string,
  plan: "basico" | "estandar" | "premium"
): Promise<CuentaResponse> {
  return apiRequest<CuentaResponse>("/cuentas/", {
    method: "POST",
    body: JSON.stringify({ email, password, plan }),
  });
}

export async function getPerfilesByCuenta(
  cuentaId: number
): Promise<Perfil[]> {
  return apiRequest<Perfil[]>(`/cuentas/${cuentaId}/perfiles`);
}

// ─── Generos (/generos) ─────────────────────────────────────────────────────

export async function listGeneros(): Promise<Genero[]> {
  return apiRequest<Genero[]>("/generos");
}

// ─── Contenidos (/contenidos) ───────────────────────────────────────────────

export interface SearchParams {
  q?: string;
  tipo?: string;
  genero?: string;
  genero_id?: number;
  perfil_id?: number;
  ordenar?: string;
}

export async function searchContenidos(
  params: SearchParams = {}
): Promise<Contenido[]> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.tipo) qs.set("tipo", params.tipo);
  if (params.genero) qs.set("genero", params.genero);
  if (params.genero_id) qs.set("genero_id", String(params.genero_id));
  if (params.perfil_id) qs.set("perfil_id", String(params.perfil_id));
  if (params.ordenar) qs.set("ordenar", params.ordenar);
  const query = qs.toString();
  return apiRequest<Contenido[]>(`/contenidos${query ? `?${query}` : ""}`);
}

export async function getContenido(id: number): Promise<Contenido> {
  return apiRequest<Contenido>(`/contenidos/${id}`);
}

export async function getTopContenidos(
  genero?: string
): Promise<Contenido[]> {
  const qs = genero ? `?genero=${encodeURIComponent(genero)}` : "";
  return apiRequest<Contenido[]>(`/contenidos/top${qs}`);
}

export async function getPlayback(
  contenidoId: number
): Promise<PlaybackResponse> {
  return apiRequest<PlaybackResponse>(
    `/contenidos/${contenidoId}/playback`
  );
}

// ─── Temporadas & Episodios ─────────────────────────────────────────────────

export async function getTemporadas(
  contenidoId: number
): Promise<Temporada[]> {
  return apiRequest<Temporada[]>(
    `/contenidos/${contenidoId}/temporadas`
  );
}

export async function getEpisodios(
  temporadaId: number
): Promise<Episodio[]> {
  return apiRequest<Episodio[]>(
    `/temporadas/${temporadaId}/episodios`
  );
}

export async function getEpisodioPlayback(
  episodioId: number
): Promise<PlaybackResponse> {
  return apiRequest<PlaybackResponse>(
    `/episodios/${episodioId}/playback`
  );
}

// ─── Vistas (progress) (/perfiles/:id/vistas) ──────────────────────────────

export async function upsertVista(
  perfilId: number,
  body: {
    contenido_id?: number | null;
    episodio_id?: number | null;
    segundos_vistos: number;
    terminado?: boolean;
  }
): Promise<Vista> {
  return apiRequest<Vista>(`/perfiles/${perfilId}/vistas`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getContinuarViendo(
  perfilId: number
): Promise<Vista[]> {
  return apiRequest<Vista[]>(`/perfiles/${perfilId}/continuar`);
}

// ─── Mi Lista (/perfiles/:id/mi-lista) ─────────────────────────────────────

export async function getMiLista(perfilId: number): Promise<Contenido[]> {
  return apiRequest<Contenido[]>(`/perfiles/${perfilId}/mi-lista`);
}

export async function addToMiLista(
  perfilId: number,
  contenidoId: number
): Promise<Contenido[]> {
  return apiRequest<Contenido[]>(
    `/perfiles/${perfilId}/mi-lista?contenido_id=${contenidoId}`,
    { method: "POST" }
  );
}

export async function removeFromMiLista(
  perfilId: number,
  contenidoId: number
): Promise<Contenido[]> {
  return apiRequest<Contenido[]>(
    `/perfiles/${perfilId}/mi-lista/${contenidoId}`,
    { method: "DELETE" }
  );
}

// ─── Calificaciones (/perfiles/:id/calificaciones/:contenido_id) ────────────

export async function upsertCalificacion(
  perfilId: number,
  contenidoId: number,
  puntaje: number
): Promise<Calificacion> {
  return apiRequest<Calificacion>(
    `/perfiles/${perfilId}/calificaciones/${contenidoId}`,
    {
      method: "POST",
      body: JSON.stringify({ puntaje }),
    }
  );
}

export async function deleteCalificacion(
  perfilId: number,
  contenidoId: number
): Promise<void> {
  return apiRequest<void>(
    `/perfiles/${perfilId}/calificaciones/${contenidoId}`,
    { method: "DELETE" }
  );
}
