import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { addRestaurant } from "../../firebase/restaurantApi";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

const StarRating = ({ rating, setRating }) => {
  return (
    <div style={{ display: "flex", gap: "4px", cursor: "pointer" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => setRating(star)}
          style={{
            fontSize: "24px",
            color: star <= rating ? "#ffc107" : "#e4e5e9",
            transition: "color 200ms",
            userSelect: "none",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const RestaurantEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [name, setName] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(0);
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [detail, setDetail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const placeMarkerRef = useRef(null);

  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        const docRef = doc(db, "restaurants", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name);
          setReview(data.review);
          setRating(data.rating);
          setDetail(data.detail || "");
          setLat(data.lat);
          setLng(data.lng);
        }
      };
      fetchData();
    }
  }, [id, isEdit]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_API_KEY}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = document.getElementById("restaurant-map");
        const options = {
          center:
            lat && lng
              ? new window.kakao.maps.LatLng(lat, lng)
              : new window.kakao.maps.LatLng(37.5665, 126.978),
          level: 3,
        };
        const mapInstance = new window.kakao.maps.Map(container, options);
        mapRef.current = mapInstance;

        if (lat && lng) {
          const position = new window.kakao.maps.LatLng(lat, lng);
          const marker = new window.kakao.maps.Marker({
            position,
            map: mapInstance,
          });
          markerRef.current = marker;
        }

        window.kakao.maps.event.addListener(mapInstance, "click", (e) => {
          const clickedLatLng = e.latLng;
          setLat(clickedLatLng.getLat());
          setLng(clickedLatLng.getLng());

          if (markerRef.current) {
            markerRef.current.setPosition(clickedLatLng);
          } else {
            const marker = new window.kakao.maps.Marker({
              position: clickedLatLng,
              map: mapInstance,
            });
            markerRef.current = marker;
          }
        });
      });
    };
    document.head.appendChild(script);
  }, [lat, lng]);

  const handleSearchPlace = () => {
    const { kakao } = window;
    const ps = new kakao.maps.services.Places();
    ps.keywordSearch(searchQuery, (data, status) => {
      if (status === kakao.maps.services.Status.OK && data.length > 0) {
        const place = data[0];
        const placeLatLng = new kakao.maps.LatLng(place.y, place.x);

        setLat(parseFloat(place.y));
        setLng(parseFloat(place.x));

        const map = mapRef.current;
        map.setCenter(placeLatLng);

        if (placeMarkerRef.current) {
          placeMarkerRef.current.setMap(null);
        }

        const marker = new kakao.maps.Marker({
          map,
          position: placeLatLng,
        });
        placeMarkerRef.current = marker;

        if (markerRef.current) {
          markerRef.current.setMap(null);
        }
        markerRef.current = marker;
      } else {
        alert("검색 결과가 없습니다.");
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !name ||
      !review ||
      !rating ||
      !detail ||
      lat === null ||
      lng === null
    ) {
      alert("모든 항목과 위치를 입력해주세요.");
      return;
    }

    const newData = { name, review, rating, lat, lng, detail };

    if (isEdit) {
      await setDoc(doc(db, "restaurants", id), newData, { merge: true });
      alert("맛집 수정 완료!");
    } else {
      await addRestaurant(newData);
      alert("맛집 등록 완료!");
    }

    navigate("/restaurant/list");
  };

  return (
    <div className="container">
      <h2>{isEdit ? "✏️ 맛집 수정" : "🍜 맛집 등록"}</h2>
      <form onSubmit={handleSubmit}>
        <StarRating rating={rating} setRating={setRating} />
        <input
          type="text"
          placeholder="맛집 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="상세내용을 입력하세요"
          rows={4}
        />
        <textarea
          placeholder="한줄평"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={2}
        />

        {/* 🔍 검색창 */}
        <div style={{ display: "flex", gap: "8px", margin: "10px 0" }}>
          <input
            type="text"
            placeholder="주소 또는 장소명으로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="button" onClick={handleSearchPlace}>
            검색
          </button>
        </div>

        <div
          id="restaurant-map"
          style={{
            width: "100%",
            height: "300px",
            marginTop: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        ></div>

        <p style={{ fontSize: "14px", color: "#555" }}>
          지도에서 위치를 클릭하거나, 주소/장소명으로 검색해 주세요
          {lat && lng && (
            <span>
              {" "}
              → 위도: {lat.toFixed(5)}, 경도: {lng.toFixed(5)}
            </span>
          )}
        </p>
        <button type="submit">{isEdit ? "수정" : "등록"}</button>
      </form>
    </div>
  );
};

export default RestaurantEditor;
