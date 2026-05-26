import React from "react";
import { AnyPath } from "../../domain/entities/Path";
import { GeoPath } from "../../domain/entities/GeoPath";
import { LogcatPath } from "../../domain/entities/LogcatPath";
import { TtpPath } from "../../domain/entities/TtpPath";
import { Route } from "../../domain/entities/Route";
import {
  PathComponentProps,
  PathComponentsProps,
  arePathComponentsPropsEqual,
} from "../shared/PathComponentsProps";
import { GeoPathLayer } from "./GeoPathLayer";
import { LogcatPathLayer } from "./LogcatPathLayer";
import { TtpPathLayer } from "./TtpPathLayer";
import { RouteLayer } from "./RouteLayer";

function createLayersComponent<T extends AnyPath>(
  LayerComponent: React.ComponentType<PathComponentProps<T>>
): React.FC<PathComponentsProps<T>> {
  return React.memo(
    ({ layers }: PathComponentsProps<T>) =>
      layers
        .filter((l) => l.visible)
        .map((l, i) => <LayerComponent key={`${i}-${l.id}`} layer={l} />),
    arePathComponentsPropsEqual
  ) as React.FC<PathComponentsProps<T>>;
}

export const GeoPathLayers = createLayersComponent<GeoPath>(GeoPathLayer);
export const LogcatPathLayers = createLayersComponent<LogcatPath>(LogcatPathLayer);
export const TtpPathLayers = createLayersComponent<TtpPath>(TtpPathLayer);
export const RouteLayers = createLayersComponent<Route>(RouteLayer);
