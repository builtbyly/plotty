import L from "leaflet";

export function createOriginIcon(color: string, highlighted: boolean): L.DivIcon {
  const ring = highlighted
    ? `<circle cx="16" cy="16" r="14" fill="none" stroke="white" stroke-width="2.5" stroke-dasharray="4 3" opacity="0.85"/>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="15" fill="${color}"/>
  ${ring}
  <polygon points="12,10 12,22 23,16" fill="white"/>
</svg>`;
  return L.divIcon({
    html: `<div style="filter:drop-shadow(0 2px 5px rgba(0,0,0,0.45))">${svg}</div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}

export function createDestinationIcon(color: string, highlighted: boolean): L.DivIcon {
  const ring = highlighted
    ? `<path d="M14,2 C7,2 2,7 2,14 C2,22 14,34 14,34 C14,34 26,22 26,14 C26,7 21,2 14,2Z" fill="none" stroke="white" stroke-width="3" stroke-dasharray="4 3" opacity="0.8"/>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
  <path d="M14,2 C7,2 2,7 2,14 C2,22 14,34 14,34 C14,34 26,22 26,14 C26,7 21,2 14,2Z" fill="${color}"/>
  ${ring}
  <polyline points="8,13 12,17 20,9" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
  return L.divIcon({
    html: `<div style="filter:drop-shadow(0 2px 5px rgba(0,0,0,0.45))">${svg}</div>`,
    className: "",
    iconSize: [28, 36],
    iconAnchor: [14, 35],
    popupAnchor: [0, -36],
  });
}

export function createStopIcon(color: string, label: string, highlighted: boolean): L.DivIcon {
  const ring = highlighted
    ? `<circle cx="13" cy="13" r="11.5" fill="none" stroke="white" stroke-width="2.5" stroke-dasharray="4 3" opacity="0.85"/>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26">
  <circle cx="13" cy="13" r="12" fill="${color}"/>
  ${ring}
  <text x="13" y="13" dominant-baseline="central" text-anchor="middle" fill="white" font-size="11" font-weight="700" font-family="system-ui,sans-serif">${label}</text>
</svg>`;
  return L.divIcon({
    html: `<div style="filter:drop-shadow(0 2px 5px rgba(0,0,0,0.45))">${svg}</div>`,
    className: "",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -17],
  });
}
