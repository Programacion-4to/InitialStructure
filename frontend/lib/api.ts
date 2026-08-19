// API configuration and utility functions for TITOFLIX

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
const DIRECT_API_BASE_URL = process.env.NEXT_PUBLIC_DIRECT_API_URL || "/api/v1";
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";
let accessToken: string | null = null;

export class ApiError extends Error {
  status: number;
  data: unknown;
  blockedUntil?: string;

  constructor(message: string, status: number, data: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    if (data && typeof data === "object") {
      const payload = data as Record<string, unknown>;
      const blockedUntil = payload.bloqueado_hasta || payload.blockedUntil;
      if (typeof blockedUntil === "string") {
        this.blockedUntil = blockedUntil;
      }
    }
  }
}

// Max upload size (bytes). Can be overridden at build time with NEXT_PUBLIC_MAX_UPLOAD_SIZE.
export const MAX_UPLOAD_SIZE = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE) || 10 * 1024 * 1024; // 10MB

export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export function getDirectApiUrl(path: string): string {
  return `${DIRECT_API_BASE_URL}${path}`;
}

function getUploadApiUrl(path: string): string {
  return getDirectApiUrl(path);
}

function isDirectUploadUrl(url: string, path: string): boolean {
  return url !== getApiUrl(path);
}

function getVideoUploadSize(body: BodyInit | null | undefined): number {
  if (!(body instanceof FormData) || typeof File === "undefined") {
    return 0;
  }

  for (const [fieldName, value] of body.entries()) {
    if (fieldName === "video" && value instanceof File) {
      return value.size || 0;
    }
  }

  return 0;
}

function formatMB(bytes: number): number {
  return Math.round((bytes / 1024 / 1024) * 10) / 10;
}

export function getBackendUrl(path: string): string {
  // Handle relative stream URLs
  if (path.startsWith("http")) {
    return path;
  }
  return `${BACKEND_BASE_URL}${path}`;
}

export function getAssetUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }
  if (path.startsWith("http") || path.startsWith("data:")) {
    return path;
  }
  if (path.startsWith("assets/")) {
    return getApiUrl(`/assets/${encodeURI(path.slice("assets/".length))}`);
  }
  return path;
}

export function getAuthHeaders(): HeadersInit {
  if (!accessToken) return {};
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const hasVideoUpload =
    isFormData &&
    Array.from((options.body as FormData).entries()).some(([fieldName, value]) => {
      return fieldName === "video" && typeof File !== "undefined" && value instanceof File && value.size > 0;
    });
  const url = hasVideoUpload ? getUploadApiUrl(path) : getApiUrl(path);
  const videoUploadSize = hasVideoUpload ? getVideoUploadSize(options.body) : 0;
  const hasBody = options.body !== undefined && options.body !== null;
  const headers: HeadersInit = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  if (hasBody && !isFormData) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  // Client-side check to avoid sending large non-video uploads.
  if (hasBody) {
    try {
      let limitedBodySize = 0;
      if (isFormData && typeof FormData !== "undefined") {
        const fd = options.body as FormData;
        for (const entry of fd.entries()) {
          const [fieldName, value] = entry;
          if (typeof File !== "undefined" && value instanceof File) {
            if (fieldName !== "video") {
              limitedBodySize += value.size || 0;
            }
          } else if (typeof value === "string") {
            limitedBodySize += new Blob([value]).size;
          }
        }
      } else if (typeof options.body === "string") {
        limitedBodySize = new Blob([options.body]).size;
      } else if (typeof options.body === "object") {
        // Fallback for objects that weren't stringified by the caller.
        try {
          const text = JSON.stringify(options.body);
          limitedBodySize = new Blob([text]).size;
        } catch {}
      }

      if (limitedBodySize > MAX_UPLOAD_SIZE) {
        const actualMB = Math.round((limitedBodySize / 1024 / 1024) * 10) / 10;
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
      credentials: "same-origin",
    });
  } catch {
    if (hasVideoUpload && isDirectUploadUrl(url, path) && videoUploadSize > 95 * 1024 * 1024) {
      throw new Error(
        `No se pudo conectar con el endpoint directo de uploads. Este video pesa ${formatMB(videoUploadSize)}MB y Cloudflare suele rechazar cargas cercanas o superiores a 100MB; usa localhost:3000 o configura NEXT_PUBLIC_DIRECT_API_URL con una URL directa al backend.`
      );
    }
    throw new Error("No se pudo conectar con el backend. Verifica que Docker esté corriendo y que la app esté configurada para usar la IP del servidor.");
  }

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const error = await response.json().catch(() => null);
      const detail = Array.isArray(error?.detail)
        ? error.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(". ")
        : error?.detail;
      throw new ApiError(error?.message || detail || `Error ${response.status}`, response.status, error);
    }

    const text = await response.text().catch(() => "");
    if (hasVideoUpload && response.status === 413 && text.toLowerCase().includes("cloudflare")) {
      throw new ApiError(
        `Cloudflare rechazo el video (${formatMB(videoUploadSize)}MB). Para videos grandes hay que subir por localhost:3000 o por un endpoint directo al backend que no pase por Cloudflare.`,
        response.status,
      );
    }
    throw new ApiError(text.trim() || `Error ${response.status}`, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return undefined as T;
  }

  return response.json();
}

