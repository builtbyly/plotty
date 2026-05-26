import React from "react";
import { useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LayerPanel } from "./overlays/LayerPanel";
import { GotoDialog } from "./overlays/GotoDialog";
import { filterLayers } from "../../domain/utils/utils";
import { createLayer } from "../../domain/entities/Layer";
import { FocusProvider } from "../contexts/FocusContext";
import { GeoPath } from "../../domain/entities/GeoPath";
import { TtpPath } from "../../domain/entities/TtpPath";
import { Route } from "../../domain/entities/Route";
import { LogcatPath } from "../../domain/entities/LogcatPath";
import { useMapUtils } from "../hooks/useMapUtils";
import { RulerPanel } from "./overlays/RulerPanel";
import { usePathImport } from "../hooks/usePathImport";
import { AnyPath } from "../../domain/entities/Path";
import { Color } from "../../domain/value-objects/Color";
import { useColors } from "../hooks/useLayerColors";
import { useLayerStore } from "../hooks/useLayerStore";
import { useGistLoad } from "../hooks/useGistLoad";
import { onlyInDevelopment, useRenderTime } from "../hooks/useRenderTime";
import { Z_INDEX } from "../constants/zIndex";
import { Coordinates } from "../../domain/value-objects/Coordinates";
import { GeoPathLayers, TtpPathLayers } from "./LayersRenderer";
import { LogcatPathLayer } from "./LogcatPathLayer";
import { RouteLayer } from "./RouteLayer";
import { copyToClipboard } from "../utils/clipboard";
import { TileProvider } from "../providers/TileProvider";

interface MapLayersProps {
  onTileProviderChanged: (tileProvider: TileProvider) => void;
}

