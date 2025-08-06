import { useEffect, useRef } from "react";

const MapSelector = ({ onLocationSelect }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const initMap = () => {
      const { naver } = window;
      if (!naver || !naver.maps) {
        console.error("Naver Maps API not loaded");
        return;
      }

      const location = new naver.maps.LatLng(37.5665, 126.978);
      const mapOptions = {
        center: location,
        zoom: 10,
        zoomControl: true,
      };

      const map = new naver.maps.Map("map", mapOptions);
      mapRef.current = map;

      naver.maps.Event.addListener(map, "click", (e) => {
        const { coord } = e;
        onLocationSelect({ lat: coord.y, lng: coord.x });

        if (markerRef.current) {
          markerRef.current.setPosition(coord);
        } else {
          markerRef.current = new naver.maps.Marker({
            position: coord,
            map: mapRef.current,
          });
        }
      });
    };

    if (window.naver && window.naver.maps) {
      initMap();
    } else {
      const mapScript = document.querySelector(
        'script[src*="ncpClientId"]'
      );
      mapScript.addEventListener("load", initMap);
    }
  }, [onLocationSelect]);

  return (
    <div
      id="map"
      style={{
        width: "100%",
        height: "300px",
        borderRadius: "8px",
        marginTop: "20px",
      }}
    ></div>
  );
};

export default MapSelector;
