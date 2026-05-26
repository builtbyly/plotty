import { useMemo } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import PointPopup from "./PointPopup";
import { CoordContent } from "./CoordContent";
import L from "leaflet";
import { Coordinates } from "../../../domain/value-objects/Coordinates";
import { createStopIcon } from "../../shared/routeIcons";

interface StopProps {
  title: string;
  point: Coordinates;
  isChargingStation: boolean;
  color?: string;
  highlighted?: boolean;
  onReady?: (marker: L.Marker | null) => void;
  onLeft?: () => void;
  onRight?: () => void;
  onClick?: () => void;
}

export const Stop: React.FC<StopProps> = ({
  title,
  point,
  isChargingStation = false,
  color = "#1a73e8",
  highlighted = false,
  onReady = () => {},
  onLeft = () => {},
  onRight = () => {},
  onClick = () => {},
}) => {
  const map = useMap();
  const icon = useMemo(() => createStopIcon(color, title, highlighted), [color, title, highlighted]);

  return (
    <Marker
      ref={(r) => {
        onReady(r);
      }}
      position={[point.latitude, point.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => {
          onClick();
        },
      }}
    >
      <Popup>
        <PointPopup
          title={title}
          content={<CoordContent lat={point.latitude} lng={point.longitude} label={isChargingStation ? "Charging stop" : "Waypoint"} accentColor={isChargingStation ? "#27ae60" : "#e67e22"} />}
          onLocateClick={() => {
            map?.flyTo([point.latitude, point.longitude], 18, {
              animate: true,
              duration: 0.5,
            });
          }}
          onLeftArrowClick={onLeft}
          onRightArrowClick={onRight}
        />
      </Popup>
    </Marker>
  );
};
