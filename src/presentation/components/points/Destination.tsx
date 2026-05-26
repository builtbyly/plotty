import { useMemo } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import PointPopup from "./PointPopup";
import { CoordContent } from "./CoordContent";
import L from "leaflet";
import { Coordinates } from "../../../domain/value-objects/Coordinates";
import { createDestinationIcon } from "../../shared/routeIcons";

interface DestinationProps {
  point: Coordinates;
  color?: string;
  highlighted?: boolean;
  onReady?: (marker: L.Marker | null) => void;
  onClick?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
}

export const Destination: React.FC<DestinationProps> = ({
  point,
  color = "#1a73e8",
  highlighted = false,
  onReady = () => {},
  onClick = () => {},
  onLeft = () => {},
  onRight = () => {},
}) => {
  const map = useMap();
  const icon = useMemo(() => createDestinationIcon(color, highlighted), [color, highlighted]);

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
          title="D"
          content={<CoordContent lat={point.latitude} lng={point.longitude} label="Destination" accentColor="#e74c3c" />}
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