export async function downloadFile(path: string, fallbackFilename = "titoflix-video"): Promise<void> {
  const response = await fetch(getApiUrl(path), {
    headers: getAuthHeaders(),
  });

  if (response.status === 401 && path !== "/auth/refresh" && path !== "/auth/login") {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return downloadFile(path, fallbackFilename);
    }
  }

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const error = await response.json().catch(() => null);
      const detail = Array.isArray(error?.detail)
        ? error.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(". ")
        : error?.detail;
      throw new ApiError(error?.message || detail || `Error ${response.status}`, response.status, error);
    }

    const text = await response.text().catch(() => "");
    throw new ApiError(text.trim() || `Error ${response.status}`, response.status);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = getFilenameFromDisposition(response.headers.get("content-disposition")) || fallbackFilename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getFilenameFromDisposition(disposition: string | null): string | null {
  if (!disposition) return null;
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1].replace(/"/g, ""));
  const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
  return filenameMatch?.[1] || null;
}

// Registration
export async function register(email: string, password: string, plan: "basico" | "estandar" | "premium"): Promise<void> {
  await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, plan }),
  });
}

// Auth
export type StoredAccount = {
  id?: number;
  email: string;
  plan?: "basico" | "estandar" | "premium";
  is_admin: boolean;
};

export function isAuthenticated(): boolean {
  return !!accessToken;
}

export function getToken(): string | null {
  return accessToken;
}

export function setToken(token: string): void {
  accessToken = token;
}

export function removeToken(): void {
  accessToken = null;
}

export function getStoredAccount(): StoredAccount | null {
  return null;
}

export function setStoredAccount(account: StoredAccount): void {
  void account;
}

export function removeStoredAccount(): void {
  return;
}

// Profile
export type StoredProfile = {
  id: number;
  nombre: string;
  avatar?: string | null;
};

export function getSelectedProfile(): StoredProfile | null {
  if (typeof window === "undefined") return null;
  const profile = localStorage.getItem("titoflix_profile");
  return profile ? JSON.parse(profile) : null;
}

export function setSelectedProfile(profile: StoredProfile): void {
  localStorage.setItem("titoflix_profile", JSON.stringify(profile));
}

export function removeSelectedProfile(): void {
  localStorage.removeItem("titoflix_profile");
}

export function logout(): void {
  removeToken();
  removeStoredAccount();
  removeSelectedProfile();
}

// ─── HU5: Content search with filters ───────────────────────────────────────

export interface ContentSearchParams {
  q?: string;
  genero?: string;
  tipo?: "pelicula" | "serie";
  ordenar?: "anio_desc" | "anio_asc" | "titulo_asc";
  perfil_id?: number;
}

