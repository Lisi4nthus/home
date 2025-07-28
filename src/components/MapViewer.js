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
  const openInfoWindowsRef = useRef([]);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(
    document.body.classList.contains("dark")
  );

  // InfoWindow 스타일 업데이트 함수
  const updateInfoWindowStyles = useCallback((isDark) => {
    console.log("테마 업데이트:", isDark ? "다크" : "라이트"); // 디버깅용

    openInfoWindowsRef.current.forEach(
      ({ content, nameEl, ratingEl, reviewEl }) => {
        // 컨테이너 스타일 업데이트
        content.style.backgroundColor = isDark ? "#2b2d31" : "#ffffff";
        content.style.color = isDark ? "#dbdee1" : "#37352f";
        content.style.border = isDark
          ? "1px solid #3c4043"
          : "1px solid #e9ecef";

        // 개별 요소 스타일 업데이트
        nameEl.style.color = "#5865f2"; // 프라이머리 색상은 동일
        ratingEl.style.color = isDark ? "#dbdee1" : "#37352f";
        reviewEl.style.color = isDark ? "#b5b9bd" : "#6b7280";

        console.log("InfoWindow 스타일 적용:", {
          backgroundColor: content.style.backgroundColor,
          color: content.style.color,
        });
      }
    );
  }, []);

  // 테마 변경 감지
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          const newIsDarkMode = document.body.classList.contains("dark");
          if (newIsDarkMode !== isDarkMode) {
            setIsDarkMode(newIsDarkMode);
            // 테마 변경 시 모든 InfoWindow 스타일 업데이트
            updateInfoWindowStyles(newIsDarkMode);
          }
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [isDarkMode, updateInfoWindowStyles]);

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

  const createMarkers = useCallback(
    (mapInstance, dataList) => {
      // 기존 마커/클러스터 제거
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      if (clustererRef.current) {
        clustererRef.current.clear();
        clustererRef.current = null;
      }
      // InfoWindow 정보 초기화
      openInfoWindowsRef.current = [];

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

        // 현재 테마 사용

        const infowindowContent = document.createElement("div");
        infowindowContent.style.padding = "8px";
        infowindowContent.style.fontSize = "13px";
        infowindowContent.style.backgroundColor = isDarkMode
          ? "#2b2d31"
          : "#ffffff";
        infowindowContent.style.color = isDarkMode ? "#dbdee1" : "#37352f";
        infowindowContent.style.borderRadius = "8px";
        infowindowContent.style.border = isDarkMode
          ? "1px solid #3c4043"
          : "1px solid #e9ecef";
        infowindowContent.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
        infowindowContent.style.minWidth = "160px";

        const nameEl = document.createElement("strong");
        nameEl.style.textDecoration = "underline";
        nameEl.style.cursor = "pointer";
        nameEl.style.color = isDarkMode ? "#5865f2" : "#5865f2";
        nameEl.style.marginBottom = "4px";
        nameEl.style.display = "block";
        nameEl.textContent = data.name;
        nameEl.onclick = () => setSelectedRestaurant(data);

        const ratingEl = document.createElement("div");
        ratingEl.style.color = isDarkMode ? "#dbdee1" : "#37352f";
        ratingEl.style.marginBottom = "2px";
        ratingEl.textContent = `⭐ ${data.rating}점`;

        const reviewEl = document.createElement("div");
        reviewEl.style.color = isDarkMode ? "#b5b9bd" : "#6b7280";
        reviewEl.style.fontSize = "12px";
        reviewEl.style.marginTop = "4px";
        reviewEl.textContent = `💬 ${data.review}`;

        infowindowContent.appendChild(nameEl);
        infowindowContent.appendChild(ratingEl);
        infowindowContent.appendChild(reviewEl);

        const infowindowInstance = new kakao.maps.InfoWindow({
          content: infowindowContent,
        });

        // InfoWindow 정보를 ref에 저장
        const infoWindowData = {
          instance: infowindowInstance,
          content: infowindowContent,
          nameEl,
          ratingEl,
          reviewEl,
        };

        kakao.maps.event.addListener(marker, "click", () => {
          // 클릭 시점에 현재 테마를 확인하여 스타일 업데이트
          const currentIsDarkMode = document.body.classList.contains("dark");

          // 컨테이너 스타일 업데이트
          infowindowContent.style.backgroundColor = currentIsDarkMode
            ? "#2b2d31"
            : "#ffffff";
          infowindowContent.style.color = currentIsDarkMode
            ? "#dbdee1"
            : "#37352f";
          infowindowContent.style.border = currentIsDarkMode
            ? "1px solid #3c4043"
            : "1px solid #e9ecef";

          // 개별 요소 스타일 업데이트
          nameEl.style.color = currentIsDarkMode ? "#5865f2" : "#5865f2";
          ratingEl.style.color = currentIsDarkMode ? "#dbdee1" : "#37352f";
          reviewEl.style.color = currentIsDarkMode ? "#b5b9bd" : "#6b7280";

          infowindowInstance.open(mapInstance, marker);
        });

        openInfoWindowsRef.current.push(infoWindowData);

        return marker;
      });

      clusterer.addMarkers(newMarkers);
      markersRef.current = newMarkers;
      clustererRef.current = clusterer;
    },
    [isDarkMode]
  );

  // 테마 변경 시 마커 재생성
  useEffect(() => {
    if (map && restaurants.length > 0) {
      const filteredRestaurants = restaurants.filter((restaurant) => {
        const matchesKeyword =
          restaurant.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          restaurant.review.toLowerCase().includes(searchKeyword.toLowerCase());
        const matchesRating =
          ratingFilter === 0 || restaurant.rating >= ratingFilter;
        return matchesKeyword && matchesRating;
      });
      createMarkers(map, filteredRestaurants);
    }
  }, [
    isDarkMode,
    map,
    restaurants,
    searchKeyword,
    ratingFilter,
    createMarkers,
  ]);

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
