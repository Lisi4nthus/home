import React from 'react';
import './LoadingSpinner.css';

function LoadingSpinner({ size = 'medium', message = '로딩 중...' }) {
  return (
    <div className="loading-container">
      <div className={`spinner spinner-${size}`}>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}

export default LoadingSpinner;