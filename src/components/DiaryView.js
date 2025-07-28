// src/components/DiaryView.js
import React, { useContext, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DiaryStateContext, DiaryDispatchContext } from "../App";
import ConfirmDialog from "./ConfirmDialog";
import "./DiaryView.css";

const DiaryView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const diaryList = useContext(DiaryStateContext);
  const { onRemove } = useContext(DiaryDispatchContext);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const targetDiary = diaryList.find((diary) => diary.id === id);

  if (!targetDiary) {
    return (
      <div className="container">
        <p>해당 일기를 찾을 수 없습니다.</p>
        <button onClick={() => navigate("/")}>메인으로 돌아가기</button>
      </div>
    );
  }

  const { date, content } = targetDiary;

  const handleRemove = async () => {
    try {
      await onRemove(id);
      navigate("/");
    } catch (error) {
      // 에러는 이미 ErrorContext에서 처리됨
    }
    setShowDeleteDialog(false);
  };

  return (
    <div className="container">
      <h2>📖 일기 상세</h2>
      <div className="view-section">
        <label>작성 날짜</label>
        <div>{new Date(date).toLocaleDateString()}</div>
      </div>
      <div className="view-section">
        <label>내용</label>
        <div className="view-content">{content}</div>
      </div>
      <div className="button-group">
        <button className="edit-btn" onClick={() => navigate(`/edit/${id}`)}>
          수정하기
        </button>
        <button
          className="delete-btn"
          onClick={() => setShowDeleteDialog(true)}
        >
          삭제하기
        </button>
        <button className="back-btn" onClick={() => navigate("/")}>
          목록으로
        </button>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="일기 삭제"
        message="정말로 이 일기를 삭제하시겠습니까? 삭제된 일기는 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        type="danger"
        onConfirm={handleRemove}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
};

export default DiaryView;
