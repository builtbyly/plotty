import React, { useMemo } from "react";
import { CircleMarker, LayerGroup, Marker, Polyline, Popup, useMap } from "react-leaflet";
import { TrafficSection } from "../../domain/value-objects/RoutingModel";
import { Point } from "./points/Point";
import { Origin } from "./points/Origin";
import { Stop } from "./points/Stop";
import { Destination } from "./points/Destination";
import { Route } from "../../domain/entities/Route";
import { Coordinates } from "../../domain/value-objects/Coordinates";
import { usePointFocus } from "../hooks/usePointFocus";
import { PathComponentProps } from "../shared/PathComponentsProps";
import { CoordContent } from "./points/CoordContent";
import PointPopup from "./points/PointPopup";
import { RouteInstruction } from "../../domain/value-objects/RouteInstruction";
import { createInstructionIcon } from "../shared/routeIcons";

interface RouteComponentProps {
  route: Route;
  color: string;
}

const RoutePoints: React.FC<RouteComponentProps> = ({ route, color }) => {
  const points = route.points;
  const legMembership = route.legMembership;

  const {
    handlePointClick,
    handleGoingForward: gotoNextPoint,
    handleGoingBackward: gotoPreviousPoint,
    handlePointReady,
    focusedPointIndex,
  } = usePointFocus(points.length, `${route.id.toString()}_points`);

  // Precompute per-leg counters for index-within-leg
  const legCounters = useMemo(() => {
    const counters: number[] = new Array(points.length).fill(0);
    const legRunningCounts: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const legIdx = legMembership[i] ?? 0;
      if (legRunningCounts[legIdx] === undefined) legRunningCounts[legIdx] = 0;
      counters[i] = legRunningCounts[legIdx];
      legRunningCounts[legIdx]++;
    }
    return counters;
  }, [points.length, legMembership]);

  return (
    <>
      {points.map((point, index) => {
        const legIdx = legMembership[index] ?? 0;
        const idxInLeg = legCounters[index];
        return (
          <Point
            key={`${index}-${point.latitude},${point.longitude}`}
            title={`#${index} · leg ${legIdx}[${idxInLeg}]`}
            point={point}
            highlighted={index === focusedPointIndex}
            onReady={(marker) => handlePointReady(index, marker)}
            onRight={gotoNextPoint}
            onLeft={gotoPreviousPoint}
            onClick={() => {
              handlePointClick(index);
            }}
            color={color}
          />
        );
      })}
    </>
  );
};

const RouteWaypoints: React.FC<RouteComponentProps> = ({ route, color }) => {
  const stops = route.stops;
  const waypoints = stops.slice(1, -1);
  const origin = stops[0];
  const destination = stops[stops.length - 1];

  const {
    handlePointClick,
    handleGoingForward: gotoNextPoint,
    handleGoingBackward: gotoPreviousPoint,
    handlePointReady,
    focusedPointIndex,
  } = usePointFocus(stops.length, `${route.id.toString()}_waypoints`);

  return (
    <>
      <Origin
        key={0}
        point={origin}
        color={color}
        highlighted={focusedPointIndex === 0}
        onReady={(marker) => { handlePointReady(0, marker); }}
        onRight={gotoNextPoint}
        onLeft={gotoPreviousPoint}
        onClick={() => { handlePointClick(0); }}
      />

      {waypoints.map((waypoint, index) => (
        <Stop
          key={index + 1}
          title={`${index + 1}`}
          point={new Coordinates(waypoint.latitude, waypoint.longitude)}
          isChargingStation={waypoint.isChargingStation}
          color={color}
          highlighted={focusedPointIndex === index + 1}
          onReady={(marker) => { handlePointReady(index + 1, marker); }}
          onRight={gotoNextPoint}
          onLeft={gotoPreviousPoint}
          onClick={() => { handlePointClick(index + 1); }}
        />
      ))}

      <Destination
        key={stops.length - 1}
        point={destination}
        color={color}
        highlighted={focusedPointIndex === stops.length - 1}
        onReady={(marker) => { handlePointReady(stops.length - 1, marker); }}
        onRight={gotoNextPoint}
        onLeft={gotoPreviousPoint}
        onClick={() => { handlePointClick(stops.length - 1); }}
      />
    </>
  );
};

