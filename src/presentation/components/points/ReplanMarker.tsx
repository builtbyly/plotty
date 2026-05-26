import React, { useMemo } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { ReplanEvent } from "../../../domain/value-objects/ReplanEvent";
import { Coordinates } from "../../../domain/value-objects/Coordinates";

const COLOR_BEHAVIORAL = "#d4ac0d";
const COLOR_INTERVAL = "#5b8db8";
const COLOR_FAILED = "#c0392b";

function markerColor(event: ReplanEvent): string {
  if (event.outcome === "failed") return COLOR_FAILED;
  return event.category === "behavioral" ? COLOR_BEHAVIORAL : COLOR_INTERVAL;
}

function createIcon(event: ReplanEvent): L.DivIcon {
  const color = markerColor(event);

  if (event.outcome === "failed") {
    return L.divIcon({
      className: "",
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      html: `<div style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5));line-height:0;"><svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg"><polygon points="13,1 25,13 13,25 1,13" fill="${color}" stroke="white" stroke-width="2.5" stroke-linejoin="round"/><text x="13" y="18.5" text-anchor="middle" fill="white" font-size="14" font-family="system-ui,-apple-system,sans-serif" font-weight="700">!</text></svg></div>`,
    });
  }

  return L.divIcon({
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<div style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35));line-height:0;"><svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="10" fill="${color}" stroke="white" stroke-width="2"/><text x="12" y="15.5" text-anchor="middle" fill="white" font-size="14" font-family="system-ui,-apple-system,sans-serif" font-weight="700">↻</text></svg></div>`,
  });
}

function formatTimestamp(ms: number, timezoneOffsetMinutes: number | null): string {
  const offsetMs = (timezoneOffsetMinutes ?? 0) * 60 * 1000;
  const d = new Date(ms + offsetMs);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  const ms3 = String(d.getUTCMilliseconds()).padStart(3, "0");
  const time = `${hh}:${mm}:${ss}.${ms3}`;
  if (timezoneOffsetMinutes === null) return time;
  const sign = timezoneOffsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(timezoneOffsetMinutes);
  const tzHH = String(Math.floor(abs / 60)).padStart(2, "0");
  const tzMM = String(abs % 60).padStart(2, "0");
  return `${time} ${sign}${tzHH}${tzMM}`;
}

interface ReplanMarkerProps {
  event: ReplanEvent;
  position: Coordinates;
}

export const ReplanMarker: React.FC<ReplanMarkerProps> = ({ event, position }) => {
  const icon = useMemo(() => createIcon(event), [event.outcome, event.category]);
  const color = markerColor(event);
  const label = event.outcome === "failed" ? "Replan Failed" : "Replan Triggered";
  const categoryLabel = event.category === "behavioral" ? "behavioral" : "interval";

  return (
    <Marker position={[position.latitude, position.longitude]} icon={icon}>
      <Popup>
        <div style={styles.root}>
          <div style={{ ...styles.header, borderTopColor: color }}>
            <div style={styles.labelGroup}>
              <span style={{ ...styles.label, color }}>{label}</span>
              <span style={styles.sublabel}>{categoryLabel} · last known location</span>
            </div>
            {event.timestamp !== null && (
              <span style={styles.timestamp}>
                {formatTimestamp(event.timestamp, event.timezoneOffsetMinutes)}
              </span>
            )}
          </div>
          <div style={styles.body}>
            <span style={styles.description}>{event.reason}</span>
            {event.errorMessage !== null && (
              <span style={{ ...styles.description, ...styles.error }}>
                {event.errorMessage}
              </span>
            )}
          </div>
          <div style={styles.footer}>
            <span style={styles.meta}>line {event.lineNumber}</span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  root: {
    display: "flex",
    flexDirection: "column",
    minWidth: "220px",
    maxWidth: "300px",
    fontSize: "0.78rem",
    fontFamily: "'Roboto', sans-serif",
  },
  header: {
    padding: "10px 12px 8px",
    borderTop: "3px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },
  labelGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  label: {
    fontWeight: 700,
    fontSize: "0.85rem",
    lineHeight: 1.2,
  },
  sublabel: {
    fontSize: "0.62rem",
    color: "rgba(0,0,0,0.35)",
    fontStyle: "italic",
    letterSpacing: "0.01em",
  },
  timestamp: {
    fontFamily: "monospace",
    fontSize: "0.68rem",
    color: "rgba(0,0,0,0.4)",
    letterSpacing: "0.01em",
    flexShrink: 0,
  },
  body: {
    padding: "6px 12px",
    borderTop: "1px solid rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  description: {
    fontFamily: "monospace",
    fontSize: "0.72rem",
    color: "rgba(0,0,0,0.7)",
    wordBreak: "break-word",
  },
  error: {
    color: COLOR_FAILED,
  },
  footer: {
    padding: "4px 12px 6px",
    borderTop: "1px solid rgba(0,0,0,0.06)",
  },
  meta: {
    fontSize: "0.65rem",
    color: "rgba(0,0,0,0.3)",
    fontFamily: "monospace",
    letterSpacing: "0.02em",
  },
};
