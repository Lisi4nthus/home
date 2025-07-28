import React from "react";
import { Link, useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useError } from "../contexts/ErrorContext";
import "./Navigation.css";

function Navigation() {
  const location = useLocation();
  const { isLoading } = useError();

  const navItems = [
    { path: "/", icon: "📝", label: "일기" },
    { path: "/restaurant/list", icon: "🍽️", label: "맛집" },
    { path: "/map", icon: "🗺️", label: "지도" },
    { path: "/new", icon: "✏️", label: "작성" },
  ];

  return (
    <nav className="global-nav">
      <div className="nav-container">
        <Link to="/dashboard" className="nav-logo">
          <span className="logo-icon">📚</span>
          <span className="logo-text">MY DIARY</span>
          {isLoading && <span className="loading-indicator">⏳</span>}
        </Link>

        <div className="nav-items">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
          <ThemeToggle />
        </div>
        <div className="nav-extra">{/* 오른쪽 상단 날씨/환율 정보 삭제 */}</div>
      </div>
    </nav>
  );
}

export default Navigation;
