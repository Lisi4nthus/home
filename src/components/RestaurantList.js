import React, { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";

const RestaurantList = () => {
  const [restaurants, setRestaurants] = useState([]);
  const navigate = useNavigate();

  const fetchRestaurants = async () => {
    const snapshot = await getDocs(collection(db, "restaurants"));
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setRestaurants(data);
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleDelete = async (id) => {
    const confirmed = window.confirm("정말 삭제하시겠습니까?");
    if (confirmed) {
      await deleteDoc(doc(db, "restaurants", id));
      fetchRestaurants(); // 삭제 후 리스트 갱신
    }
  };

  return (
    <div className="container">
      <h2>📃 맛집 리스트</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr
            style={{
              borderBottom: "2px solid #ccc",
              backgroundColor: "#f9f9f9",
            }}
          >
            <th style={{ padding: "10px" }}>이름</th>
            <th>별점</th>
            <th>한줄평</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {restaurants.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "10px" }}>{r.name}</td>
              <td>{r.rating}⭐</td>
              <td>{r.review}</td>
              <td>
                <button
                  onClick={() => navigate(`/restaurant/edit/${r.id}`)}
                  style={{
                    backgroundColor: "#f0a04e", // ✨ 노랑-주황 중간색
                    color: "white",
                    border: "none",
                    padding: "6px 10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  ✏️ 수정
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  style={{
                    marginLeft: "8px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    padding: "6px 10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  🗑 삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RestaurantList;
