import { useEffect, useState, useRef, useCallback } from "react";
import { db } from "../../firebase/firebase";
import { collection, getDocs } from "firebase/firestore";
import RestaurantDetailModal from "./RestaurantDetailModal";

const MapViewer = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [map, setMap] = useState(null);
  const markersRef = useRef([]);
  const infoWindowsRef = useRef([]);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(
    document.body.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          setIsDarkMode(document.body.classList.contains("dark"));
        }
      });
    });
    observer.observe(document.body, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const createMarkers = useCallback(
    (mapInstance, dataList) => {
      const { naver } = window;
      if (!naver) return;

      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      infoWindowsRef.current.forEach((infoWindow) => infoWindow.close());
      infoWindowsRef.current = [];

      const markers = dataList.map((data) => {
        const position = new naver.maps.LatLng(data.lat, data.lng);
        const marker = new naver.maps.Marker({
          position,
          map: mapInstance,
          icon: {
            content: `<div style="width:24px;height:24px;background-color:${getColorByRating(
              data.rating
            )};border-radius:50%;border:2px solid ${isDarkMode ? '#333' : '#fff'};box-shadow:0 2px 4px rgba(0,0,0,0.2);"></div>`,
            anchor: new naver.maps.Point(12, 12),
          },
        });

        const infoWindowContent = `
        <div style="padding:10px;min-width:200px;background-color:${isDarkMode ? '#2b2d31' : '#fff'};color:${isDarkMode ? '#dbdee1' : '#37352f'};border-radius:8px;">
          <strong style="font-size:16px;cursor:pointer;text-decoration:underline;color:${isDarkMode ? '#5865f2' : '#007bff'};" 
                  onclick='document.getElementById("restaurant-detail-trigger-${data.id}").click()'>
            ${data.name}
          </strong>
          <p style="margin:5px 0;color:${isDarkMode ? '#dbdee1' : '#37352f'};">⭐ ${data.rating}점</p>
          <p style="font-size:12px;color:${isDarkMode ? '#b5b9bd' : '#6b7280'};">💬 ${data.review}</p>
        </div>
        <button id="restaurant-detail-trigger-${data.id}" style="display:none" 
                onClick='window.selectRestaurant(${JSON.stringify(data)})'>
        </button>
      `;

        const infoWindow = new naver.maps.InfoWindow({
          content: infoWindowContent,
          borderWidth: 0,
          backgroundColor: "transparent",
          pixelOffset: new naver.maps.Point(0, -20),
          anchorSkew: true,
        });

        naver.maps.Event.addListener(marker, "click", () => {
          if (infoWindow.getMap()) {
            infoWindow.close();
          } else {
            infoWindow.open(mapInstance, marker);
          }
        });

        markersRef.current.push(marker);
        infoWindowsRef.current.push(infoWindow);
        return marker;
      });

      if (window.MarkerClustering) {
        new window.MarkerClustering({
          minClusterSize: 2,
          maxZoom: 13,
          map: mapInstance,
          markers: markers,
          disableClickZoom: false,
          gridSize: 120,
          icons: [
            {
              content:
                '<div style="cursor:pointer;width:40px;height:40px;line-height:42px;font-size:12px;color:white;text-align:center;font-weight:bold;background:url(https://navermaps.github.io/maps.js.ncp/docs/img/cluster-marker-1.png);background-size:contain;"></div>',
              size: new naver.maps.Size(40, 40),
              anchor: new naver.maps.Point(20, 20),
            },
          ],
          indexGenerator: [10, 100, 200, 500, 1000],
          stylingFunction: (clusterMarker, count) => {
            clusterMarker
              .getElement()
              .querySelector("div:first-child").innerText = count;
          },
        });
      }
    },
    [isDarkMode]
  );

  useEffect(() => {
    window.selectRestaurant = (data) => {
      setSelectedRestaurant(data);
    };
  }, []);

  const loadRestaurants = useCallback(
    async (mapInstance) => {
      const querySnapshot = await getDocs(collection(db, "restaurants"));
      const allData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRestaurants(allData);
      createMarkers(mapInstance, allData);
    },
    [createMarkers]
  );

  useEffect(() => {
    const initMap = () => {
      const { naver } = window;
      if (!naver || !naver.maps) return;

      const mapOptions = {
        center: new naver.maps.LatLng(37.5665, 126.978),
        zoom: 12,
      };
      const mapInstance = new naver.maps.Map("map", mapOptions);
      setMap(mapInstance);
      loadRestaurants(mapInstance);
    };

    if (window.naver && window.naver.maps) {
      initMap();
    } else {
      const mapScript = document.querySelector(
        'script[src*="ncpClientId"]'
      );
      mapScript.addEventListener("load", initMap);
    }
  }, [loadRestaurants]);

  useEffect(() => {
    if (!map) return;

    const filtered = restaurants.filter((r) => {
      const matchKeyword =
        r.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (r.review &&
          r.review.toLowerCase().includes(searchKeyword.toLowerCase()));
      const matchRating = ratingFilter === 0 || r.rating >= ratingFilter;
      return matchKeyword && matchRating;
    });

    createMarkers(map, filtered);
  }, [searchKeyword, ratingFilter, restaurants, map, createMarkers]);

  const getColorByRating = (rating) => {
    if (rating === 5) return "#2ecc71";
    if (rating === 4) return "#3498db";
    if (rating === 3) return "#f1c40f";
    if (rating === 2) return "#f39c12";
    return "#e74c3c";
  };

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
          <option value={5}>5점 이상</option>
          <option value={4}>4점 이상</option>
          <option value={3}>3점 이상</option>
          <option value={2}>2점 이상</option>
          <option value={1}>1점 이상</option>
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
