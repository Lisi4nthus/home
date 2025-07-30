import { useEffect, useRef } from "react";

const MapSelector = ({ onLocationSelect }) => {
  const markerRef = useRef(null); // 🔹 마커 상태 관리

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_API_KEY}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = document.getElementById("map");
        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.978),
          level: 3,
        };
        const map = new window.kakao.maps.Map(container, options);

        window.kakao.maps.event.addListener(
          map,
          "click",
          function (mouseEvent) {
            const latlng = mouseEvent.latLng;

            // 🔸 이전 마커 제거
            if (markerRef.current) {
              markerRef.current.setMap(null);
            }

            // 🔸 새 마커 생성
            const newMarker = new window.kakao.maps.Marker({
              map,
              position: latlng,
            });
            markerRef.current = newMarker;

            // 🔸 부모로 좌표 전달
            onLocationSelect({
              lat: latlng.getLat(),
              lng: latlng.getLng(),
            });

            map.panTo(latlng);
          }
        );
      });
    };
    document.head.appendChild(script);
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
