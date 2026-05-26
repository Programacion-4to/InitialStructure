"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Film, Loader2, LogOut, Play, Plus, RefreshCw, Tv, Upload } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { apiRequest, getAssetUrl, getBackendUrl, logout, MAX_UPLOAD_SIZE, getReporteVisualizacion, type ReporteVisualizacion } from "@/lib/api";
import type { Contenido, Episodio, Genero, PlaybackResponse, Temporada, VideoVariant } from "@/lib/types";

interface AdminDashboardProps {
  onLogout: () => void;
}

type Message = { type: "ok" | "error"; text: string } | null;
type AdminTab = "crear" | "modificar" | "eliminar" | "reportes";
type PlaybackResource = {
  type: "contenido" | "episodio";
  id: number;
  title: string;
  qualities: string[];
};
type TestPlayback = PlaybackResource & {
  url: string;
  selectedQuality: string;
};

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [contenidos, setContenidos] = useState<Contenido[]>([]);
  const [generos, setGeneros] = useState<Genero[]>([]);
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [episodios, setEpisodios] = useState<Episodio[]>([]);
  const [selectedContenidoId, setSelectedContenidoId] = useState("");
  const [selectedTemporadaId, setSelectedTemporadaId] = useState("");
  const [episodeCreateContenidoId, setEpisodeCreateContenidoId] = useState("");
  const [episodeCreateTemporadaId, setEpisodeCreateTemporadaId] = useState("");
  const [episodeCreateTemporadas, setEpisodeCreateTemporadas] = useState<Temporada[]>([]);
  const [episodeBrowserContenidoId, setEpisodeBrowserContenidoId] = useState("");
  const [episodeBrowserTemporadaId, setEpisodeBrowserTemporadaId] = useState("");
  const [episodeBrowserTemporadas, setEpisodeBrowserTemporadas] = useState<Temporada[]>([]);
  const [episodeBrowserEpisodios, setEpisodeBrowserEpisodios] = useState<Episodio[]>([]);
  const [updateContenidoId, setUpdateContenidoId] = useState("");
  const [contenidoTipo, setContenidoTipo] = useState<"pelicula" | "serie">("pelicula");
  const [contenidoVideoName, setContenidoVideoName] = useState("");
  const [contenidoPortadaName, setContenidoPortadaName] = useState("");
  const [updateContenidoVideoName, setUpdateContenidoVideoName] = useState("");
  const [updateContenidoPortadaName, setUpdateContenidoPortadaName] = useState("");
  const [episodioVideoName, setEpisodioVideoName] = useState("");
  const [updateEpisodioVideoName, setUpdateEpisodioVideoName] = useState("");
  const [testPlayback, setTestPlayback] = useState<TestPlayback | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("crear");
  const [loading, setLoading] = useState(false);
  const [creatingContenido, setCreatingContenido] = useState(false);
  const [creatingEpisodio, setCreatingEpisodio] = useState(false);
  const [contenidoFormMessage, setContenidoFormMessage] = useState<Message>(null);
  const [episodioFormMessage, setEpisodioFormMessage] = useState<Message>(null);
  const [message, setMessage] = useState<Message>(null);

  // HU14: Reporte de visualizacion state
  const [reporteAnio, setReporteAnio] = useState(new Date().getFullYear());
  const [reporteMes, setReporteMes] = useState(new Date().getMonth() + 1);
  const [reporte, setReporte] = useState<ReporteVisualizacion | null>(null);
  const [reporteLoading, setReporteLoading] = useState(false);

  const selectedContenido = useMemo(
    () => contenidos.find((contenido) => contenido.id === Number(selectedContenidoId)),
    [contenidos, selectedContenidoId]
  );
  const selectedEpisodeCreateContenido = useMemo(
    () => contenidos.find((contenido) => contenido.id === Number(episodeCreateContenidoId)),
    [contenidos, episodeCreateContenidoId]
  );
  const selectedEpisodeBrowserContenido = useMemo(
    () => contenidos.find((contenido) => contenido.id === Number(episodeBrowserContenidoId)),
    [contenidos, episodeBrowserContenidoId]
  );
  const selectedUpdateContenido = useMemo(
    () => contenidos.find((contenido) => contenido.id === Number(updateContenidoId)),
    [contenidos, updateContenidoId]
  );

  const series = contenidos.filter((contenido) => contenido.tipo === "serie");

  const loadBaseData = async () => {
    setLoading(true);
    try {
      const [contentData, generoData] = await Promise.all([
        apiRequest<Contenido[]>("/contenidos").catch((error) => {
          setMessage({
            type: "error",
            text: error instanceof Error ? error.message : "No se pudieron cargar los contenidos",
          });
          return [];
        }),
        apiRequest<Genero[]>("/generos"),
      ]);
      setContenidos(dedupeById(contentData));
      setGeneros(generoData);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo cargar la consola admin",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    setUpdateContenidoVideoName("");
    setUpdateContenidoPortadaName("");
  }, [updateContenidoId]);

  useEffect(() => {
    if (!selectedContenidoId) {
      setTemporadas([]);
      return;
    }

    apiRequest<Temporada[]>(`/contenidos/${selectedContenidoId}/temporadas`)
      .then(setTemporadas)
      .catch(() => setTemporadas([]));
  }, [selectedContenidoId]);

  useEffect(() => {
    if (!selectedTemporadaId) {
      setEpisodios([]);
      return;
    }

    apiRequest<Episodio[]>(`/temporadas/${selectedTemporadaId}/episodios`)
      .then(setEpisodios)
      .catch(() => setEpisodios([]));
  }, [selectedTemporadaId]);

  useEffect(() => {
    if (!episodeCreateContenidoId) {
      setEpisodeCreateTemporadas([]);
      setEpisodeCreateTemporadaId("");
      return;
    }

    apiRequest<Temporada[]>(`/contenidos/${episodeCreateContenidoId}/temporadas`)
      .then((data) => {
        setEpisodeCreateTemporadas(data);
        setEpisodeCreateTemporadaId((current) =>
          current && data.some((temporada) => temporada.id === Number(current)) ? current : ""
        );
      })
      .catch(() => {
        setEpisodeCreateTemporadas([]);
        setEpisodeCreateTemporadaId("");
      });
  }, [episodeCreateContenidoId]);

  useEffect(() => {
    if (!episodeBrowserContenidoId) {
      setEpisodeBrowserTemporadas([]);
      setEpisodeBrowserTemporadaId("");
      setEpisodeBrowserEpisodios([]);
      return;
    }

    apiRequest<Temporada[]>(`/contenidos/${episodeBrowserContenidoId}/temporadas`)
      .then((data) => {
        setEpisodeBrowserTemporadas(data);
        setEpisodeBrowserTemporadaId((current) =>
          current && data.some((temporada) => temporada.id === Number(current)) ? current : ""
        );
      })
      .catch(() => {
        setEpisodeBrowserTemporadas([]);
        setEpisodeBrowserTemporadaId("");
        setEpisodeBrowserEpisodios([]);
      });
  }, [episodeBrowserContenidoId]);

  useEffect(() => {
    if (!episodeBrowserTemporadaId) {
      setEpisodeBrowserEpisodios([]);
      return;
    }

    apiRequest<Episodio[]>(`/temporadas/${episodeBrowserTemporadaId}/episodios`)
      .then(setEpisodeBrowserEpisodios)
      .catch(() => setEpisodeBrowserEpisodios([]));
  }, [episodeBrowserTemporadaId]);

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const showOk = (text: string) => setMessage({ type: "ok", text });

  // HU14: Load visualization report
  const loadReporte = async () => {
    setReporteLoading(true);
    try {
      const data = await getReporteVisualizacion(reporteAnio, reporteMes);
      setReporte(data);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo cargar el reporte" });
      setReporte(null);
    } finally {
      setReporteLoading(false);
    }
  };

  const handleGeneroSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const nombre = String(form.get("nombre") || "").trim();
    if (!nombre) return;

    try {
      await apiRequest(`/generos?nombre=${encodeURIComponent(nombre)}`, { method: "POST" });
      formElement.reset();
      showOk("Genero creado");
      loadBaseData();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo crear el genero" });
    }
  };

  const handleContenidoSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setContenidoFormMessage(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const tipo = String(form.get("tipo") || "");
    const titulo = String(form.get("titulo") || "").trim();
    const anio = String(form.get("anio") || "").trim();
    const generosIds = form.getAll("generos_ids").map(String).filter(Boolean);

    if (!titulo) {
      setContenidoFormMessage({ type: "error", text: "Ingresa el titulo del contenido." });
      return;
    }
    if (!anio || Number(anio) < 1900) {
      setContenidoFormMessage({ type: "error", text: "Ingresa un anio valido." });
      return;
    }
    if (generosIds.length === 0) {
      setContenidoFormMessage({ type: "error", text: "Crea y selecciona al menos un genero antes de cargar contenido." });
      return;
    }
    if (!String(form.get("descripcion") || "").trim()) {
      form.delete("descripcion");
    }
    if (form.get("tipo") !== "pelicula") {
      form.delete("video");
    }

    const video = form.get("video");
    if (video instanceof File && video.size === 0) {
      form.delete("video");
    }
    const portada = form.get("portada");
    if (portada instanceof File && portada.size === 0) {
      form.delete("portada");
    }
    if (form.get("tipo") === "pelicula" && !(video instanceof File && video.size > 0)) {
      setContenidoFormMessage({ type: "error", text: "Selecciona un archivo de video para crear la pelicula." });
      return;
    }

    setCreatingContenido(true);
    setContenidoFormMessage({ type: "ok", text: "Subiendo contenido. Esto puede tardar si el video es pesado." });
    try {
      const created = await apiRequest<Contenido>("/contenidos", { method: "POST", body: form });
      formElement.reset();
      setContenidoTipo("pelicula");
      setContenidoVideoName("");
      setContenidoPortadaName("");
      setContenidoFormMessage(created.processing_warning ? { type: "ok", text: created.processing_warning.message } : null);
      showOk(created.processing_warning?.message || "Contenido creado");
      loadBaseData();
    } catch (error) {
      setContenidoFormMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo crear el contenido" });
    } finally {
      setCreatingContenido(false);
    }
  };

  const handleTemporadaSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await apiRequest("/temporadas", {
        method: "POST",
        body: JSON.stringify({
          contenido_id: Number(form.get("contenido_id")),
          numero: Number(form.get("numero")),
          anio: Number(form.get("anio")),
        }),
      });
      formElement.reset();
      showOk("Temporada creada");
      if (selectedContenidoId) {
        const data = await apiRequest<Temporada[]>(`/contenidos/${selectedContenidoId}/temporadas`);
        setTemporadas(data);
      }
      const contenidoId = String(form.get("contenido_id"));
      if (contenidoId === episodeCreateContenidoId) {
        const data = await apiRequest<Temporada[]>(`/contenidos/${contenidoId}/temporadas`);
        setEpisodeCreateTemporadas(data);
      }
      if (contenidoId === episodeBrowserContenidoId) {
        const data = await apiRequest<Temporada[]>(`/contenidos/${contenidoId}/temporadas`);
        setEpisodeBrowserTemporadas(data);
      }
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo crear la temporada" });
    }
  };

  const handleEpisodioSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEpisodioFormMessage(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const temporadaId = String(form.get("temporada_id") || "").trim();
    const numero = String(form.get("numero") || "").trim();
    const titulo = String(form.get("titulo") || "").trim();
    const video = form.get("video");

    if (!temporadaId) {
      setEpisodioFormMessage({ type: "error", text: "Elegi una serie y una temporada antes de crear el episodio." });
      return;
    }
    if (!numero || Number(numero) < 1) {
      setEpisodioFormMessage({ type: "error", text: "Ingresa un numero de episodio valido." });
      return;
    }
    if (!titulo) {
      setEpisodioFormMessage({ type: "error", text: "Ingresa el titulo del episodio." });
      return;
    }
    if (!(video instanceof File && video.size > 0)) {
      setEpisodioFormMessage({ type: "error", text: "Selecciona un archivo de video para crear el episodio." });
      return;
    }

    setCreatingEpisodio(true);
    setEpisodioFormMessage({ type: "ok", text: "Subiendo episodio. Esto puede tardar si el video es pesado." });
    try {
      const created = await apiRequest<Episodio>("/episodios", { method: "POST", body: form });
      formElement.reset();
      setEpisodioVideoName("");
      setEpisodioFormMessage(created.processing_warning ? { type: "ok", text: created.processing_warning.message } : null);
      showOk(created.processing_warning?.message || "Episodio creado");
      if (temporadaId === selectedTemporadaId) {
        const data = await apiRequest<Episodio[]>(`/temporadas/${temporadaId}/episodios`);
        setEpisodios(data);
      }
      if (temporadaId === episodeBrowserTemporadaId) {
        const data = await apiRequest<Episodio[]>(`/temporadas/${temporadaId}/episodios`);
        setEpisodeBrowserEpisodios(data);
      }
    } catch (error) {
      setEpisodioFormMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo crear el episodio" });
    } finally {
      setCreatingEpisodio(false);
    }
  };

  const playbackPath = (resource: PlaybackResource, quality: string) => {
    const basePath =
      resource.type === "contenido"
        ? `/contenidos/${resource.id}/playback`
        : `/episodios/${resource.id}/playback`;
    return quality ? `${basePath}?quality=${encodeURIComponent(quality)}` : basePath;
  };

  const qualityOptions = (variants: VideoVariant[] | undefined) =>
    [...(variants || [])]
      .sort((a, b) => qualityRank(b.quality) - qualityRank(a.quality))
      .map((variant) => variant.quality);

  const openPlayback = async (contenido: Contenido, quality?: string) => {
    const qualities = qualityOptions(contenido.video_variants);
    const selectedQuality = quality || qualities[0] || "";
    const resource: PlaybackResource = {
      type: "contenido",
      id: contenido.id,
      title: contenido.titulo,
      qualities,
    };

    try {
      const data = await apiRequest<PlaybackResponse>(playbackPath(resource, selectedQuality));
      setTestPlayback({
        ...resource,
        url: getBackendUrl(data.stream_url),
        selectedQuality,
      });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo probar el video" });
    }
  };

  const openEpisodePlayback = async (episodio: Episodio, quality?: string) => {
    const qualities = qualityOptions(episodio.video_variants);
    const selectedQuality = quality || qualities[0] || "";
    const resource: PlaybackResource = {
      type: "episodio",
      id: episodio.id,
      title: episodio.titulo,
      qualities,
    };

    try {
      const data = await apiRequest<PlaybackResponse>(playbackPath(resource, selectedQuality));
      setTestPlayback({
        ...resource,
        url: getBackendUrl(data.stream_url),
        selectedQuality,
      });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo probar el episodio" });
    }
  };

  const updateTestPlaybackQuality = async (quality: string) => {
    if (!testPlayback) return;

    try {
      const data = await apiRequest<PlaybackResponse>(playbackPath(testPlayback, quality));
      setTestPlayback({
        ...testPlayback,
        selectedQuality: quality,
        url: getBackendUrl(data.stream_url),
      });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo cambiar la calidad" });
    }
  };

  const handleContenidoUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUpdateContenido) {
      setMessage({ type: "error", text: "Elegí un contenido para modificar." });
      return;
    }

    const form = new FormData(event.currentTarget);
    const tipo = selectedUpdateContenido.tipo;
    const generosIds = form.getAll("generos_ids").map((value) => Number(value)).filter(Boolean);
    const video = form.get("video");

    if (generosIds.length === 0) {
      setMessage({ type: "error", text: "Cada contenido debe tener al menos un género." });
      return;
    }
    if (!String(form.get("descripcion") || "").trim()) {
      form.delete("descripcion");
    }
    if (tipo !== "pelicula") {
      form.delete("video");
    }
    if (video instanceof File && video.size === 0) {
      form.delete("video");
    }
    const portada = form.get("portada");
    if (portada instanceof File && portada.size === 0) {
      form.delete("portada");
    }

    try {
      const updated = await apiRequest<Contenido>(`/contenidos/${selectedUpdateContenido.id}`, {
        method: "PUT",
        body: form,
      });
      setUpdateContenidoVideoName("");
      setUpdateContenidoPortadaName("");
      showOk(updated.processing_warning?.message || "Contenido actualizado");
      loadBaseData();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo modificar el contenido" });
    }
  };

  const handleTemporadaUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest(`/temporadas/${Number(form.get("temporada_id"))}`, {
        method: "PUT",
        body: JSON.stringify({
          numero: Number(form.get("numero")),
          anio: Number(form.get("anio")),
        }),
      });
      showOk("Temporada actualizada");
      if (selectedContenidoId) {
        const data = await apiRequest<Temporada[]>(`/contenidos/${selectedContenidoId}/temporadas`);
        setTemporadas(data);
      }
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo modificar la temporada" });
    }
  };

  const handleEpisodioUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const video = form.get("video");
      if (video instanceof File && video.size === 0) {
        form.delete("video");
      }
      const updated = await apiRequest<Episodio>(`/episodios/${Number(form.get("episodio_id"))}`, {
        method: "PUT",
        body: form,
      });
      setUpdateEpisodioVideoName("");
      showOk(updated.processing_warning?.message || "Episodio actualizado");
      if (selectedTemporadaId) {
        const data = await apiRequest<Episodio[]>(`/temporadas/${selectedTemporadaId}/episodios`);
        setEpisodios(data);
      }
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo modificar el episodio" });
    }
  };

  const handleDelete = async (label: string, path: string, afterDelete?: () => void) => {
    if (!window.confirm(`Eliminar ${label}? Esta accion no se puede deshacer.`)) {
      return;
    }

    try {
      await apiRequest(path, { method: "DELETE" });
      showOk(`${label} eliminado`);
      afterDelete?.();
      loadBaseData();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : `No se pudo eliminar ${label}` });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <BrandLogo size="md" />
            <span className="rounded bg-primary/15 px-2 py-1 text-xs font-semibold text-primary">
              Admin
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut size={18} />
            Salir
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8">
        <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Consola de catalogo</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Agrega y prueba contenidos, temporadas, episodios y sus atributos.
            </p>
          </div>
          <button
            onClick={loadBaseData}
            disabled={loading}
            className="flex w-fit items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            Refrescar
          </button>
        </section>

        {message && (
          <div
            className={`rounded-md border px-4 py-3 text-sm ${
              message.type === "ok"
                ? "border-green-700 bg-green-950/40 text-green-300"
                : "border-primary/60 bg-primary/10 text-primary"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-2">
          {[
            ["crear", "Crear"],
            ["modificar", "Modificar"],
            ["eliminar", "Eliminar"],
            ["reportes", "Reportes"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id as AdminTab)}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "crear" && (
        <section className="grid gap-4 lg:grid-cols-2">
          <AdminPanel title="Generos">
            <form onSubmit={handleGeneroSubmit} className="flex gap-2">
              <input name="nombre" placeholder="Nombre del genero" className="admin-input" required />
              <button className="admin-button" type="submit">
                <Plus size={18} />
                Crear
              </button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              {generos.map((genero) => (
                <span key={genero.id} className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                  {genero.id} - {genero.nombre}
                </span>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel title="Crear contenido">
            <form onSubmit={handleContenidoSubmit} noValidate className="grid gap-3">
              <input name="titulo" placeholder="Titulo" className="admin-input" />
              <select
                name="tipo"
                className="admin-input"
                value={contenidoTipo}
                onChange={(event) => setContenidoTipo(event.target.value as "pelicula" | "serie")}
              >
                <option value="pelicula">Pelicula</option>
                <option value="serie">Serie</option>
              </select>
              <div className="grid gap-3 md:grid-cols-2">
                <input name="anio" type="number" min="1900" placeholder="Anio" className="admin-input" />
                <select name="clasificacion_edad" className="admin-input">
                  <option value="ATP">ATP</option>
                  <option value="+13">+13</option>
                  <option value="+16">+16</option>
                  <option value="+18">+18</option>
                </select>
              </div>
              <FilePicker
                id="contenido-portada"
                name="portada"
                label="Portada"
                fileName={contenidoPortadaName}
                onChange={setContenidoPortadaName}
                accept="image/*"
                hint="JPG, PNG, WebP u otro formato de imagen"
              />
              {contenidoTipo === "pelicula" && (
                <>
                  <FilePicker
                    id="contenido-video"
                    name="video"
                    label="Video de la pelicula"
                    fileName={contenidoVideoName}
                    onChange={setContenidoVideoName}
                    required
                  />
                  <p className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
                    Subi el video en la calidad maxima disponible. Titoflix detecta la resolucion y genera automaticamente las versiones necesarias.
                  </p>
                </>
              )}
              <textarea name="descripcion" placeholder="Descripcion" className="admin-input min-h-24" />
              <GenrePicker generos={generos} />
              {contenidoTipo === "serie" && (
                <p className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
                  Las series no llevan video directo. Crea temporadas y luego carga videos en sus episodios.
                </p>
              )}
              <FormMessage message={contenidoFormMessage} />
              <button className="admin-button w-fit" type="submit" disabled={creatingContenido}>
                {creatingContenido ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                {creatingContenido ? "Subiendo..." : "Crear contenido"}
              </button>
            </form>
          </AdminPanel>

          <AdminPanel title="Crear temporada">
            <form onSubmit={handleTemporadaSubmit} className="grid gap-3">
              <select name="contenido_id" className="admin-input" required>
                <option value="">Serie</option>
                {series.map((serie) => (
                  <option key={serie.id} value={serie.id}>
                    {serie.id} - {serie.titulo}
                  </option>
                ))}
              </select>
              <div className="grid gap-3 md:grid-cols-2">
                <input name="numero" type="number" min="1" placeholder="Numero" className="admin-input" required />
                <input name="anio" type="number" min="1900" placeholder="Anio" className="admin-input" required />
              </div>
              <button className="admin-button w-fit" type="submit">
                <Plus size={18} />
                Crear temporada
              </button>
            </form>
          </AdminPanel>

          <AdminPanel title="Crear episodio">
            <form onSubmit={handleEpisodioSubmit} noValidate className="grid gap-3">
              <select
                className="admin-input"
                value={episodeCreateContenidoId}
                onChange={(event) => {
                  setEpisodeCreateContenidoId(event.target.value);
                  setEpisodeCreateTemporadaId("");
                  setEpisodioFormMessage(null);
                }}
              >
                <option value="">Elegir serie</option>
                {series.map((serie) => (
                  <option key={serie.id} value={serie.id}>
                    {serie.id} - {serie.titulo}
                  </option>
                ))}
              </select>
              <select
                name="temporada_id"
                className="admin-input"
                value={episodeCreateTemporadaId}
                onChange={(event) => {
                  setEpisodeCreateTemporadaId(event.target.value);
                  setEpisodioFormMessage(null);
                }}
                disabled={!episodeCreateContenidoId}
              >
                <option value="">Temporada</option>
                {episodeCreateTemporadas.map((temporada) => (
                  <option key={temporada.id} value={temporada.id}>
                    {selectedEpisodeCreateContenido?.titulo} - Temporada {temporada.numero}
                  </option>
                ))}
              </select>
              {episodeCreateContenidoId && episodeCreateTemporadas.length === 0 && (
                <p className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
                  Esta serie todavia no tiene temporadas. Crea una temporada primero.
                </p>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                <input name="numero" type="number" min="1" placeholder="Numero" className="admin-input" />
              </div>
              <input name="titulo" placeholder="Titulo del episodio" className="admin-input" />
              <FilePicker
                id="episodio-video"
                name="video"
                label="Video del episodio"
                fileName={episodioVideoName}
                onChange={setEpisodioVideoName}
                required
              />
              <p className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
                Subi el video en la calidad maxima disponible. Titoflix detecta la resolucion y genera automaticamente las versiones necesarias.
              </p>
              <FormMessage message={episodioFormMessage} />
              <button className="admin-button w-fit" type="submit" disabled={creatingEpisodio}>
                {creatingEpisodio ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                {creatingEpisodio ? "Subiendo..." : "Crear episodio"}
              </button>
            </form>
          </AdminPanel>
        </section>
        )}

        {activeTab === "modificar" && (
          <section className="grid gap-4 lg:grid-cols-2">
            <AdminPanel title="Modificar contenido">
              <select
                className="admin-input"
                value={updateContenidoId}
                onChange={(event) => setUpdateContenidoId(event.target.value)}
              >
                  <option value="">Contenido</option>
                  {contenidos.map((contenido) => (
                    <option key={contenido.id} value={contenido.id}>
                      {contenido.id} - {contenido.titulo}
                    </option>
                  ))}
                </select>
              {!selectedUpdateContenido ? (
                <p className="mt-3 rounded-md border border-border bg-secondary/40 px-4 py-4 text-sm text-muted-foreground">
                  Elegí una película o serie para cargar sus datos actuales.
                </p>
              ) : (
                <form key={selectedUpdateContenido.id} onSubmit={handleContenidoUpdate} className="mt-3 grid gap-3">
                  <div className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">
                    Tipo:{" "}
                    <span className="font-semibold text-foreground">
                      {selectedUpdateContenido.tipo === "pelicula" ? "Película" : "Serie"}
                    </span>
                  </div>
                  <input
                    name="titulo"
                    placeholder="Titulo"
                    className="admin-input"
                    defaultValue={selectedUpdateContenido.titulo}
                    required
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      name="anio"
                      type="number"
                      min="1900"
                      placeholder="Anio"
                      className="admin-input"
                      defaultValue={selectedUpdateContenido.anio ?? ""}
                      required
                    />
                    <select
                      name="clasificacion_edad"
                      className="admin-input"
                      defaultValue={selectedUpdateContenido.clasificacion_edad || selectedUpdateContenido.clasificacion || "ATP"}
                      required
                    >
                      <option value="ATP">ATP</option>
                      <option value="+13">+13</option>
                      <option value="+16">+16</option>
                      <option value="+18">+18</option>
                    </select>
                  </div>
                  {selectedUpdateContenido.tipo === "pelicula" && (
                    <>
                      <FilePicker
                        id={`update-contenido-video-${selectedUpdateContenido.id}`}
                        name="video"
                        label="Reemplazar video de la película"
                        fileName={updateContenidoVideoName}
                        onChange={setUpdateContenidoVideoName}
                      />
                      <p className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
                        Si no elegis un archivo nuevo, se conserva el video actual. Si lo reemplazas, subi la calidad maxima disponible y se regeneran las variantes.
                      </p>
                    </>
                  )}
                  <FilePicker
                    id={`update-contenido-portada-${selectedUpdateContenido.id}`}
                    name="portada"
                    label="Reemplazar portada"
                    fileName={updateContenidoPortadaName}
                    onChange={setUpdateContenidoPortadaName}
                    accept="image/*"
                    hint="Si no elegis una imagen nueva, se conserva la portada actual"
                  />
                  {getAssetUrl(selectedUpdateContenido.portada_url) && (
                    <img
                      src={getAssetUrl(selectedUpdateContenido.portada_url) || ""}
                      alt=""
                      className="h-32 w-24 rounded-md object-cover"
                    />
                  )}
                  <textarea
                    name="descripcion"
                    placeholder="Descripcion"
                    className="admin-input min-h-24"
                    defaultValue={selectedUpdateContenido.descripcion || ""}
                  />
                  <GenrePicker
                    generos={generos}
                    selectedGeneroIds={selectedUpdateContenido.generos?.map((genero) => genero.id)}
                  />
                  {selectedUpdateContenido.tipo === "serie" && (
                    <p className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
                      Las series no tienen duración ni video directo. El archivo de video se cambia desde sus episodios.
                    </p>
                  )}
                  <button className="admin-button w-fit" type="submit">Guardar contenido</button>
                </form>
              )}
            </AdminPanel>

            <AdminPanel title="Modificar temporada">
              <form onSubmit={handleTemporadaUpdate} className="grid gap-3">
                <select
                  className="admin-input"
                  value={selectedContenidoId}
                  onChange={(event) => {
                    setSelectedContenidoId(event.target.value);
                    setSelectedTemporadaId("");
                  }}
                >
                  <option value="">Elegir serie</option>
                  {series.map((serie) => (
                    <option key={serie.id} value={serie.id}>
                      {serie.id} - {serie.titulo}
                    </option>
                  ))}
                </select>
                <select name="temporada_id" className="admin-input" required>
                  <option value="">Temporada</option>
                  {temporadas.map((temporada) => (
                    <option key={temporada.id} value={temporada.id}>
                      ID {temporada.id} - Temporada {temporada.numero}
                    </option>
                  ))}
                </select>
                <div className="grid gap-3 md:grid-cols-2">
                  <input name="numero" type="number" min="1" placeholder="Numero" className="admin-input" required />
                  <input name="anio" type="number" min="1900" placeholder="Anio" className="admin-input" required />
                </div>
                <button className="admin-button w-fit" type="submit">Guardar temporada</button>
              </form>
            </AdminPanel>

            <AdminPanel title="Modificar episodio">
              <form onSubmit={handleEpisodioUpdate} className="grid gap-3">
                <select
                  className="admin-input"
                  value={selectedContenidoId}
                  onChange={(event) => {
                    setSelectedContenidoId(event.target.value);
                    setSelectedTemporadaId("");
                  }}
                >
                  <option value="">Elegir serie</option>
                  {series.map((serie) => (
                    <option key={serie.id} value={serie.id}>
                      {serie.id} - {serie.titulo}
                    </option>
                  ))}
                </select>
                <select
                  className="admin-input"
                  value={selectedTemporadaId}
                  onChange={(event) => setSelectedTemporadaId(event.target.value)}
                >
                  <option value="">Elegir temporada para cargar episodios</option>
                  {temporadas.map((temporada) => (
                    <option key={temporada.id} value={temporada.id}>
                      Temporada {temporada.numero}
                    </option>
                  ))}
                </select>
                <select
                  name="episodio_id"
                  className="admin-input"
                  required
                >
                  <option value="">Episodio</option>
                  {episodios.map((episodio) => (
                    <option key={episodio.id} value={episodio.id}>
                      ID {episodio.id} - E{episodio.numero} - {episodio.titulo}
                    </option>
                  ))}
                </select>
                <div className="grid gap-3 md:grid-cols-2">
                  <input name="numero" type="number" min="1" placeholder="Numero" className="admin-input" required />
                </div>
                <input name="titulo" placeholder="Titulo" className="admin-input" required />
                <FilePicker
                  id="update-episodio-video"
                  name="video"
                  label="Reemplazar video del episodio"
                  fileName={updateEpisodioVideoName}
                  onChange={setUpdateEpisodioVideoName}
                />
                <p className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
                  Si no elegis un archivo nuevo, se conserva el video actual. Si lo reemplazas, subi la calidad maxima disponible y se regeneran las variantes.
                </p>
                <button className="admin-button w-fit" type="submit">Guardar episodio</button>
              </form>
              <p className="mt-3 text-xs text-muted-foreground">
                Para cargar episodios en esta lista, elegi una serie y temporada en cualquier selector de la consola.
              </p>
            </AdminPanel>
          </section>
        )}

        {activeTab === "eliminar" && (
          <section className="grid gap-4 lg:grid-cols-2">
            <AdminPanel title="Eliminar generos">
              <DeleteList
                items={generos.map((genero) => ({ id: genero.id, label: genero.nombre }))}
                onDelete={(item) => handleDelete(`genero ${item.label}`, `/generos/${item.id}`)}
              />
            </AdminPanel>

            <AdminPanel title="Eliminar contenidos">
              <DeleteList
                items={contenidos.map((contenido) => ({ id: contenido.id, label: `${contenido.titulo} (${contenido.tipo})` }))}
                onDelete={(item) => handleDelete(`contenido ${item.label}`, `/contenidos/${item.id}`)}
              />
            </AdminPanel>

            <AdminPanel title="Eliminar temporadas">
              <DeleteList
                items={temporadas.map((temporada) => ({ id: temporada.id, label: `Temporada ${temporada.numero}` }))}
                onDelete={(item) =>
                  handleDelete(`temporada ${item.label}`, `/temporadas/${item.id}`, () => {
                    setTemporadas((current) => current.filter((temporada) => temporada.id !== item.id));
                  })
                }
              />
            </AdminPanel>

            <AdminPanel title="Eliminar episodios">
              <DeleteList
                items={episodios.map((episodio) => ({ id: episodio.id, label: `E${episodio.numero} - ${episodio.titulo}` }))}
                onDelete={(item) =>
                  handleDelete(`episodio ${item.label}`, `/episodios/${item.id}`, () => {
                    setEpisodios((current) => current.filter((episodio) => episodio.id !== item.id));
                  })
                }
              />
            </AdminPanel>
          </section>
        )}

        {/* HU14: Tab de Reportes de Visualizacion */}
        {activeTab === "reportes" && (
          <section className="grid gap-4">
            <AdminPanel title="Reporte de visualizacion mensual">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="grid gap-2">
                  <label htmlFor="reporte-anio" className="text-xs font-medium text-muted-foreground">
                    Anio
                  </label>
                  <input
                    id="reporte-anio"
                    type="number"
                    min="2020"
                    max={new Date().getFullYear()}
                    value={reporteAnio}
                    onChange={(e) => setReporteAnio(Number(e.target.value))}
                    className="admin-input w-28"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="reporte-mes" className="text-xs font-medium text-muted-foreground">
                    Mes
                  </label>
                  <select
                    id="reporte-mes"
                    value={reporteMes}
                    onChange={(e) => setReporteMes(Number(e.target.value))}
                    className="admin-input w-40"
                  >
                    {[
                      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                    ].map((mes, i) => (
                      <option key={i + 1} value={i + 1}>{mes}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={loadReporte}
                  disabled={reporteLoading}
                  className="admin-button"
                >
                  {reporteLoading ? <Loader2 size={18} className="animate-spin" /> : <BarChart3 size={18} />}
                  {reporteLoading ? "Cargando..." : "Generar reporte"}
                </button>
              </div>

              {reporte && (
                <div className="mt-6 space-y-6">
                  {/* Resumen general */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-border bg-secondary/50 p-4">
                      <p className="text-xs text-muted-foreground">Total minutos vistos</p>
                      <p className="text-2xl font-bold text-foreground">{reporte.total_minutos.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-secondary/50 p-4">
                      <p className="text-xs text-muted-foreground">Contenidos vistos</p>
                      <p className="text-2xl font-bold text-foreground">{reporte.total_contenidos}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-secondary/50 p-4">
                      <p className="text-xs text-muted-foreground">Periodo</p>
                      <p className="text-2xl font-bold text-foreground">
                        {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][reporte.mes - 1]} {reporte.anio}
                      </p>
                    </div>
                  </div>

                  {/* Desglose por genero */}
                  {Object.keys(reporte.por_genero).length > 0 && (
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-foreground">Minutos por genero</h3>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(reporte.por_genero)
                          .sort(([, a], [, b]) => b - a)
                          .map(([genero, minutos]) => (
                            <div key={genero} className="rounded-full bg-primary/15 px-3 py-1.5 text-xs">
                              <span className="font-semibold text-primary">{genero}</span>
                              <span className="ml-1 text-muted-foreground">{minutos.toLocaleString()} min</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Top 20 contenidos */}
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-foreground">
                      Top {reporte.contenidos.length} contenidos mas vistos
                    </h3>
                    {reporte.contenidos.length === 0 ? (
                      <div className="rounded-lg border border-border bg-secondary/40 px-4 py-8 text-center text-sm text-muted-foreground">
                        No hay datos de visualizacion para este periodo.
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto pr-2">
                        <div className="space-y-2">
                          {reporte.contenidos.map((item, index) => (
                            <div
                              key={item.contenido_id}
                              className="flex items-center gap-4 rounded-lg border border-border bg-secondary/50 px-4 py-3"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                                {index + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  {item.tipo === "pelicula" ? <Film size={14} /> : <Tv size={14} />}
                                  <span className="truncate font-medium text-foreground">{item.titulo}</span>
                                </div>
                                <div className="mt-0.5 flex flex-wrap gap-1">
                                  {item.generos.map((g) => (
                                    <span key={g} className="text-xs text-muted-foreground">{g}</span>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-foreground">{item.minutos_vistos.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">minutos</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!reporte && !reporteLoading && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Selecciona un anio y mes, luego haz clic en &quot;Generar reporte&quot; para ver las estadisticas de visualizacion.
                </p>
              )}
            </AdminPanel>
          </section>
        )}

        <AdminPanel title={`Contenido cargado (${contenidos.length})`}>
          <div className="max-h-[34rem] overflow-y-auto pr-2">
            {contenidos.length === 0 ? (
              <div className="rounded-lg border border-border bg-secondary/40 px-4 py-8 text-center text-sm text-muted-foreground">
                Todavia no hay contenidos cargados.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {contenidos.map((contenido) => (
                  <div key={contenido.id} className="rounded-lg border border-border bg-secondary/50 p-4">
                    {getAssetUrl(contenido.portada_url) && (
                      <img
                        src={getAssetUrl(contenido.portada_url) || ""}
                        alt=""
                        className="mb-3 aspect-[2/3] w-20 rounded-md object-cover"
                      />
                    )}
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{contenido.titulo}</h3>
                        <p className="text-xs text-muted-foreground">
                          ID {contenido.id} - {contenido.tipo} - {contenido.anio} - {contenido.clasificacion_edad}
                        </p>
                      </div>
                      {contenido.tipo === "pelicula" ? <Film size={20} /> : <Tv size={20} />}
                    </div>
                    {contenido.descripcion && (
                      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{contenido.descripcion}</p>
                    )}
                    {contenido.tipo === "pelicula" && (
                      <button onClick={() => openPlayback(contenido)} className="admin-button">
                        <Play size={18} />
                        Test playback
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </AdminPanel>

        <AdminPanel title="Temporadas y episodios">
          <div className="grid gap-3 md:grid-cols-2">
            <select
              className="admin-input"
              value={episodeBrowserContenidoId}
              onChange={(event) => {
                setEpisodeBrowserContenidoId(event.target.value);
                setEpisodeBrowserTemporadaId("");
              }}
            >
              <option value="">Elegir serie</option>
              {series.map((serie) => (
                <option key={serie.id} value={serie.id}>
                  {serie.id} - {serie.titulo}
                </option>
              ))}
            </select>
            <select
              className="admin-input"
              value={episodeBrowserTemporadaId}
              onChange={(event) => setEpisodeBrowserTemporadaId(event.target.value)}
              disabled={!episodeBrowserContenidoId}
            >
              <option value="">Elegir temporada</option>
              {episodeBrowserTemporadas.map((temporada) => (
                <option key={temporada.id} value={temporada.id}>
                  {selectedEpisodeBrowserContenido?.titulo} - Temporada {temporada.numero}
                </option>
              ))}
            </select>
          </div>

          {!episodeBrowserContenidoId && (
            <p className="mt-3 text-sm text-muted-foreground">
              Elegi una serie para ver sus temporadas y probar episodios.
            </p>
          )}

          {episodeBrowserContenidoId && episodeBrowserTemporadas.length === 0 && (
            <p className="mt-3 rounded-md border border-border bg-secondary/40 px-4 py-4 text-sm text-muted-foreground">
              Esta serie todavia no tiene temporadas.
            </p>
          )}

          {episodeBrowserTemporadaId && episodeBrowserEpisodios.length === 0 && (
            <p className="mt-3 rounded-md border border-border bg-secondary/40 px-4 py-4 text-sm text-muted-foreground">
              Esta temporada todavia no tiene episodios.
            </p>
          )}

          {episodeBrowserEpisodios.length > 0 && (
            <div className="mt-4 grid gap-2">
              {episodeBrowserEpisodios.map((episodio) => (
                <div
                  key={episodio.id}
                  className="flex flex-col gap-3 rounded-md border border-border bg-secondary/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  {getAssetUrl(episodio.thumbnail_url) && (
                    <img
                      src={getAssetUrl(episodio.thumbnail_url) || ""}
                      alt=""
                      className="h-16 w-28 shrink-0 rounded-md object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      E{episodio.numero} - {episodio.titulo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID {episodio.id} - {episodio.duracion_min} min
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEpisodePlayback(episodio)}
                    className="admin-button shrink-0"
                  >
                    <Play size={18} />
                    Test playback
                  </button>
                </div>
              ))}
            </div>
          )}
        </AdminPanel>

        {testPlayback && (
          <AdminPanel title={`Test playback - ${testPlayback.title}`}>
            {testPlayback.qualities.length > 0 && (
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label htmlFor="test-playback-quality" className="text-sm font-medium text-muted-foreground">
                  Calidad
                </label>
                <select
                  id="test-playback-quality"
                  className="admin-input sm:max-w-48"
                  value={testPlayback.selectedQuality}
                  onChange={(event) => updateTestPlaybackQuality(event.target.value)}
                >
                  {testPlayback.qualities.map((quality) => (
                    <option key={quality} value={quality}>
                      {quality}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="overflow-hidden rounded-lg border border-border bg-black">
              <video
                key={testPlayback.url}
                src={testPlayback.url}
                controls
                autoPlay
                className="aspect-video w-full bg-black"
              />
            </div>
            <button
              type="button"
              onClick={() => setTestPlayback(null)}
              className="mt-3 rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80"
            >
              Cerrar reproductor
            </button>
          </AdminPanel>
        )}

        {episodios.length > 0 && (
          <AdminPanel title="Episodios de la temporada seleccionada">
            <div className="grid gap-2">
              {episodios.map((episodio) => (
                <div key={episodio.id} className="rounded-md bg-secondary px-3 py-2 text-sm text-muted-foreground">
                  ID {episodio.id} - E{episodio.numero} - {episodio.titulo} - {episodio.duracion_min} min
                </div>
              ))}
            </div>
          </AdminPanel>
        )}
      </main>
    </div>
  );
}

function AdminPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function FormMessage({ message }: { message: Message }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`rounded-md border px-3 py-2 text-xs ${
        message.type === "ok"
          ? "border-green-700 bg-green-950/40 text-green-300"
          : "border-primary/60 bg-primary/10 text-primary"
      }`}
    >
      {message.text}
    </div>
  );
}

function DeleteList({
  items,
  onDelete,
}: {
  items: Array<{ id: number; label: string }>;
  onDelete: (item: { id: number; label: string }) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-border bg-secondary/40 px-4 py-6 text-center text-sm text-muted-foreground">
        No hay elementos para eliminar.
      </div>
    );
  }

  return (
    <div className="max-h-80 overflow-y-auto pr-2">
      <div className="grid gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/50 px-3 py-2"
          >
            <span className="min-w-0 truncate text-sm text-foreground">
              {item.id} - {item.label}
            </span>
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="shrink-0 rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-85"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function GenrePicker({
  generos,
  optional = false,
  selectedGeneroIds = [],
}: {
  generos: Genero[];
  optional?: boolean;
  selectedGeneroIds?: number[];
}) {
  if (generos.length === 0) {
    return (
      <div className="rounded-md border border-primary/50 bg-primary/10 px-3 py-2 text-xs text-primary">
        Primero crea al menos un genero en el panel de generos.
      </div>
    );
  }

  return (
    <div>
      <span className="mb-2 block text-xs font-medium text-muted-foreground">
        Generos {optional ? "(opcional)" : ""}
      </span>
      <div className="max-h-32 overflow-y-auto rounded-md border border-border bg-secondary/50 p-2">
        <div className="grid gap-2 sm:grid-cols-2">
          {generos.map((genero) => (
            <label key={genero.id} className="flex items-center gap-2 rounded bg-background/40 px-2 py-2 text-sm">
              <input
                type="checkbox"
                name="generos_ids"
                value={genero.id}
                defaultChecked={selectedGeneroIds.includes(genero.id)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              <span className="truncate">{genero.nombre}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function dedupeById(contents: Contenido[]): Contenido[] {
  return Array.from(new Map(contents.map((content) => [content.id, content])).values());
}

function qualityRank(quality: string): number {
  return { FHD: 1, QHD: 2, "4K": 3 }[quality] || 0;
}

function FilePicker({
  id,
  name,
  label,
  fileName,
  onChange,
  required = false,
  accept = "video/*",
  hint = "MP4, WebM u otro formato de video",
}: {
  id: string;
  name: string;
  label: string;
  fileName: string;
  onChange: (fileName: string) => void;
  required?: boolean;
  accept?: string;
  hint?: string;
}) {
  return (
    <div>
      <span className="mb-2 block text-xs font-medium text-muted-foreground">{label}</span>
      <label
        htmlFor={id}
        className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-secondary/70 px-4 py-3 transition-colors hover:border-primary/70 hover:bg-secondary"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-background text-primary">
            <Upload size={20} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-foreground">
              {fileName || "No hay archivo seleccionado"}
            </span>
            <span className="block text-xs text-muted-foreground">{hint}</span>
          </span>
        </span>
        <span className="shrink-0 rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
          Elegir
        </span>
      </label>
      <input
        id={id}
        name={name}
        type="file"
        accept={accept}
        aria-required={required}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Only enforce MAX_UPLOAD_SIZE for images (avatars, portada).
          const shouldEnforceSize = accept && accept.includes("image");
          if (file && shouldEnforceSize && file.size > MAX_UPLOAD_SIZE) {
            const allowedMB = Math.round((MAX_UPLOAD_SIZE / 1024 / 1024) * 10) / 10;
            alert(`El archivo es demasiado grande. Tamaño máximo: ${allowedMB}MB.`);
            // reset input
            event.currentTarget.value = "";
            onChange("");
            return;
          }
          onChange(file?.name || "");
        }}
      />
    </div>
  );
}
