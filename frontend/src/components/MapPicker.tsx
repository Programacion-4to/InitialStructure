import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  geocode,
  getCurrentPosition,
  reverseGeocode,
  routeDistanceKm,
  type GeocodeResult,
  type LatLng,
} from "@/lib/geo";

// Fix default icon paths (Vite no inlinea las imágenes de leaflet)
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const DEFAULT_CENTER: LatLng = { lat: -34.6037, lng: -58.3816 }; // Buenos Aires

type Mode = "origen" | "destino";

type Props = {
  origen: LatLng | null;
  destino: LatLng | null;
  origenLabel: string;
  destinoLabel: string;
  onOrigenChange: (point: LatLng | null, label: string) => void;
  onDestinoChange: (point: LatLng | null, label: string) => void;
  onDistanciaChange: (km: number | null) => void;
};

function ClickHandler({ mode, onPick }: { mode: Mode; onPick: (m: Mode, p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick(mode, { lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Recenter({ point }: { point: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.flyTo([point.lat, point.lng], 14);
  }, [point, map]);
  return null;
}

export function MapPicker({
  origen,
  destino,
  origenLabel,
  destinoLabel,
  onOrigenChange,
  onDestinoChange,
  onDistanciaChange,
}: Props) {
  const [mode, setMode] = useState<Mode>("origen");
  const [origenSearch, setOrigenSearch] = useState(origenLabel);
  const [destinoSearch, setDestinoSearch] = useState(destinoLabel);
  const [origenResults, setOrigenResults] = useState<GeocodeResult[]>([]);
  const [destinoResults, setDestinoResults] = useState<GeocodeResult[]>([]);
  const [loadingLoc, setLoadingLoc] = useState(false);

  useEffect(() => setOrigenSearch(origenLabel), [origenLabel]);
  useEffect(() => setDestinoSearch(destinoLabel), [destinoLabel]);

  // Calcula distancia cuando hay ambos puntos
  useEffect(() => {
    let cancel = false;
    if (!origen || !destino) {
      onDistanciaChange(null);
      return;
    }
    routeDistanceKm(origen, destino)
      .then((km) => !cancel && onDistanciaChange(Math.round(km * 100) / 100))
      .catch(() => !cancel && onDistanciaChange(null));
    return () => {
      cancel = true;
    };
  }, [origen, destino, onDistanciaChange]);

  const center = useMemo<LatLng>(() => origen ?? destino ?? DEFAULT_CENTER, [origen, destino]);

  const pickOnMap = async (m: Mode, p: LatLng) => {
    const label = await reverseGeocode(p);
    if (m === "origen") {
      onOrigenChange(p, label);
      setOrigenSearch(label);
      setMode("destino");
    } else {
      onDestinoChange(p, label);
      setDestinoSearch(label);
    }
  };

  const useCurrentLocation = async () => {
    try {
      setLoadingLoc(true);
      const p = await getCurrentPosition();
      const label = await reverseGeocode(p);
      onOrigenChange(p, label);
      setOrigenSearch(label);
      setMode("destino");
    } catch (e) {
      alert("No se pudo obtener la ubicación: " + (e as Error).message);
    } finally {
      setLoadingLoc(false);
    }
  };

  const searchOrigen = async () => setOrigenResults(await geocode(origenSearch));
  const searchDestino = async () => setDestinoResults(await geocode(destinoSearch));

  const pickResult = (m: Mode, r: GeocodeResult) => {
    const p = { lat: r.lat, lng: r.lng };
    if (m === "origen") {
      onOrigenChange(p, r.display_name);
      setOrigenSearch(r.display_name);
      setOrigenResults([]);
      setMode("destino");
    } else {
      onDestinoChange(p, r.display_name);
      setDestinoSearch(r.display_name);
      setDestinoResults([]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "origen" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("origen")}
        >
          Marcar origen
        </Button>
        <Button
          type="button"
          variant={mode === "destino" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("destino")}
        >
          Marcar destino
        </Button>
        <Button type="button" size="sm" onClick={useCurrentLocation} disabled={loadingLoc}>
          {loadingLoc ? "Obteniendo..." : "Usar ubicación actual"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Origen</Label>
          <div className="flex gap-1">
            <Input
              value={origenSearch}
              onChange={(e) => setOrigenSearch(e.target.value)}
              placeholder="Dirección de origen"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  searchOrigen();
                }
              }}
            />
            <Button type="button" variant="outline" size="sm" onClick={searchOrigen}>
              Buscar
            </Button>
          </div>
          {origenResults.length > 0 && (
            <ul className="rounded border bg-popover text-sm max-h-40 overflow-y-auto">
              {origenResults.map((r, i) => (
                <li
                  key={i}
                  className="px-2 py-1 cursor-pointer hover:bg-muted"
                  onClick={() => pickResult("origen", r)}
                >
                  {r.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-1">
          <Label>Destino</Label>
          <div className="flex gap-1">
            <Input
              value={destinoSearch}
              onChange={(e) => setDestinoSearch(e.target.value)}
              placeholder="Dirección de destino"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  searchDestino();
                }
              }}
            />
            <Button type="button" variant="outline" size="sm" onClick={searchDestino}>
              Buscar
            </Button>
          </div>
          {destinoResults.length > 0 && (
            <ul className="rounded border bg-popover text-sm max-h-40 overflow-y-auto">
              {destinoResults.map((r, i) => (
                <li
                  key={i}
                  className="px-2 py-1 cursor-pointer hover:bg-muted"
                  onClick={() => pickResult("destino", r)}
                >
                  {r.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="h-80 w-full rounded-md overflow-hidden border">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler mode={mode} onPick={pickOnMap} />
          <Recenter point={origen ?? destino} />
          {origen && (
            <Marker
              position={[origen.lat, origen.lng]}
              icon={icon}
              draggable
              eventHandlers={{
                dragend: async (e) => {
                  const ll = e.target.getLatLng();
                  const p = { lat: ll.lat, lng: ll.lng };
                  const label = await reverseGeocode(p);
                  onOrigenChange(p, label);
                  setOrigenSearch(label);
                },
              }}
            />
          )}
          {destino && (
            <Marker
              position={[destino.lat, destino.lng]}
              icon={icon}
              draggable
              eventHandlers={{
                dragend: async (e) => {
                  const ll = e.target.getLatLng();
                  const p = { lat: ll.lat, lng: ll.lng };
                  const label = await reverseGeocode(p);
                  onDestinoChange(p, label);
                  setDestinoSearch(label);
                },
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
