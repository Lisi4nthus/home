import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { addRestaurant } from "../../firebase/restaurantApi";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import ConfirmDialog from "../common/ConfirmDialog";
import "./RestaurantEditor.css";

const StarRating = ({ rating, setRating }) => {
  return (
    <div className="star-rating" style={{ display: "flex", gap: "4px", cursor: "pointer" }}>
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
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const mapRef = useRef(null);
  const markerRef = useRef(null);

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
    const initMap = () => {
      const { naver } = window;
      if (!naver || !naver.maps) return;

      const mapOptions = {
        center: new naver.maps.LatLng(lat || 37.5665, lng || 126.978),
        zoom: 15,
      };
      const map = new naver.maps.Map("restaurant-map", mapOptions);
      mapRef.current = map;

      if (lat && lng) {
        markerRef.current = new naver.maps.Marker({
          position: new naver.maps.LatLng(lat, lng),
          map,
        });
      }

      naver.maps.Event.addListener(map, "click", (e) => {
        const { coord } = e;
        setLat(coord.y);
        setLng(coord.x);
        if (markerRef.current) {
          markerRef.current.setPosition(coord);
        } else {
          markerRef.current = new naver.maps.Marker({
            position: coord,
            map,
          });
        }
      });
    };

    if (window.naver && window.naver.maps) {
      initMap();
    } else {
      const mapScript = document.querySelector(
        'script[src*="ncpKeyId"]'
      );
      mapScript.addEventListener("load", initMap);
    }
  }, [lat, lng]);

  const handleSearchPlace = () => {
    if (!searchQuery.trim()) {
      setModalMessage("주소 또는 장소명을 입력해주세요.");
      setShowModal(true);
      return;
    }

    const { naver } = window;
    naver.maps.Service.geocode({ query: searchQuery }, (status, response) => {
      if (status !== naver.maps.Service.Status.OK) {
        return alert("검색 결과가 없습니다.");
      }
      const result = response.v2.addresses[0];
      const point = new naver.maps.Point(result.x, result.y);
      setLat(point.y);
      setLng(point.x);
      mapRef.current.setCenter(point);
      if (markerRef.current) {
        markerRef.current.setPosition(point);
      } else {
        markerRef.current = new naver.maps.Marker({
          position: point,
          map: mapRef.current,
        });
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
    <div className="container restaurant-editor-container">
      <h2>{isEdit ? "✏️ 맛집 수정" : "🍜 맛집 등록"}</h2>
      <form onSubmit={handleSubmit} className="restaurant-editor-form">
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

        <div className="search-container">
          <input
            type="text"
            placeholder="주소 또는 장소명으로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="button" onClick={handleSearchPlace}>
            검색
          </button>
        </div>

        <div id="restaurant-map"></div>

        <p className="location-info">
          지도에서 위치를 클릭하거나, 주소/장소명으로 검색해 주세요
          {lat && lng && (
            <span>
              {" "}
              → 위도: {lat.toFixed(5)}, 경도: {lng.toFixed(5)}
            </span>
          )}
        </p>
        <button type="submit" className="submit-btn">{isEdit ? "수정" : "등록"}</button>
      </form>

      <ConfirmDialog
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        message={modalMessage}
      />
    </div>
  );
};

export default RestaurantEditor;