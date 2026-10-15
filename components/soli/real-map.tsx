'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import localforage from 'localforage';
import { Crosshair, Download, X, Check } from 'lucide-react';

// Configurar localforage
localforage.config({
    name: 'SoliNetMap',
    storeName: 'tiles',
});

// ===== TIPOS =====

export interface MapSolinera {
    id?: number;
    name: string;
    address: string;
    lat: number;
    lng: number;
    pricePerKwh: number;
    points: number;
}

interface RealMapProps {
    solineras: MapSolinera[];
    selectedId?: number;
    onSelect: (solinera: MapSolinera) => void;
    onReserve: (solinera: MapSolinera) => void;
    interactive?: boolean;
    onLocationSelect?: (lat: number, lng: number) => void;
    initialCenter?: [number, number];
    initialZoom?: number;
    markerPosition?: [number, number] | null;
    showDownloadControl?: boolean;
}

const DEFAULT_CENTER: [number, number] = [23.1136, -82.3666];
const DEFAULT_ZOOM = 12;
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const SUBDOMAINS = 'abc';

// ===== UTILIDADES =====

function latLngToTile(lat: number, lng: number, z: number) {
    const n = Math.pow(2, z);
    const x = Math.floor(((lng + 180) / 360) * n);
    const latRad = (lat * Math.PI) / 180;
    const y = Math.floor(
        ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
    );
    return { x, y };
}

function tileKey(x: number, y: number, z: number) {
    return `${x}:${y}:${z}`;
}

