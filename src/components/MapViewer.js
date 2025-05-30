import { useEffect, useState, useRef, useCallback } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs } from "firebase/firestore";
import RestaurantDetailModal from "./RestaurantDetailModal";

const MapViewer = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [map, setMap] = useState(null);
  const markersRef = useRef([]);
  const clustererRef = useRef(null);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [ratingFilter, setRatingFilter] = useState(0);

  const getColorByRating = (rating) => {
    if (rating === 5) return "#2ecc71"; // 초록
    if (rating === 4) return "#3498db"; // 파랑
    if (rating === 3) return "#f1c40f"; // 노랑
    if (rating === 2) return "#f39c12"; // 주황
    return "#e74c3c"; // 빨강
  };

  const createMarkerImage = (color) => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
        <circle cx="16" cy="16" r="10" fill="${color}" stroke="#333" stroke-width="2"/>
      </svg>
    `;
    return new window.kakao.maps.MarkerImage(
      `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      new window.kakao.maps.Size(32, 32),
      { offset: new window.kakao.maps.Point(16, 16) }
    );
  };

  const createMarkers = useCallback((mapInstance, dataList) => {
    // 기존 마커/클러스터 제거
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    if (clustererRef.current) {
      clustererRef.current.clear();
      clustererRef.current = null;
    }

    const kakao = window.kakao;
    const clusterer = new kakao.maps.MarkerClusterer({
      map: mapInstance,
      averageCenter: true,
      minLevel: 5,
    });

    const newMarkers = dataList.map((data) => {
      const position = new kakao.maps.LatLng(data.lat, data.lng);
      const color = getColorByRating(data.rating);
      const markerImage = createMarkerImage(color);

      const marker = new kakao.maps.Marker({
        position,
        image: markerImage,
      });

      const infowindowContent = document.createElement("div");
      infowindowContent.style.padding = "5px";
      infowindowContent.style.fontSize = "13px";

      const nameEl = document.createElement("strong");
      nameEl.style.textDecoration = "underline";
      nameEl.style.cursor = "pointer";
      nameEl.textContent = data.name;
      nameEl.onclick = () => setSelectedRestaurant(data);

      const ratingEl = document.createElement("div");
      ratingEl.textContent = `⭐ ${data.rating}점`;

      const reviewEl = document.createElement("div");
      reviewEl.textContent = `💬 ${data.review}`;

      infowindowContent.appendChild(nameEl);
      infowindowContent.appendChild(ratingEl);
      infowindowContent.appendChild(reviewEl);

      const infowindowInstance = new kakao.maps.InfoWindow({
        content: infowindowContent,
      });

      kakao.maps.event.addListener(marker, "click", () => {
        infowindowInstance.open(mapInstance, marker);
      });

      return marker;
    });

    clusterer.addMarkers(newMarkers);
    markersRef.current = newMarkers;
    clustererRef.current = clusterer;
  }, []);

  const loadRestaurants = useCallback(
    async (mapInstance) => {
      const querySnapshot = await getDocs(collection(db, "restaurants"));
      const allData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRestaurants(allData);

      const filtered = allData.filter((r) => {
        const matchKeyword =
          r.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          (r.review &&
            r.review.toLowerCase().includes(searchKeyword.toLowerCase()));
        const matchRating = ratingFilter === 0 || r.rating === ratingFilter;
        return matchKeyword && matchRating;
      });

      createMarkers(mapInstance, filtered);
    },
    [searchKeyword, ratingFilter, createMarkers]
  );

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_API_KEY}&autoload=false&libraries=services,clusterer`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(async () => {
        const container = document.getElementById("map");
        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.978),
          level: 3,
        };
        const mapInstance = new window.kakao.maps.Map(container, options);
        setMap(mapInstance);
        await loadRestaurants(mapInstance);
      });
    };
    document.head.appendChild(script);

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      if (clustererRef.current) {
        clustererRef.current.clear();
        clustererRef.current = null;
      }
    };
  }, [loadRestaurants]);

  useEffect(() => {
    if (!map) return;
    const filtered = restaurants.filter((r) => {
      const matchKeyword =
        r.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (r.review &&
          r.review.toLowerCase().includes(searchKeyword.toLowerCase()));
      const matchRating = ratingFilter === 0 || r.rating === ratingFilter;
      return matchKeyword && matchRating;
    });
    createMarkers(map, filtered);
  }, [searchKeyword, ratingFilter, restaurants, map, createMarkers]);

  return (
    <>
      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="맛집 이름 또는 한줄평 검색"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{ width: "60%", padding: "6px", marginRight: "10px" }}
        />
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(Number(e.target.value))}
          style={{ padding: "6px" }}
        >
          <option value={0}>별점 전체</option>
          <option value={5}>5점</option>
          <option value={4}>4점</option>
          <option value={3}>3점</option>
          <option value={2}>2점</option>
          <option value={1}>1점</option>
        </select>
      </div>

      <div
        id="map"
        style={{
          width: "100%",
          height: "500px",
          borderRadius: "8px",
          marginTop: "10px",
          border: "1px solid #ccc",
        }}
      ></div>

      <RestaurantDetailModal
        restaurant={selectedRestaurant}
        onClose={() => setSelectedRestaurant(null)}
      />
    </>
  );
};

export default MapViewer;
