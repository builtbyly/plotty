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

export function createInstructionIcon(color: string, index: number, highlighted: boolean): L.DivIcon {
  const size = 22;
  const half = size / 2;
  const ring = highlighted
    ? `<circle cx="${half}" cy="${half}" r="${half - 1}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="3 2" opacity="0.7"/>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <circle cx="${half}" cy="${half}" r="${half - 1.5}" fill="white" stroke="${color}" stroke-width="2"/>
  ${ring}
  <text x="${half}" y="${half}" dominant-baseline="central" text-anchor="middle" fill="${color}" font-size="9" font-weight="700" font-family="system-ui,sans-serif">${index + 1}</text>
</svg>`;
  return L.divIcon({
    html: `<div style="filter:drop-shadow(0 1px 3px rgba(0,0,0,0.3))">${svg}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [half, half],
    popupAnchor: [0, -half - 4],
  });
}

export function createCrashIcon(type: "crash" | "anr"): L.DivIcon {
  const color = type === "crash" ? "#c0392b" : "#d35400";
  const glyph = type === "crash" ? "✕" : "!";
  const size = 30;
  const half = size / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <circle cx="${half}" cy="${half}" r="${half - 1.5}" fill="${color}" stroke="white" stroke-width="2.5"/>
  <text x="${half}" y="${half}" dominant-baseline="central" text-anchor="middle" fill="white" font-size="15" font-weight="800" font-family="system-ui,sans-serif">${glyph}</text>
</svg>`;
  return L.divIcon({
    html: `<div style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.55));line-height:0;">${svg}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [half, half],
    popupAnchor: [0, -half - 4],
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
