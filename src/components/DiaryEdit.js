// src/components/DiaryEdit.js
import React, { useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DiaryDispatchContext, DiaryStateContext } from "../App";
import "./DiaryEdit.css";

const DiaryEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const diaryList = useContext(DiaryStateContext);
  const { onEdit } = useContext(DiaryDispatchContext);

  const targetDiary = diaryList.find((diary) => diary.id === parseInt(id));

  if (!targetDiary) {
    return (
      <div className="container">
        <p>해당 일기를 찾을 수 없습니다.</p>
        <button onClick={() => navigate("/")}>메인으로 돌아가기</button>
      </div>
    );
  }

  const { date, content } = targetDiary;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newContent = e.target.content.value;
    if (newContent.length < 1) {
      alert("내용을 입력해주세요.");
      return;
    }
    onEdit(parseInt(id), new Date(date).getTime(), newContent); // ✅ 수정
    navigate(`/view/${id}`);
  };

  return (
    <div className="container">
      <h2>✏️ 일기 수정</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>작성 날짜</label>
          <input
            type="text"
            value={new Date(date).toLocaleDateString()}
            disabled
          />
        </div>
        <div className="form-group">
          <label>내용</label>
          <textarea name="content" defaultValue={content} />
        </div>
        <div className="button-group">
          <button type="submit" className="save-btn">
            수정 완료
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate(`/view/${id}`)}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
};

export default DiaryEdit;