export const MapLayers = ({ onTileProviderChanged }: MapLayersProps) => {
  useRenderTime("MapLayers", onlyInDevelopment);

  const map = useMap();
  const store = useLayerStore();
  const { flyToBoundingBox, flyToCoordinates } = useMapUtils();
  useGistLoad(store.clearAll, store.addLayers, (layers) => {
    const allPoints = layers.flatMap((l) => l.path.points);
    flyToBoundingBox(allPoints);
  });
  const { getNextColor } = useColors();

  const { importing, isDraggingOver } = usePathImport({
    target: map.getContainer(),
    onPathsImported: (paths: AnyPath[]) => {
      store.addLayers(
        paths.map((path) =>
          createLayer(path.getName(), Color.fromHex(getNextColor()), path)
        )
      );
    },
  });

  const routeLayers = filterLayers(store.layers, Route);
  const geoPathLayers = filterLayers(store.layers, GeoPath);
  const ttpPathLayers = filterLayers(store.layers, TtpPath);
  const logPathLayers = filterLayers(store.layers, LogcatPath);

  const [replanToggles, setReplanToggles] = React.useState<Record<string, { behavioral: boolean; interval: boolean }>>({});
  const getReplanToggle = (id: string) => replanToggles[id] ?? { behavioral: true, interval: true };
  const handleReplanToggle = (id: string, category: "behavioral" | "interval", value: boolean) =>
    setReplanToggles((prev) => ({ ...prev, [id]: { ...getReplanToggle(id), [category]: value } }));

  const [instructionToggles, setInstructionToggles] = React.useState<Record<string, boolean>>({});
  const getInstructionToggle = (id: string) => instructionToggles[id] ?? true;
  const handleInstructionToggle = (id: string, value: boolean) =>
    setInstructionToggles((prev) => ({ ...prev, [id]: value }));

  React.useEffect(() => {
    const handleRightClick = (e: L.LeafletMouseEvent) => {
      const latlng = map.mouseEventToLatLng(e.originalEvent);
      const coordinates = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
      void copyToClipboard(
        coordinates,
        "Coordinates copied to clipboard.",
        "Failed to copy coordinates."
      );
    };

    map.on("contextmenu", handleRightClick);

    return () => {
      map.off("contextmenu", handleRightClick);
    };
  }, [map]);

  return (
    <FocusProvider>
      {store.layers.length === 0 && !isDraggingOver && (
        <div style={styles.importHint}>Drop a file or paste to import</div>
      )}
      {isDraggingOver && (
        <div style={styles.dropZone}>
          <div style={styles.dropZoneLabel}>Drop to import</div>
        </div>
      )}
      {importing && (
        <div style={styles.overlay}>
          <div style={styles.spinner}>Importing...</div>
        </div>
      )}
      <LayerPanel
        style={styles.layerPanel}
        layers={store.layers}
        onLayerClicked={(layer) => flyToBoundingBox([...layer.path.points])}
        onVisibilityChange={(layer) => store.toggleVisibility(layer.id)}
        onNameChange={(layer, newName) => store.rename(layer.id, newName)}
        onDelete={(layer) => store.remove(layer.id)}
        onClearAll={store.clearAll}
        onColorChange={(layer, hex) => store.recolor(layer.id, hex)}
        onReorder={store.reorder}
        onTileProviderChanged={onTileProviderChanged}
        replanToggles={replanToggles}
        onReplanToggle={handleReplanToggle}
        instructionToggles={instructionToggles}
        onInstructionToggle={handleInstructionToggle}
      />
      <GotoDialog
        onCoordinatesChange={(coordinates: Coordinates) => {
          flyToCoordinates(coordinates, map.getZoom());
        }}
      />
      <RulerPanel />
      {routeLayers.filter((l) => l.visible).map((l, i) => (
        <RouteLayer
          key={`${i}-${l.id}`}
          layer={l}
          showInstructions={getInstructionToggle(l.id)}
        />
      ))}
      <GeoPathLayers layers={geoPathLayers} />
      <TtpPathLayers layers={ttpPathLayers} />
      {logPathLayers.filter((l) => l.visible).map((l, i) => {
        const t = getReplanToggle(l.id);
        return (
          <LogcatPathLayer
            key={`${i}-${l.id}`}
            layer={l}
            showBehavioral={t.behavioral}
            showInterval={t.interval}
          />
        );
      })}
    </FocusProvider>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  layerPanel: {
    position: "fixed",
    top: "10px",
    right: "10px",
    width: "clamp(280px, 24vw, 360px)",
    paddingTop: "10px",
    maxHeight: "calc(100vh - 20px)",
    backgroundColor: "hsla(0, 0%, 100%, 0.8)",
    fontFamily: "'Roboto', sans-serif",
    borderRadius: "12px",
    zIndex: Z_INDEX.LAYER_PANEL,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 10px 24px rgba(0, 0, 0, 0.12)",
    border: "1px solid rgba(0,0,0,0.06)",
    backdropFilter: "blur(14px)",
  },
  importHint: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "0.82rem",
    fontWeight: 500,
    color: "rgba(0,0,0,0.28)",
    fontFamily: "'Roboto', sans-serif",
    letterSpacing: "0.03em",
    pointerEvents: "none",
    userSelect: "none",
    whiteSpace: "nowrap",
  },
  dropZone: {
    position: "fixed",
    inset: 0,
    zIndex: Z_INDEX.OVERLAY,
    margin: "12px",
    borderRadius: "12px",
    border: "2px dashed rgba(25, 136, 207, 0.55)",
    backgroundColor: "rgba(25, 136, 207, 0.07)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  dropZoneLabel: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "rgba(25, 136, 207, 0.85)",
    fontFamily: "'Roboto', sans-serif",
    letterSpacing: "0.02em",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: Z_INDEX.OVERLAY,
    margin: "12px",
    borderRadius: "12px",
    backgroundColor: "rgba(25, 136, 207, 0.10)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  spinner: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "rgba(25, 136, 207, 0.85)",
    fontFamily: "'Roboto', sans-serif",
    letterSpacing: "0.02em",
  },
};
