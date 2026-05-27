import React, { useMemo } from "react";
import { LayerGroup, Marker, Popup, useMap } from "react-leaflet";
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

  const {
    handlePointClick,
    handleGoingForward: gotoNextPoint,
    handleGoingBackward: gotoPreviousPoint,
    handlePointReady,
    focusedPointIndex,
  } = usePointFocus(points.length, `${route.id.toString()}_points`);

  return (
    <>
      {points.map((point, index) => (
        <Point
          key={`${index}-${point.latitude},${point.longitude}`}
          title={`${index}`}
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
      ))}
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

interface RouteLayerProps extends PathComponentProps<Route> {
  showInstructions?: boolean;
}

export const RouteLayer: React.FC<RouteLayerProps> = React.memo(
  ({ layer, showInstructions = true }) => {
    const props: RouteComponentProps = {
      route: layer.path,
      color: layer.color.toHex(),
    };

    return (
      <LayerGroup>
        <RoutePoints {...props} />
        <RouteWaypoints {...props} />
        {showInstructions && <RouteInstructions {...props} />}
      </LayerGroup>
    );
  }
);

function InstructionText({ instruction, color }: { instruction: RouteInstruction; color: string }) {
  const { point, instruction: text } = instruction;
  return (
    <div style={styles.root}>
      <div style={{ ...styles.maneuver, borderTopColor: color }}>{text}</div>
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
};
