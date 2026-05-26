import { useMemo } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import PointPopup from "./PointPopup";
import { CoordContent } from "./CoordContent";
import L from "leaflet";
import { Coordinates } from "../../../domain/value-objects/Coordinates";
import { createOriginIcon } from "../../shared/routeIcons";

interface OriginProps {
  point: Coordinates;
  color?: string;
  highlighted?: boolean;
  onReady?: (marker: L.Marker | null) => void;
  onClick?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
}

export const Origin: React.FC<OriginProps> = ({
  point,
  color = "#1a73e8",
  highlighted = false,
  onReady = () => {},
  onClick = () => {},
  onLeft = () => {},
  onRight = () => {},
}) => {
  const map = useMap();
  const icon = useMemo(() => createOriginIcon(color, highlighted), [color, highlighted]);

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
          title="O"
          content={<CoordContent lat={point.latitude} lng={point.longitude} label="Origin" accentColor="#27ae60" />}
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
