import { Layer, createLayer } from "../entities/Layer";
import { GeoPath, GeoRenderHint } from "../entities/GeoPath";
import { LogcatPath } from "../entities/LogcatPath";
import { TtpPath } from "../entities/TtpPath";
import { Route } from "../entities/Route";
import { AnyPath } from "../entities/Path";
import { Color } from "../value-objects/Color";
import { Coordinates } from "../value-objects/Coordinates";
import { CrashEvent, CrashType } from "../value-objects/CrashEvent";
import { ReplanEvent, ReplanCategory, ReplanOutcome } from "../value-objects/ReplanEvent";
import { TtpPoint, TtpPointType } from "../value-objects/TtpPoint";
import { LogPoint } from "../value-objects/LogPoint";
import { LogLevel } from "../value-objects/LogLevel";
import { RouteSource } from "../value-objects/RoutingModel";

type SerializedGeoPath = {
  type: "geo";
  points: { latitude: number; longitude: number }[];
  renderHint?: GeoRenderHint;
  properties?: Record<string, unknown>;
};

type SerializedTtpPath = {
  type: "ttp";
  points: {
    latitude: number;
    longitude: number;
    ttpType: string;
    speed: number | null;
    timestamp: number | null;
    heading: number | null;
  }[];
};

type SerializedCrashEvent = {
  type: string;
  description: string;
  lineNumber: number;
  timestamp: number | null;
  nearestPointIndex: number;
};

type SerializedReplanEvent = {
  category: string;
  outcome: string;
  reason: string;
  errorMessage: string | null;
  lineNumber: number;
  timestamp: number | null;
  timezoneOffsetMinutes: number | null;
  nearestPointIndex: number;
};

type SerializedLogcatPath = {
  type: "log";
  points: {
    latitude: number;
    longitude: number;
    level: string;
    tag: string;
    line: number;
    extra: Record<string, string>;
    timestamp: number | null;
    timezoneOffsetMinutes: number | null;
    speed: number | null;
    heading: number | null;
  }[];
  crashes?: SerializedCrashEvent[];
  replanEvents?: SerializedReplanEvent[];
};

type SerializedRoute = {
  type: "route";
  source: RouteSource;
};

type SerializedPath =
  | SerializedGeoPath
  | SerializedTtpPath
  | SerializedLogcatPath
  | SerializedRoute;

type SerializedLayer = {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  path: SerializedPath;
};

function assertGeoPath(path: AnyPath): GeoPath {
  if (path instanceof GeoPath) {
    return path;
  }
  throw new Error(`Unsupported path type for serialization: ${path.constructor.name}`);
}

function serializePath(path: AnyPath): SerializedPath {
  if (path instanceof Route) {
    return { type: "route", source: path.source };
  }
  if (path instanceof TtpPath) {
    return {
      type: "ttp",
      points: path.points.map((p) => ({
        latitude: p.latitude,
        longitude: p.longitude,
        ttpType: p.type,
        speed: p.speed,
        timestamp: p.timestamp,
        heading: p.heading,
      })),
    };
  }
  if (path instanceof LogcatPath) {
    return {
      type: "log",
      points: path.points.map((p) => ({
        latitude: p.latitude,
        longitude: p.longitude,
        level: p.level,
        tag: p.tag,
        line: p.line,
        extra: Object.fromEntries(p.extra),
        timestamp: p.timestamp,
        timezoneOffsetMinutes: p.timezoneOffsetMinutes,
        speed: p.speed,
        heading: p.heading,
      })),
      crashes: path.crashes.map((c) => ({
        type: c.type,
        description: c.description,
        lineNumber: c.lineNumber,
        timestamp: c.timestamp,
        nearestPointIndex: c.nearestPointIndex,
      })),
      replanEvents: path.replanEvents.map((e) => ({
        category: e.category,
        outcome: e.outcome,
        reason: e.reason,
        errorMessage: e.errorMessage,
        lineNumber: e.lineNumber,
        timestamp: e.timestamp,
        timezoneOffsetMinutes: e.timezoneOffsetMinutes,
        nearestPointIndex: e.nearestPointIndex,
      })),
    };
  }
  const geoPath = assertGeoPath(path);
  return {
    type: "geo",
    points: geoPath.points.map((p) => ({
      latitude: p.latitude,
      longitude: p.longitude,
    })),
    renderHint: geoPath.renderHint,
    properties: geoPath.properties,
  };
}

function deserializePath(serialized: SerializedPath): AnyPath {
  switch (serialized.type) {
    case "route":
      return new Route(serialized.source);
    case "ttp":
      return new TtpPath(
        serialized.points.map(
          (p) =>
            new TtpPoint(
              p.ttpType as TtpPointType,
              p.latitude,
              p.longitude,
              p.speed,
              p.timestamp,
              p.heading
            )
        )
      );
    case "log":
      return new LogcatPath(
        serialized.points.map(
          (p) =>
            new LogPoint(
              p.latitude,
              p.longitude,
              p.level as LogLevel,
              p.tag,
              p.line,
              new Map(Object.entries(p.extra)),
              p.timestamp,
              p.timezoneOffsetMinutes ?? null,
              p.speed,
              p.heading
            )
        ),
        (serialized.crashes ?? []).map((c): CrashEvent => ({
          type: c.type as CrashType,
          description: c.description,
          lineNumber: c.lineNumber,
          timestamp: c.timestamp,
          nearestPointIndex: c.nearestPointIndex,
        })),
        (serialized.replanEvents ?? []).map((e): ReplanEvent => ({
          category: e.category as ReplanCategory,
          outcome: e.outcome as ReplanOutcome,
          reason: e.reason,
          errorMessage: e.errorMessage,
          lineNumber: e.lineNumber,
          timestamp: e.timestamp,
          timezoneOffsetMinutes: e.timezoneOffsetMinutes,
          nearestPointIndex: e.nearestPointIndex,
        }))
      );
    case "geo":
      return new GeoPath(
        serialized.points.map((p) => new Coordinates(p.latitude, p.longitude)),
        undefined,
        serialized.renderHint,
        serialized.properties,
      );
  }
}

export function serializeLayers(layers: Layer<AnyPath>[]): string {
  const serialized: SerializedLayer[] = layers.map((layer) => ({
    id: layer.id,
    name: layer.name,
    color: layer.color.toHex(),
    visible: layer.visible,
    path: serializePath(layer.path),
  }));
  return JSON.stringify(serialized);
}

export function deserializeLayers(json: string): Layer<AnyPath>[] {
  const raw: unknown = JSON.parse(json);
  if (!Array.isArray(raw)) throw new Error("Expected a JSON array");
  return raw.map((s: unknown, i) => {
    if (!s || typeof s !== "object") throw new Error(`Layer ${i}: expected object`);
    const layer = s as SerializedLayer;
    if (typeof layer.id !== "string") throw new Error(`Layer ${i}: missing id`);
    if (typeof layer.name !== "string") throw new Error(`Layer ${i}: missing name`);
    if (typeof layer.color !== "string") throw new Error(`Layer ${i}: missing color`);
    if (!layer.path || typeof layer.path.type !== "string") throw new Error(`Layer ${i}: missing path.type`);
    const path = deserializePath(layer.path);
    const created = createLayer(layer.name, Color.fromHex(layer.color), path);
    return { ...created, id: layer.id, visible: layer.visible === true };
  });
}
