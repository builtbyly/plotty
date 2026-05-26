import React, { useMemo } from "react";
import { LayerGroup } from "react-leaflet";
import { Point } from "./points/Point";
import { CrashMarker } from "./points/CrashMarker";
import { ReplanMarker } from "./points/ReplanMarker";
import { usePointFocus } from "../hooks/usePointFocus";
import { PathComponentProps } from "../shared/PathComponentsProps";
import { LogPath } from "../../domain/entities/LogPath";
import { LogPointPopup } from "./points/LogPointPopup";
import { LogPoint } from "../../domain/value-objects/LogPoint";
import { getLogTagColor } from "../utils/logTagColors";

interface LogPathLayerProps extends PathComponentProps<LogPath> {
  showBehavioral?: boolean;
  showInterval?: boolean;
}

const getPointStyle = (point: LogPoint) => {
  const { point: color, category } = getLogTagColor(point.tag);
  return {
    radius: category === "routing" ? 12 : 4,
    color,
  };
};

export const LogPathLayer: React.FC<LogPathLayerProps> = React.memo(
  ({ layer, showBehavioral = true, showInterval = true }) => {
    const points = layer.path.points;

    const {
      handlePointClick,
      handleGoingForward,
      handleGoingBackward,
      handlePointReady: setMarker,
      focusedPointIndex,
    } = usePointFocus(points.length, layer.id);

    // When triggered and failed share a nearestPointIndex, show only the failed marker.
    const failedIndices = useMemo(
      () => new Set(layer.path.replanEvents.filter((e) => e.outcome === "failed").map((e) => e.nearestPointIndex)),
      [layer.path.replanEvents]
    );

    const replanMarkersToShow = useMemo(
      () =>
        layer.path.replanEvents
          .filter((e) => e.nearestPointIndex >= 0)
          .filter((e) => e.outcome === "failed" || !failedIndices.has(e.nearestPointIndex))
          .filter((e) => (e.category === "behavioral" ? showBehavioral : showInterval)),
      [layer.path.replanEvents, failedIndices, showBehavioral, showInterval]
    );

    return (
      <>
        <LayerGroup>
          {points.map((point, index) => {
            const style = getPointStyle(point);
            return (
              <Point
                key={point.line}
                title={`${point.line}`}
                point={point}
                highlighted={index === focusedPointIndex}
                radius={style.radius}
                color={style.color}
                showCopyButton={false}
                content={<LogPointPopup point={point} />}
                onReady={(marker) => setMarker(index, marker)}
                onRight={handleGoingForward}
                onLeft={handleGoingBackward}
                onClick={() => {
                  handlePointClick(index);
                }}
              />
            );
          })}
        </LayerGroup>
        <LayerGroup>
          {layer.path.crashes
            .filter((c) => c.nearestPointIndex >= 0)
            .map((c) => (
              <CrashMarker
                key={`crash-${c.lineNumber}`}
                crash={c}
                position={points[c.nearestPointIndex]}
              />
            ))}
          {replanMarkersToShow.map((e) => (
            <ReplanMarker
              key={`replan-${e.lineNumber}`}
              event={e}
              position={points[e.nearestPointIndex]}
            />
          ))}
        </LayerGroup>
      </>
    );
  }
);
