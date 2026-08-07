export type LatLng = { lat: number; lng: number };

export type GeocodeResult = {
  display_name: string;
  lat: number;
  lng: number;
};

export async function geocode(query: string): Promise<GeocodeResult[]> {
  if (!query.trim()) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
  return data.map((d) => ({
    display_name: d.display_name,
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
  }));
}

export async function reverseGeocode(point: LatLng): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${point.lat}&lon=${point.lng}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
  const data = (await res.json()) as { display_name?: string };
  return data.display_name ?? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
}

export async function routeDistanceKm(origen: LatLng, destino: LatLng): Promise<number> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origen.lng},${origen.lat};${destino.lng},${destino.lat}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo calcular la ruta");
  const data = (await res.json()) as { routes?: Array<{ distance: number }> };
  const meters = data.routes?.[0]?.distance ?? 0;
  return meters / 1000;
}

export function getCurrentPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocalización no soportada"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.message)),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}
