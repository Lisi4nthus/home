// src/components/DiaryEditor.js
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { DiaryDispatchContext } from "../App";
import "./DiaryEditor.css";

const DiaryEditor = () => {
  const navigate = useNavigate();
  const { onCreate } = useContext(DiaryDispatchContext);

  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10) // 기본 오늘 날짜 세팅
  );
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (content.trim().length < 1) {
      alert("일기 내용을 입력하세요.");
      return;
    }
    onCreate({ date, content });
    navigate("/");
  };

  return (
    <div className="editor-container">
      <h2>새 일기 작성</h2>
      <div className="editor-form">
        <label htmlFor="date">날짜</label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <label htmlFor="content">내용</label>
        <textarea
          id="content"
          rows="10"
          placeholder="오늘 하루는 어땠나요?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="button-group">
          <button className="save-btn" onClick={handleSubmit}>
            저장
          </button>
          <button className="cancel-btn" onClick={() => navigate("/")}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiaryEditor;