export function buildContentSearchUrl(params: ContentSearchParams): string {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.genero) query.set("genero", params.genero);
  if (params.tipo) query.set("tipo", params.tipo);
  if (params.ordenar) query.set("ordenar", params.ordenar);
  if (params.perfil_id) query.set("perfil_id", String(params.perfil_id));
  const qs = query.toString();
  return qs ? `/contenidos?${qs}` : "/contenidos";
}

// ─── HU6: View progress ──────────────────────────────────────────────────────

export interface ReportVistaPayload {
  contenido_id?: number;
  episodio_id?: number;
  segundos_vistos: number;
  terminado?: boolean;
}

export async function reportarVista(perfilId: number, payload: ReportVistaPayload): Promise<void> {
  await apiRequest(`/perfiles/${perfilId}/vistas`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── HU9: Calificaciones ─────────────────────────────────────────────────────

export interface Calificacion {
  id: number;
  perfil_id: number;
  contenido_id: number;
  puntaje: number;
}

export async function getCalificacion(perfilId: number, contenidoId: number): Promise<Calificacion | null> {
  try {
    return await apiRequest<Calificacion>(`/perfiles/${perfilId}/calificaciones/${contenidoId}`);
  } catch {
    return null;
  }
}

export async function setCalificacion(perfilId: number, contenidoId: number, puntaje: number): Promise<Calificacion> {
  return await apiRequest<Calificacion>(`/perfiles/${perfilId}/calificaciones/${contenidoId}`, {
    method: "POST",
    body: JSON.stringify({ puntaje }),
  });
}

export async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch(getApiUrl("/auth/refresh"), { method: "POST", credentials: "same-origin" });
    if (!response.ok) {
      removeToken();
      return false;
    }
    const payload = await response.json() as { access_token: string };
    setToken(payload.access_token);
    return true;
  } catch {
    removeToken();
    return false;
  }
}

export async function deleteCalificacion(perfilId: number, contenidoId: number): Promise<void> {
  await apiRequest(`/perfiles/${perfilId}/calificaciones/${contenidoId}`, {
    method: "DELETE",
  });
}

// ─── HU10: Recomendaciones ───────────────────────────────────────────────────

export async function getRecomendaciones(perfilId: number): Promise<import("@/lib/types").Contenido[]> {
  return await apiRequest<import("@/lib/types").Contenido[]>(`/perfiles/${perfilId}/recomendaciones`);
}

export async function getTopContenidos(genero?: string): Promise<import("@/lib/types").Contenido[]> {
  const path = genero ? `/contenidos/top?genero=${encodeURIComponent(genero)}` : "/contenidos/top";
  return await apiRequest<import("@/lib/types").Contenido[]>(path);
}

// ─── HU11: Control parental PIN ──────────────────────────────────────────────

export async function desbloquearPerfil(perfilId: number, pin: string): Promise<{ success: boolean }> {
  await apiRequest(`/perfiles/${perfilId}/desbloquear`, {
    method: "POST",
    body: JSON.stringify({ pin }),
  });
  return { success: true };
}

export async function setPinCuenta(cuentaId: number, pin: string): Promise<void> {
  await apiRequest(`/cuentas/${cuentaId}/pin`, {
    method: "PUT",
    body: JSON.stringify({ pin }),
  });
}

export async function getCuentaInfo(cuentaId: number): Promise<{ has_pin: boolean; plan: string }> {
  return await apiRequest<{ has_pin: boolean; plan: string }>(`/cuentas/${cuentaId}`);
}

// ─── HU14: Reporte de visualizacion ──────────────────────────────────────────

export interface ReporteVisualizacionItem {
  contenido_id: number;
  titulo: string;
  tipo: "pelicula" | "serie";
  minutos_vistos: number;
  generos: string[];
}

export interface ReporteVisualizacion {
  anio: number;
  mes: number;
  total_minutos: number;
  total_contenidos: number;
  por_genero: Record<string, number>;
  contenidos: ReporteVisualizacionItem[];
}

export async function getReporteVisualizacion(anio: number, mes: number): Promise<ReporteVisualizacion> {
  return await apiRequest<ReporteVisualizacion>(`/reportes/visualizacion?anio=${anio}&mes=${mes}`);
}
