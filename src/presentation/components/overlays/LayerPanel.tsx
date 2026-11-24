import React from "react";
import { tomtomSecondaryColor } from "../../../shared/colors";
import { AnyPath } from "../../../domain/entities/Path";
import type { Layer, LayerFeature } from "../../../domain/entities/Layer";
import L from "leaflet";
import "./LayerPanel.css";
import LayerItem from "./LayerItem";
import { LogcatPath } from "../../../domain/entities/LogcatPath";
import { Route } from "../../../domain/entities/Route";
import { Checkbox, CircularProgress, FormControlLabel, IconButton, Tooltip } from "@mui/material";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import ShareIcon from "@mui/icons-material/Share";
import CheckIcon from "@mui/icons-material/Check";
import KeyIcon from "@mui/icons-material/Key";
import { useGistShare } from "../../hooks/useGistShare";
import PasswordInput from "../../providers/PasswordInput";
import { TileProviderSelector } from "./TileProviderSelector";
import { TileProvider } from "../../providers/TileProvider";

interface LayerPanelProps<T extends AnyPath> {
  style?: React.CSSProperties;
  layers: Layer<T>[];
  onLayerClicked: (layer: Layer<T>) => void;
  onVisibilityChange: (layer: Layer<T>) => void;
  onNameChange: (layer: Layer<T>, newName: string) => void;
  onDelete: (layer: Layer<T>) => void;
  onClearAll: () => void;
  onColorChange: (layer: Layer<T>, hex: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onTileProviderChanged: (tileProvider: TileProvider) => void;
  onFeatureVisibilityChange: (
    layerId: string,
    feature: LayerFeature,
    visible: boolean,
  ) => void;
}

export const LayerPanel = <T extends AnyPath>({
  style,
  layers,
  onLayerClicked,
  onVisibilityChange,
  onNameChange,
  onDelete,
  onClearAll,
  onColorChange,
  onReorder,
  onTileProviderChanged,
  onFeatureVisibilityChange,
}: LayerPanelProps<T>) => {
  const [isScrollable, setIsScrollable] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const scrollListRef = React.useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [overIndex, setOverIndex] = React.useState<number | null>(null);
  const { share, sharing, shared } = useGistShare(layers as Layer<AnyPath>[]);
  const [showPatInput, setShowPatInput] = React.useState(false);
  const [pat, setPat] = React.useState(() => localStorage.getItem("github_pat") ?? "");

  React.useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    L.DomEvent.disableScrollPropagation(panel);
    L.DomEvent.disableClickPropagation(panel);
  }, []);

  React.useEffect(() => {
    const el = scrollListRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setIsScrollable(el.scrollHeight > el.clientHeight);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const basemapSection = (
    <section aria-labelledby="basemap-label" style={styles.basemapSection}>
      <div id="basemap-label" style={styles.basemapKicker}>Basemap</div>
      <TileProviderSelector onTileProviderChanged={onTileProviderChanged} embedded />
    </section>
  );

  return (
    <div ref={panelRef} style={style}>
      {layers.length === 0 ? (
        <div style={styles.emptyState}>
          <FileUploadOutlinedIcon style={styles.emptyIcon} />
          <div style={styles.emptyBadge}>Step 1</div>
          <p style={styles.emptyTitle}>Import something to start exploring.</p>
          <div style={styles.emptySteps}>
            <div>Drop a file directly on the map.</div>
            <div>Or focus the map and paste coordinates, GeoJSON, route JSON, TTP, or logcat.</div>
            <div>Your imported results will appear here as layers.</div>
          </div>
        </div>
      ) : (
        <>
          <div style={styles.header}>
            <div>
              <h3 style={styles.title}>Layers</h3>
              <p style={styles.subtitle}>Imported paths and routes</p>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Tooltip title={shared ? "Link copied!" : "Share session"} placement="left">
                <span>
                  <IconButton
                    aria-label="share layers"
                    size="small"
                    disabled={layers.length === 0 || sharing}
                    onClick={() => { void share(); }}
                    sx={shared ? { color: "green" } : undefined}
                  >
                    {sharing ? <CircularProgress size={16} /> : shared ? <CheckIcon fontSize="small" /> : <ShareIcon fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Configure GitHub PAT" placement="left">
                <IconButton
                  aria-label="configure GitHub PAT"
                  size="small"
                  onClick={() => setShowPatInput((v) => !v)}
                >
                  <KeyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear all layers" placement="left">
                <IconButton
                  aria-label="clear all layers"
                  size="small"
                  onClick={onClearAll}
                >
                  <DeleteSweepIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
          </div>
          {showPatInput && (
            <div style={styles.patSection}>
              <PasswordInput
                label="GitHub PAT"
                initialValue={pat}
                onValueChange={(v) => {
                  setPat(v);
                  localStorage.setItem("github_pat", v);
                }}
                compact
              />
            </div>
          )}
          <div
            ref={scrollListRef}
            role="list"
            style={{
              ...styles.layerList,
              boxShadow: isScrollable
                ? "inset 0 10px 15px -10px rgba(0, 0, 0, 0.2), inset 0 -10px 15px -10px rgba(0, 0, 0, 0.2)"
                : "none",
            }}
          >
            {layers.map((layer, i) => (
              <div
                key={layer.id}
                role="listitem"
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => { e.preventDefault(); setOverIndex(i); }}
                onDrop={() => {
                  if (dragIndex !== null && dragIndex !== i) onReorder(dragIndex, i);
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                style={{
                  width: "100%",
                  opacity: dragIndex === i ? 0.4 : 1,
                  userSelect: dragIndex !== null ? "none" : undefined,
                  borderTop: overIndex === i && dragIndex !== i
                    ? `2px solid ${tomtomSecondaryColor}`
                    : "2px solid transparent",
                }}
              >
                <LayerItem
                  checked={layer.visible}
                  color={layer.color.toHex().slice(0, 7)}
                  pointCount={layer.path.points.length}
                  onVisibilityChange={() => onVisibilityChange(layer)}
                  name={layer.name}
                  onNameChange={(newName) => onNameChange(layer, newName)}
                  onClicked={onLayerClicked.bind(null, layer)}
                  onDelete={() => onDelete(layer)}
                  onColorChange={(hex) => onColorChange(layer, hex)}
                  onMoveUp={i > 0 ? () => onReorder(i, i - 1) : undefined}
                  onMoveDown={i < layers.length - 1 ? () => onReorder(i, i + 1) : undefined}
                  showColorPicker={!(layer.path instanceof LogcatPath)}
                />
                {layer.path instanceof Route && (
                  <div style={styles.routeSummary}>
                    {(() => {
                      const r = layer.path as unknown as Route;
                      const dist = (r.summary.lengthInMeters / 1000).toFixed(1);
                      const time = `${Math.floor(r.summary.travelTimeInSeconds / 60)}m ${r.summary.travelTimeInSeconds % 60}s`;
                      const delay = r.summary.trafficDelayInSeconds > 0 ? ` · delay ${r.summary.trafficDelayInSeconds}s` : "";
                      return <span>{dist} km · {time}{delay && <span style={styles.routeSummaryDelay}>{delay}</span>}</span>;
                    })()}
                  </div>
                )}
                {layer.path instanceof LogcatPath && layer.path.replanEvents.length > 0 && (
                  <div style={styles.replanToggles}>
                    <span style={styles.replanKicker}>Replans</span>
                    {(["behavioral", "interval"] as const).map((cat) => {
                      const count = (layer.path as unknown as LogcatPath).replanEvents.filter((e) => e.category === cat).length;
                      if (count === 0) return null;
                      const feature = cat === "behavioral" ? "behavioralReplans" : "intervalReplans";
                      return (
                        <FormControlLabel
                          key={cat}
                          sx={replanLabelSx}
                          label={`${cat} (${count})`}
                          control={
                            <Checkbox
                              size="small"
                              sx={replanCheckboxSx}
                              checked={layer.featureVisibility[feature]}
                              onChange={(e) => onFeatureVisibilityChange(
                                layer.id,
                                feature,
                                e.target.checked,
                              )}
                            />
                          }
                        />
                      );
                    })}
                  </div>
                )}
                {layer.path instanceof Route && layer.path.instructions.length > 0 && (
                  <div style={styles.replanToggles}>
                    <span style={styles.replanKicker}>Instructions</span>
                    <FormControlLabel
                      sx={replanLabelSx}
                      label={`show (${(layer.path as unknown as Route).instructions.length})`}
                      control={
                        <Checkbox
                          size="small"
                          sx={replanCheckboxSx}
                          checked={layer.featureVisibility.instructions}
                          onChange={(e) => onFeatureVisibilityChange(layer.id, "instructions", e.target.checked)}
                        />
                      }
                    />
                  </div>
                )}
                {layer.path instanceof Route && layer.path.trafficSections.length > 0 && (
                  <div style={styles.replanToggles}>
                    <span style={styles.replanKicker}>Traffic</span>
                    <FormControlLabel
                      sx={replanLabelSx}
                      label={`show (${(layer.path as unknown as Route).trafficSections.length})`}
                      control={
                        <Checkbox
                          size="small"
                          sx={replanCheckboxSx}
                          checked={layer.featureVisibility.trafficSections}
                          onChange={(e) => onFeatureVisibilityChange(layer.id, "trafficSections", e.target.checked)}
                        />
                      }
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      {basemapSection}
    </div>
  );
};

const replanLabelSx = {
  margin: 0,
  "& .MuiFormControlLabel-label": {
    fontSize: "0.67rem",
    color: "rgba(0,0,0,0.42)",
    fontFamily: "'Roboto', sans-serif",
    userSelect: "none",
  },
};

const replanCheckboxSx = {
  padding: "2px 6px 2px 0",
  color: "rgba(0,0,0,0.28)",
  "&.Mui-checked": { color: "rgba(0,0,0,0.42)" },
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 8px 8px 10px",
    borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
    width: "100%",
  },
  title: {
    fontSize: "0.98rem",
    color: `${tomtomSecondaryColor}`,
    userSelect: "none",
    fontWeight: 700,
    margin: 0,
  },
  subtitle: {
    margin: "1px 0 0",
    fontSize: "0.66rem",
    color: "rgba(0,0,0,0.45)",
    lineHeight: 1.2,
    maxWidth: "190px",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px 16px",
    gap: "8px",
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: "2rem",
    color: "rgba(0,0,0,0.2)",
  },
  emptyText: {
    margin: 0,
    fontSize: "0.78rem",
    color: "rgba(0,0,0,0.4)",
    lineHeight: 1.4,
    maxWidth: "170px",
  },
  emptyBadge: {
    fontSize: "0.64rem",
    fontWeight: 800,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: `${tomtomSecondaryColor}`,
  },
  emptyTitle: {
    margin: 0,
    fontSize: "0.88rem",
    fontWeight: 700,
    color: "rgba(0,0,0,0.72)",
    maxWidth: "240px",
    lineHeight: 1.35,
  },
  emptySteps: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontSize: "0.76rem",
    color: "rgba(0,0,0,0.48)",
    lineHeight: 1.45,
    maxWidth: "248px",
  },
  basemapSection: {
    width: "100%",
    padding: "8px 8px 4px",
    borderTop: "1px solid rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  basemapKicker: {
    fontSize: "0.62rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "rgba(0,0,0,0.42)",
  },
  routeSummary: {
    padding: "2px 10px 4px 14px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    borderLeft: "2px solid rgba(0,0,0,0.07)",
    marginLeft: "12px",
    fontSize: "0.67rem",
    color: "rgba(0,0,0,0.42)",
    fontFamily: "'Roboto', sans-serif",
  },
  routeSummaryDelay: {
    fontSize: "0.65rem",
    color: "rgba(180,60,0,0.65)",
  },
  replanToggles: {
    display: "flex",
    flexDirection: "row" as const,
    alignItems: "center",
    padding: "4px 10px 5px 14px",
    gap: "2px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    borderLeft: "2px solid rgba(0,0,0,0.07)",
    marginLeft: "12px",
  },
  replanKicker: {
    fontSize: "0.58rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "rgba(0,0,0,0.28)",
    fontFamily: "'Roboto', sans-serif",
    marginRight: "6px",
    flexShrink: 0,
    minWidth: "80px",
  },
  patSection: {
    width: "100%",
    padding: "6px 10px 6px 12px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    boxSizing: "border-box" as const,
  },
  layerList: {
    display: "flex",
    flexDirection: "column",
    borderRadius: "0 0 12px 12px",
    alignItems: "flex-start",
    justifyContent: "start",
    overflowY: "auto",
    maxHeight: "clamp(160px, calc(100vh - 280px), 420px)",
    scrollbarWidth: "thin",
    scrollbarColor: `${tomtomSecondaryColor}CC transparent`,
    width: "100%",
  },
};