function buildTileUrl(x: number, y: number, z: number) {
    const subdomain = SUBDOMAINS[Math.abs(x + y) % SUBDOMAINS.length];
    return `https://${subdomain}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
}

// ===== CAPA DE TILES CON CACHÉ =====

function createCachedTileLayer(): L.TileLayer {
    const layer = L.tileLayer(TILE_URL, {
        subdomains: SUBDOMAINS,
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
    });

    // @ts-ignore
    layer.createTile = function (coords: L.Coords, done: L.DoneCallback) {
        const tile = document.createElement('img');
        tile.alt = '';
        tile.crossOrigin = 'anonymous';
        const key = tileKey(coords.x, coords.y, coords.z);

        const loadFromNetwork = () => {
            const url = buildTileUrl(coords.x, coords.y, coords.z);
            tile.onload = () => {
                fetch(url)
                    .then((r) => (r.ok ? r.blob() : null))
                    .then((blob) => {
                        if (blob) localforage.setItem(key, blob).catch(() => { });
                    })
                    .catch(() => { });
                done(undefined, tile);
            };
            tile.onerror = (e) => done(e as any, tile);
            tile.src = url;
        };

        localforage
            .getItem<Blob>(key)
            .then((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    tile.onload = () => {
                        URL.revokeObjectURL(url);
                        done(undefined, tile);
                    };
                    tile.onerror = () => {
                        URL.revokeObjectURL(url);
                        loadFromNetwork();
                    };
                    tile.src = url;
                } else {
                    loadFromNetwork();
                }
            })
            .catch(() => loadFromNetwork());

        return tile;
    };

    return layer;
}

// ===== COMPONENTES INTERNOS =====

function MapRecenter({ center }: { center: [number, number] | null }) {
    const map = useMap();
    React.useEffect(() => {
        if (center) map.setView(center, 15, { animate: true });
    }, [center, map]);
    return null;
}

function MapClickHandler({
    onClick,
}: {
    onClick: (lat: number, lng: number) => void;
}) {
    const map = useMap();
    React.useEffect(() => {
        const handler = (e: L.LeafletMouseEvent) =>
            onClick(e.latlng.lat, e.latlng.lng);
        map.on('click', handler);
        return () => {
            map.off('click', handler);
        };
    }, [map, onClick]);
    return null;
}

function MapInstanceCatcher({ onReady }: { onReady: (map: L.Map) => void }) {
    const map = useMap();
    React.useEffect(() => {
        onReady(map);
    }, [map, onReady]);
    return null;
}

function TileLayerSetup() {
    const map = useMap();
    const addedRef = React.useRef(false);

    React.useEffect(() => {
        if (!map || addedRef.current) return;
        addedRef.current = true;

        const layer = createCachedTileLayer();
        layer.addTo(map);

        return () => {
            try {
                map.removeLayer(layer);
            } catch (e) { }
            addedRef.current = false;
        };
    }, [map]);

    return null;
}

// ===== ICONOS =====

const createSolineraIcon = (isSelected: boolean, isAvailable: boolean) => {
    const bgColor = isSelected
        ? '#FF8C00'
        : isAvailable
            ? '#10B981'
            : '#EF4444';
    const size = isSelected ? 48 : 40;

    return L.divIcon({
        className: 'custom-marker',
        html: `
      <div style="position: relative; width: ${size}px; height: ${size}px;">
        <span style="position: absolute; inset: -8px; border-radius: 50%; background: ${bgColor}33; animation: pulseMarker 2s infinite;"></span>
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: ${size}px; height: ${size}px; border-radius: 50%; background: ${bgColor}; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); color: white; font-size: ${size * 0.4}px; font-weight: bold;">⚡</div>
      </div>
    `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
    });
};

const locationIcon = L.divIcon({
    className: 'custom-marker',
    html: `
    <div style="position: relative; width: 48px; height: 48px;">
      <span style="position: absolute; inset: -8px; border-radius: 50%; background: #FF8C0033; animation: pulseMarker 2s infinite;"></span>
      <div style="display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background: linear-gradient(135deg, #FF8C00, #FFD700); border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
        <span style="transform: rotate(45deg); font-size: 20px;">📍</span>
      </div>
    </div>
  `,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
});

const userIcon = L.divIcon({
    className: 'custom-marker',
    html: `
    <div style="position: relative; width: 20px; height: 20px;">
      <span style="position: absolute; inset: -12px; border-radius: 50%; background: #3B82F633; animation: pulseMarker 2s infinite;"></span>
      <div style="width: 20px; height: 20px; border-radius: 50%; background: #3B82F6; border: 4px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.4);"></div>
    </div>
  `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
});

// ===== MODAL DE DESCARGA (via PORTAL) =====

function DownloadModal({
    open,
    onClose,
    onDownload,
    progress,
    isDownloading,
    result,
}: {
    open: boolean;
    onClose: () => void;
    onDownload: (zoomLevels: number[]) => void;
    progress: { done: number; total: number };
    isDownloading: boolean;
    result: { success: number; failed: number } | null;
}) {
    const [selectedZooms, setSelectedZooms] = React.useState<number[]>([
        13, 14, 15,
    ]);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Bloquear scroll del body cuando el modal está abierto
    React.useEffect(() => {
        if (!open) return;
        const original = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = original;
        };
    }, [open]);

    if (!open || !mounted) return null;

    const toggleZoom = (z: number) => {
        setSelectedZooms((prev) =>
            prev.includes(z) ? prev.filter((x) => x !== z) : [...prev, z].sort()
        );
    };

    const percentage =
        progress.total > 0
            ? Math.round((progress.done / progress.total) * 100)
            : 0;

    const modalContent = (
        <div
            // z-index altísimo para superar cualquier control de Leaflet (zoom, etc)
            className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={(e) => {
                // Cerrar si toca el fondo (solo cuando no está descargando)
                if (e.target === e.currentTarget && !isDownloading) {
                    onClose();
                }
            }}
        >
            <div
                className={[
                    // Bottom sheet en móvil, card centrado en desktop
                    'relative flex w-full flex-col overflow-hidden',
                    'max-h-[90vh] sm:max-h-[85vh] sm:max-w-md',
                    'rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-2xl',
                    // Safe area para iPhone con notch
                    'pb-[max(1rem,env(safe-area-inset-bottom))]',
                ].join(' ')}
            >
                {/* Handle visual de bottom sheet (solo móvil) */}
                <div className="flex justify-center pt-2 sm:hidden">
                    <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between gap-2 border-b border-border/50 px-4 py-3 sm:px-6 sm:py-4">
                    <h3 className="text-base font-bold sm:text-lg">
                        {result ? 'Descarga completada' : 'Mapa offline'}
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={isDownloading}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-50"
                        aria-label="Cerrar"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Contenido scrolleable */}
                <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                    {!isDownloading && !result && (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Descarga los tiles del mapa de la zona visible para usarlos sin
                                internet. Selecciona los niveles de zoom:
                            </p>

                            <div className="mt-4 space-y-2">
                                <ZoomOption
                                    level={12}
                                    label="Vista de ciudad (rápido)"
                                    checked={selectedZooms.includes(12)}
                                    onToggle={() => toggleZoom(12)}
                                />
                                <ZoomOption
                                    level={13}
                                    label="Calles principales"
                                    checked={selectedZooms.includes(13)}
                                    onToggle={() => toggleZoom(13)}
                                />
                                <ZoomOption
                                    level={14}
                                    label="Calles y barrios (recomendado)"
                                    checked={selectedZooms.includes(14)}
                                    onToggle={() => toggleZoom(14)}
                                />
                                <ZoomOption
                                    level={15}
                                    label="Detalle de calles"
                                    checked={selectedZooms.includes(15)}
                                    onToggle={() => toggleZoom(15)}
                                />
                                <ZoomOption
                                    level={16}
                                    label="Máximo detalle (lento)"
                                    checked={selectedZooms.includes(16)}
                                    onToggle={() => toggleZoom(16)}
                                />
                            </div>

                            <div className="mt-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                                💡 <strong>Recomendado:</strong> elige 13, 14 y 15. Cubre la
                                mayoría de usos sin gastar demasiado espacio.
                            </div>
                        </>
                    )}

                    {isDownloading && (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Descargando tiles de la zona visible...
                            </p>

                            <div className="mt-4">
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span>
                                        {progress.done} / {progress.total}
                                    </span>
                                    <span className="font-semibold">{percentage}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-300"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>

                            <p className="mt-4 text-xs text-muted-foreground">
                                No cierres esta ventana. Puede tardar varios minutos.
                            </p>
                        </>
                    )}

                    {result && (
                        <div className="flex flex-col items-center py-4">
                            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
                                <Check className="h-7 w-7 text-success" />
                            </div>
                            <p className="font-semibold">¡Descarga completada!</p>
                            <p className="mt-1 text-center text-sm text-muted-foreground">
                                {result.success} tiles guardados
                                {result.failed > 0 && ` · ${result.failed} fallidos`}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer con botones */}
                {!isDownloading && (
                    <div className="border-t border-border/50 px-4 py-3 sm:px-6 sm:py-4">
                        {!result ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={onClose}
                                    className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => onDownload(selectedZooms)}
                                    disabled={selectedZooms.length === 0}
                                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-orange-500 to-yellow-500 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                                >
                                    <Download className="h-4 w-4" />
                                    Descargar
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={onClose}
                                className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-yellow-500 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                            >
                                Listo
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

function ZoomOption({
    level,
    label,
    checked,
    onToggle,
}: {
    level: number;
    label: string;
    checked: boolean;
    onToggle: () => void;
}) {
    return (
        <label
            className={[
                'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all',
                checked
                    ? 'border-primary bg-primary/5'
                    : 'border-border/50 hover:border-border',
            ].join(' ')}
        >
            <input
                type="checkbox"
                checked={checked}
                onChange={onToggle}
                className="h-4 w-4 shrink-0 accent-orange-500"
            />
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                        z{level}
                    </span>
                    <span className="text-sm font-medium">{label}</span>
                </div>
            </div>
        </label>
    );
}

// ===== FUNCIÓN DE DESCARGA =====

async function downloadRegion(
    bounds: L.LatLngBounds,
    zoomLevels: number[],
    onProgress: (done: number, total: number) => void,
    signal?: AbortSignal
): Promise<{ success: number; failed: number }> {
    const tiles: Array<{ z: number; x: number; y: number }> = [];

    for (const z of zoomLevels) {
        const nw = latLngToTile(
            bounds.getNorthWest().lat,
            bounds.getNorthWest().lng,
            z
        );
        const se = latLngToTile(
            bounds.getSouthEast().lat,
            bounds.getSouthEast().lng,
            z
        );

        for (let x = nw.x; x <= se.x; x++) {
            for (let y = nw.y; y <= se.y; y++) {
                tiles.push({ z, x, y });
            }
        }
    }

    onProgress(0, tiles.length);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < tiles.length; i++) {
        if (signal?.aborted) break;

        const t = tiles[i];
        const key = tileKey(t.x, t.y, t.z);

        try {
            const cached = await localforage.getItem(key);
            if (cached) {
                success++;
            } else {
                const url = buildTileUrl(t.x, t.y, t.z);
                const response = await fetch(url);
                if (response.ok) {
                    const blob = await response.blob();
                    await localforage.setItem(key, blob);
                    success++;
                } else {
                    failed++;
                }
            }
        } catch (e) {
            failed++;
        }

        onProgress(i + 1, tiles.length);
    }

    return { success, failed };
}

// ===== COMPONENTE PRINCIPAL =====

export function RealMap({
    solineras,
    selectedId,
    onSelect,
    onReserve,
    interactive = false,
    onLocationSelect,
    initialCenter,
    initialZoom,
    markerPosition,
    showDownloadControl = false,
}: RealMapProps) {
    const [mounted, setMounted] = React.useState(false);
    const [selectedCenter, setSelectedCenter] = React.useState<
        [number, number] | null
    >(null);
    const [locating, setLocating] = React.useState(false);
    const [downloadOpen, setDownloadOpen] = React.useState(false);
    const [isDownloading, setIsDownloading] = React.useState(false);
    const [progress, setProgress] = React.useState({ done: 0, total: 0 });
    const [downloadResult, setDownloadResult] = React.useState<{
        success: number;
        failed: number;
    } | null>(null);

    const mapRef = React.useRef<L.Map | null>(null);
    const userMarkerRef = React.useRef<L.Marker | null>(null);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const handleMapReady = React.useCallback((map: L.Map) => {
        mapRef.current = map;
    }, []);

    const handleLocate = React.useCallback(() => {
        const map = mapRef.current;
        if (!map) return;

        if (!navigator.geolocation) {
            alert('Tu navegador no soporta geolocalización');
            return;
        }

        setLocating(true);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                map.setView([latitude, longitude], 16, { animate: true });

                if (userMarkerRef.current) userMarkerRef.current.remove();

                const marker = L.marker([latitude, longitude], { icon: userIcon })
                    .addTo(map)
                    .bindPopup('📍 Estás aquí')
                    .openPopup();

                userMarkerRef.current = marker;
                setLocating(false);
            },
            (err) => {
                console.error('Geolocation error:', err);
                alert(
                    'No se pudo obtener tu ubicación. Verifica que tengas el GPS activado.'
                );
                setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }, []);

    const handleStartDownload = async (zoomLevels: number[]) => {
        const map = mapRef.current;
        if (!map) return;

        setIsDownloading(true);
        setDownloadResult(null);
        setProgress({ done: 0, total: 0 });

        try {
            const bounds = map.getBounds();
            const result = await downloadRegion(bounds, zoomLevels, (done, total) => {
                setProgress({ done, total });
            });
            setDownloadResult(result);
        } catch (e) {
            console.error(e);
            setDownloadResult({ success: 0, failed: 0 });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleCloseDownload = () => {
        if (isDownloading) return;
        setDownloadOpen(false);
        setDownloadResult(null);
        setProgress({ done: 0, total: 0 });
    };

    if (!mounted) {
        return (
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-card/30">
                <div className="animate-pulse text-sm text-muted-foreground">
                    Cargando mapa...
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full overflow-hidden rounded-2xl">
            <style jsx global>{`
        @keyframes pulseMarker {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 0; }
        }
        .leaflet-container {
          background: #0a192f;
          font-family: inherit;
          z-index: 0;
        }
        .leaflet-popup-content-wrapper {
          background: hsl(var(--popover));
          color: hsl(var(--foreground));
          border: 1px solid hsl(var(--border));
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }
        .leaflet-popup-tip {
          background: hsl(var(--popover));
        }
        .leaflet-popup-content {
          margin: 12px;
          font-size: 13px;
        }
        .leaflet-control-zoom a {
          background: hsl(var(--card)) !important;
          color: hsl(var(--foreground)) !important;
          border-color: hsl(var(--border)) !important;
        }
        .leaflet-control-attribution {
          background: rgba(10, 25, 47, 0.8) !important;
          color: #888 !important;
          font-size: 10px !important;
          padding: 2px 6px !important;
        }
        .leaflet-control-attribution a {
          color: #aaa !important;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

            <MapContainer
                center={initialCenter || DEFAULT_CENTER}
                zoom={initialZoom || DEFAULT_ZOOM}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                zoomControl={true}
            >
                <MapInstanceCatcher onReady={handleMapReady} />
                <TileLayerSetup />
                <MapRecenter center={selectedCenter} />

                {interactive && onLocationSelect && (
                    <MapClickHandler onClick={onLocationSelect} />
                )}

                {markerPosition && (
                    <Marker position={markerPosition} icon={locationIcon} />
                )}

                {!interactive &&
                    solineras.map((s) => {
                        const isSelected = selectedId === s.id;
                        return (
                            <Marker
                                key={s.id}
                                position={[s.lat, s.lng]}
                                icon={createSolineraIcon(isSelected, s.points > 0)}
                                eventHandlers={{
                                    click: () => {
                                        onSelect(s);
                                        setSelectedCenter([s.lat, s.lng]);
                                    },
                                }}
                            >
                                <Popup>
                                    <div className="min-w-[180px]">
                                        <p className="font-semibold text-sm">{s.name}</p>
                                        <p className="mt-1 text-xs opacity-70">{s.address}</p>
                                        <div className="mt-2 flex items-center justify-between text-xs">
                                            <span className="font-medium text-orange-500">
                                                {s.pricePerKwh} CUP/kWh
                                            </span>
                                            <span className="opacity-70">{s.points} puntos</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onReserve(s);
                                            }}
                                            style={{
                                                marginTop: '10px',
                                                width: '100%',
                                                padding: '6px 12px',
                                                background:
                                                    'linear-gradient(135deg, #FF8C00, #FFD700)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Reservar
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
            </MapContainer>

            {/* ===== BOTONES OVERLAY ===== */}
            {!interactive && (
                <div className="absolute bottom-6 right-4 z-[1000] flex flex-col gap-2">
                    {showDownloadControl && (
                        <button
                            onClick={() => setDownloadOpen(true)}
                            disabled={isDownloading}
                            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-white text-orange-500 shadow-lg transition-transform hover:scale-110 disabled:opacity-70 sm:h-11 sm:w-11"
                            title="Descargar mapa offline"
                            aria-label="Descargar mapa offline"
                        >
                            <Download className="h-5 w-5" />
                        </button>
                    )}

                    <button
                        onClick={handleLocate}
                        disabled={locating}
                        className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-white text-blue-500 shadow-lg transition-transform hover:scale-110 disabled:opacity-70 sm:h-11 sm:w-11"
                        title="Mi ubicación"
                        aria-label="Mi ubicación"
                    >
                        {locating ? (
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                        ) : (
                            <Crosshair className="h-5 w-5" />
                        )}
                    </button>
                </div>
            )}

            {/* ===== OVERLAY INFO ===== */}
            {!interactive && (
                <div className="pointer-events-none absolute bottom-4 left-3 z-[1000] flex items-center gap-2 rounded-lg border border-border/50 bg-card/80 px-2.5 py-1.5 backdrop-blur-xl sm:left-4 sm:px-3 sm:py-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
                    <span className="text-[11px] font-medium sm:text-xs">
                        {solineras.length} solinera{solineras.length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {/* ===== INSTRUCCIÓN MODO ONBOARDING ===== */}
            {interactive && (
                <div className="pointer-events-none absolute bottom-4 left-1/2 z-[1000] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg border border-primary/40 bg-card/95 px-3 py-2 backdrop-blur-xl sm:w-auto sm:px-4">
                    <p className="text-center text-[11px] font-medium sm:text-xs">
                        📍 Toca el mapa para marcar la ubicación
                    </p>
                </div>
            )}

            {/* ===== MODAL DE DESCARGA (portal a body) ===== */}
            <DownloadModal
                open={downloadOpen}
                onClose={handleCloseDownload}
                onDownload={handleStartDownload}
                progress={progress}
                isDownloading={isDownloading}
                result={downloadResult}
            />
        </div>
    );
}