const InstructionMarker: React.FC<{
  instruction: RouteInstruction;
  index: number;
  color: string;
  highlighted: boolean;
  onReady: (m: L.Marker | null) => void;
  onClick: () => void;
  onLeft: () => void;
  onRight: () => void;
}> = ({ instruction, index, color, highlighted, onReady, onClick, onLeft, onRight }) => {
  const { point } = instruction;
  const map = useMap();
  const icon = useMemo(() => createInstructionIcon(color, index, highlighted), [color, index, highlighted]);
  return (
    <Marker
      ref={onReady}
      position={[point.latitude, point.longitude]}
      icon={icon}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <PointPopup
          title={`${index + 1}`}
          content={<InstructionText instruction={instruction} color={color} />}
          onLeftArrowClick={onLeft}
          onRightArrowClick={onRight}
          onLocateClick={() => map.flyTo([point.latitude, point.longitude], 18, { animate: true, duration: 0.5 })}
          showCopyButton={false}
        />
      </Popup>
    </Marker>
  );
};

const RouteInstructions: React.FC<RouteComponentProps> = ({ route, color }) => {
  const instructions = route.instructions;

  const {
    handlePointClick,
    handleGoingForward,
    handleGoingBackward,
    handlePointReady,
    focusedPointIndex,
  } = usePointFocus(instructions.length, `${route.id.toString()}_instructions`);

  return (
    <>
      {instructions.map((i, index) => (
        <InstructionMarker
          key={`${index}-${i.point.latitude},${i.point.longitude}`}
          instruction={i}
          index={index}
          color={color}
          highlighted={focusedPointIndex === index}
          onReady={(m) => handlePointReady(index, m)}
          onClick={() => handlePointClick(index)}
          onLeft={handleGoingBackward}
          onRight={handleGoingForward}
        />
      ))}
    </>
  );
};

const DeviationMarker: React.FC<RouteComponentProps> = ({ route, color }) => {
  const { deviationPoint, summary } = route;
  const map = useMap();

  if (!deviationPoint) return null;

  const { deviationTime, deviationDistance } = summary;

  return (
    <CircleMarker
      center={[deviationPoint.latitude, deviationPoint.longitude]}
      radius={8}
      pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 2 }}
    >
      <Popup>
        <PointPopup
          title="deviation"
          content={
            <div style={deviationStyles.root}>
              <div style={{ ...deviationStyles.label, borderTopColor: color }}>deviation point</div>
              {deviationTime !== undefined && deviationDistance !== undefined && (
                <div style={deviationStyles.stats}>
                  +{Math.round(deviationTime)}s · +{Math.round(deviationDistance)}m from main
                </div>
              )}
              <div style={deviationStyles.divider} />
              <CoordContent lat={deviationPoint.latitude} lng={deviationPoint.longitude} accentColor={color} />
            </div>
          }
          onLocateClick={() => map.flyTo([deviationPoint.latitude, deviationPoint.longitude], 18, { animate: true, duration: 0.5 })}
          onLeftArrowClick={() => {}}
          onRightArrowClick={() => {}}
          showCopyButton={false}
        />
      </Popup>
    </CircleMarker>
  );
};

function trafficSectionColor(simpleCategory: string): string {
  if (simpleCategory === "JAM") return "#FF8C00";
  if (simpleCategory === "ROAD_WORK") return "#CC0000";
  return "#FF6600";
}

