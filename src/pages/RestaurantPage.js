import React from 'react';
import { Link } from 'react-router-dom';

const RestaurantPage = () => {
  return (
    <div className="container">
      <h2>🍽️ 나의 맛집 관리</h2>
      <p>여기에서 맛집을 관리할 수 있습니다.</p>
      <nav>
        <ul>
          <li><Link to="/restaurant/list">맛집 목록 보기</Link></li>
          <li><Link to="/restaurant/new">새 맛집 추가하기</Link></li>
        </ul>
      </nav>
    </div>
  );
};

export default RestaurantPage;
