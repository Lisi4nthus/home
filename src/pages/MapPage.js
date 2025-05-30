// src/pages/MapPage.js
import React from "react";
import Map from "../components/MapViewer";

const MapPage = () => {
  return (
    <div className="container">
      <h2>📍 나의 맛집 지도</h2>
      <Map latitude={37.5665} longitude={126.978} />
    </div>
  );
};

export default MapPage;
