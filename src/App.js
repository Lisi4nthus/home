// src/App.js
import "./App.css";
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
import { db } from "./firebase/firebase";
import DiaryList from "./components/DiaryList";
import DiaryEditor from "./components/DiaryEditor";
import DiaryView from "./components/DiaryView";
import DiaryEdit from "./components/DiaryEdit";

import RestaurantEditor from "./components/RestaurantEditor";
import RestaurantList from "./components/RestaurantList";

import MapPage from "./pages/MapPage";

export const DiaryStateContext = createContext();
export const DiaryDispatchContext = createContext();

export const RestaurantStateContext = createContext();
export const RestaurantDispatchContext = createContext();

function App() {
  // 다이어리 데이터
  const [diaryData, setDiaryData] = useState([]);
  // 맛집 데이터
  const [restaurantData, setRestaurantData] = useState([]);

  // === 다이어리 데이터 불러오기
  useEffect(() => {
    const fetchDiary = async () => {
      const snapshot = await getDocs(collection(db, "diary"));
      const diaryData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDiaryData(diaryData);
    };
    fetchDiary();
  }, []);

  // === 맛집 데이터 불러오기
  useEffect(() => {
    const fetchRestaurants = async () => {
      const snapshot = await getDocs(collection(db, "restaurants"));
      const restaurants = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRestaurantData(restaurants);
    };
    fetchRestaurants();
  }, []);

  // === 다이어리 생성
  const onDiaryCreate = async ({ date, content }) => {
    const newDoc = { date, content };
    const docRef = await addDoc(collection(db, "diary"), newDoc);
    setDiaryData([{ id: docRef.id, ...newDoc }, ...diaryData]);
  };

  // === 다이어리 수정
  const onDiaryEdit = async (targetId, newDate, newContent) => {
    const diaryRef = doc(db, "diary", targetId);
    await updateDoc(diaryRef, { date: newDate, content: newContent });
    setDiaryData(
      diaryData.map((item) =>
        item.id === targetId
          ? { ...item, date: newDate, content: newContent }
          : item
      )
    );
  };

  // === 다이어리 삭제
  const onDiaryRemove = async (targetId) => {
    await deleteDoc(doc(db, "diary", targetId));
    setDiaryData(diaryData.filter((item) => item.id !== targetId));
  };

  // === 맛집 생성
  const onRestaurantCreate = async ({ name, review, rating, lat, lng }) => {
    const newDoc = { name, review, rating, lat, lng };
    const docRef = await addDoc(collection(db, "restaurants"), newDoc);
    setRestaurantData([{ id: docRef.id, ...newDoc }, ...restaurantData]);
  };

  // === 맛집 수정
  const onRestaurantEdit = async (targetId, newData) => {
    const restaurantRef = doc(db, "restaurants", targetId);
    await updateDoc(restaurantRef, newData);
    setRestaurantData(
      restaurantData.map((item) =>
        item.id === targetId ? { ...item, ...newData } : item
      )
    );
  };

  // === 맛집 삭제
  const onRestaurantRemove = async (targetId) => {
    await deleteDoc(doc(db, "restaurants", targetId));
    setRestaurantData(restaurantData.filter((item) => item.id !== targetId));
  };

  return (
    <DiaryStateContext.Provider value={diaryData}>
      <DiaryDispatchContext.Provider
        value={{
          onCreate: onDiaryCreate,
          onEdit: onDiaryEdit,
          onRemove: onDiaryRemove,
        }}
      >
        <RestaurantStateContext.Provider value={restaurantData}>
          <RestaurantDispatchContext.Provider
            value={{
              onCreate: onRestaurantCreate,
              onEdit: onRestaurantEdit,
              onRemove: onRestaurantRemove,
            }}
          >
            <Routes>
              {/* Diary Routes */}
              <Route path="/" element={<DiaryList />} />
              <Route path="/new" element={<DiaryEditor />} />
              <Route path="/view/:id" element={<DiaryView />} />
              <Route path="/edit/:id" element={<DiaryEdit />} />

              {/* Restaurant Routes */}
              <Route path="/restaurant/new" element={<RestaurantEditor />} />
              <Route path="/restaurant/list" element={<RestaurantList />} />
              <Route
                path="/restaurant/edit/:id"
                element={<RestaurantEditor />}
              />
              {/* Map Route */}
              <Route path="/map" element={<MapPage />} />
            </Routes>
          </RestaurantDispatchContext.Provider>
        </RestaurantStateContext.Provider>
      </DiaryDispatchContext.Provider>
    </DiaryStateContext.Provider>
  );
}

export default App;
