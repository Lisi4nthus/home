import React, { useContext, useState, useMemo } from "react";
import { DiaryStateContext } from "../App";
import { useNavigate } from "react-router-dom";
import "./DiaryList.css";

const DiaryList = () => {
  const diaryList = useContext(DiaryStateContext);
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState("");
  const [sortType, setSortType] = useState("latest");

  const onChangeSearch = (e) => setSearchText(e.target.value);
  const onChangeSort = () => {
    setSortType((prev) => (prev === "latest" ? "oldest" : "latest"));
  };

  const filtered = useMemo(() => {
    const filteredList = diaryList.filter((item) =>
      item.content.toLowerCase().includes(searchText.toLowerCase())
    );
    return filteredList.sort((a, b) =>
      sortType === "latest"
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [diaryList, searchText, sortType]);

  return (
    <div className="container">
      <div className="header-row">
        <h2>☑️ 내 일기 목록</h2>
        <button className="sort-button" onClick={onChangeSort}>
          {sortType === "latest" ? "최신순" : "오래된순"}
        </button>
      </div>

      <input
        className="search-input"
        type="text"
        placeholder="검색어를 입력하세요"
        value={searchText}
        onChange={onChangeSearch}
      />

      {filtered.length === 0 ? (
        <>
          <p>작성된 일기가 없습니다.</p>
          <button onClick={() => navigate("/new")}>새 일기 작성하기</button>
        </>
      ) : (
        <>
          {filtered.map(({ id, date, content }) => (
            <div
              key={id}
              className="diary-preview"
              onClick={() => navigate(`/view/${id}`)}
            >
              <div className="diary-date">
                {new Date(date).toLocaleDateString()}
              </div>
              <div className="diary-content">{content.slice(0, 40)}...</div>
            </div>
          ))}
          <button
            onClick={() => navigate("/new")}
            style={{ marginTop: "20px" }}
          >
            새 일기 작성하기
          </button>
        </>
      )}
    </div>
  );
};

export default DiaryList;
