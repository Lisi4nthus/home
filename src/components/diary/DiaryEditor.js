// src/components/DiaryEditor.js
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { DiaryDispatchContext } from "../../App";
import { useToast } from "../../contexts/ToastContext";
import LoadingSpinner from "../common/LoadingSpinner";
import "./DiaryEditor.css";

const DiaryEditor = () => {
  const navigate = useNavigate();
  const { onCreate } = useContext(DiaryDispatchContext);
  const toast = useToast();

  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10) // 기본 오늘 날짜 세팅
  );
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (content.trim().length < 1) {
      toast.error("일기 내용을 입력하세요.");
      return;
    }
    
    try {
      setIsLoading(true);
      await onCreate({ date, content });
      navigate("/");
    } catch (error) {
      // 에러는 이미 ErrorContext에서 처리됨
    } finally {
      setIsLoading(false);
    }
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
          <button 
            className="save-btn" 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size="small" message="" /> : "저장"}
          </button>
          <button 
            className="cancel-btn" 
            onClick={() => navigate("/")}
            disabled={isLoading}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiaryEditor;
