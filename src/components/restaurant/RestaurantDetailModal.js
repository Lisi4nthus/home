import React from "react";

function RestaurantDetailModal({ restaurant, onClose }) {
  if (!restaurant) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()} // 모달 내 클릭 이벤트 전파 방지
      >
        <button className="modal-close-btn" onClick={onClose}></button>
        <h2 className="modal-restaurant-name">{restaurant.name}</h2>
        <div className="modal-rating">⭐ {restaurant.rating}점</div>
        <div className="modal-review">{restaurant.review}</div>
      </div>
    </div>
  );
}

export default RestaurantDetailModal;