const RouteTrafficSections: React.FC<RouteComponentProps> = ({ route, color: _color }) => {
  const sections = route.trafficSections;
  const points = route.points;

  return (
    <>
      {sections.map((section: TrafficSection, index: number) => {
        const segmentPoints = points
          .slice(section.startPointIndex, section.endPointIndex + 1)
          .map((p) => [p.latitude, p.longitude] as [number, number]);
        const midIndex = Math.floor((section.startPointIndex + section.endPointIndex) / 2);
        const midPoint = points[midIndex];
        const sectionColor = trafficSectionColor(section.simpleCategory);

        return (
          <React.Fragment key={`traffic-${index}-${section.startPointIndex}-${section.endPointIndex}`}>
            {segmentPoints.length >= 2 && (
              <Polyline positions={segmentPoints} color={sectionColor} weight={6} />
            )}
            {midPoint && (
              <CircleMarker
                center={[midPoint.latitude, midPoint.longitude]}
                radius={8}
                pathOptions={{ color: sectionColor, fillColor: sectionColor, fillOpacity: 0.85 }}
              >
                <Popup>
                  <div style={trafficPopupStyles.root}>
                    <div style={{ ...trafficPopupStyles.category, borderTopColor: sectionColor }}>
                      {section.simpleCategory}
                    </div>
                    <div style={trafficPopupStyles.row}>
                      delay: {section.delayInSeconds}s · speed: {section.effectiveSpeedInKmh} km/h
                    </div>
                    <div style={trafficPopupStyles.row}>magnitude: {section.magnitudeOfDelay}</div>
                    <div style={trafficPopupStyles.row}>pts {section.startPointIndex} → {section.endPointIndex}</div>
                    {section.eventId && (
                      <div style={trafficPopupStyles.row}>eventId: {section.eventId}</div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

interface RouteLayerProps extends PathComponentProps<Route> {
  showInstructions?: boolean;
  showTrafficSections?: boolean;
}

export const RouteLayer: React.FC<RouteLayerProps> = React.memo(
  ({ layer, showInstructions = true, showTrafficSections = true }) => {
    const props: RouteComponentProps = {
      route: layer.path,
      color: layer.color.toHex(),
    };

    return (
      <LayerGroup>
        <RoutePoints {...props} />
        <RouteWaypoints {...props} />
        {showInstructions && <RouteInstructions {...props} />}
        <DeviationMarker {...props} />
        {showTrafficSections && <RouteTrafficSections {...props} />}
      </LayerGroup>
    );
  }
);

function InstructionText({ instruction, color }: { instruction: RouteInstruction; color: string }) {
  const { point, instruction: text, streetName, routeOffsetInMeters } = instruction;
  return (
    <div style={styles.root}>
      <div style={{ ...styles.maneuver, borderTopColor: color }}>{text}</div>
      {streetName && <div style={styles.detail}>onto {streetName}</div>}
      {routeOffsetInMeters !== undefined && <div style={styles.detail}>at {routeOffsetInMeters}m</div>}
      <div style={styles.divider} />
      <CoordContent lat={point.latitude} lng={point.longitude} accentColor={color} />
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  root: {
    display: "flex",
    flexDirection: "column",
    minWidth: "200px",
    gap: "6px",
  },
  maneuver: {
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "rgba(0,0,0,0.75)",
    borderTop: "3px solid",
    paddingTop: "8px",
  },
  divider: {
    height: "1px",
    background: "rgba(0,0,0,0.07)",
  },
  detail: {
    fontSize: "0.78rem",
    color: "rgba(0,0,0,0.55)",
  },
};

const deviationStyles: { [key: string]: React.CSSProperties } = {
  root: {
    display: "flex",
    flexDirection: "column",
    minWidth: "200px",
    gap: "6px",
  },
  label: {
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "rgba(0,0,0,0.75)",
    borderTop: "3px solid",
    paddingTop: "8px",
  },
  stats: {
    fontSize: "0.75rem",
    color: "rgba(0,0,0,0.55)",
  },
  divider: {
    height: "1px",
    background: "rgba(0,0,0,0.07)",
  },
};

const trafficPopupStyles: { [key: string]: React.CSSProperties } = {
  root: {
    display: "flex",
    flexDirection: "column",
    minWidth: "160px",
    gap: "4px",
  },
  category: {
    fontSize: "0.82rem",
    fontWeight: 700,
    color: "rgba(0,0,0,0.75)",
    borderTop: "3px solid",
    paddingTop: "6px",
    textTransform: "uppercase",
  },
  row: {
    fontSize: "0.75rem",
    color: "rgba(0,0,0,0.6)",
  },
};
