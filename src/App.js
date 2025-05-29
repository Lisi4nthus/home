// src/App.js
import React, { createContext, useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase"; // firebase.js에서 export한 db
import DiaryList from "./components/DiaryList";
import DiaryEditor from "./components/DiaryEditor";
import DiaryView from "./components/DiaryView";
import DiaryEdit from "./components/DiaryEdit";

export const DiaryStateContext = createContext();
export const DiaryDispatchContext = createContext();

function App() {
  const [data, setData] = useState([]);
  // ✅ 1. Firestore에서 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, "diary"));
      const diaryData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(diaryData);
    };

    fetchData();
  }, []);

  // ✅ 2. Firestore에 새로운 문서 추가
  const onCreate = async ({ date, content }) => {
    const newDoc = {
      date,
      content,
    };
    const docRef = await addDoc(collection(db, "diary"), newDoc);
    setData([{ id: docRef.id, ...newDoc }, ...data]);
  };

  // ✅ 3. Firestore 문서 업데이트
  const onEdit = async (targetId, newDate, newContent) => {
    const diaryRef = doc(db, "diary", targetId);
    await updateDoc(diaryRef, {
      date: newDate,
      content: newContent,
    });
    setData(
      data.map((item) =>
        item.id === targetId
          ? { ...item, date: newDate, content: newContent }
          : item
      )
    );
  };

  // ✅ 4. Firestore 문서 삭제
  const onRemove = async (targetId) => {
    await deleteDoc(doc(db, "diary", targetId));
    setData(data.filter((item) => item.id !== targetId));
  };

  return (
    <DiaryStateContext.Provider value={data}>
      <DiaryDispatchContext.Provider value={{ onCreate, onEdit, onRemove }}>
        <Routes>
          <Route path="/" element={<DiaryList />} />
          <Route path="/new" element={<DiaryEditor />} />
          <Route path="/view/:id" element={<DiaryView />} />
          <Route path="/edit/:id" element={<DiaryEdit />} />
        </Routes>
      </DiaryDispatchContext.Provider>
    </DiaryStateContext.Provider>
  );
}

export default App;
