import React, { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import "./RestaurantList.css";

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
      fetchRestaurants();
    }
  };

  return (
    <div className="container">
      <div className="list-header">
        <h2>📃 맛집 리스트</h2>
        <button className="add-btn" onClick={() => navigate("/restaurant/new")}>
          맛집 등록
        </button>
      </div>
      <table className="restaurant-table">
        <thead>
          <tr>
            <th>이름</th>
            <th>별점</th>
            <th>한줄평</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {restaurants.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.rating}⭐</td>
              <td>{r.review}</td>
              <td className="actions">
                <button
                  className="edit-btn"
                  onClick={() => navigate(`/restaurant/edit/${r.id}`)}
                >
                  ✏️ 수정
                </button>
                <button className="delete-btn" onClick={() => handleDelete(r.id)}>
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
