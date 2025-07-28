// src/App.js
import "./App.css";
import React, { createContext, useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom"; // BrowserRouter는 index.js에서 관리
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase/firebase";
import DiaryListPage from "./pages/DiaryListPage";
import DiaryEditor from "./components/DiaryEditor";
import DiaryView from "./components/DiaryView";
import DiaryEdit from "./components/DiaryEdit";

import RestaurantEditor from "./components/RestaurantEditor";
import RestaurantList from "./components/RestaurantList";

import MapPage from "./pages/MapPage";
import Navigation from "./components/Navigation";
import { ToastProvider } from "./contexts/ToastContext";
import { ErrorProvider, useError } from "./contexts/ErrorContext";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardPage from "./pages/DashboardPage";
import { ThemeProvider } from "./contexts/ThemeContext";

export const DiaryStateContext = createContext();
export const DiaryDispatchContext = createContext();

export const RestaurantStateContext = createContext();
export const RestaurantDispatchContext = createContext();

function AppContent() {
  // 다이어리 데이터
  const [diaryData, setDiaryData] = useState([]);
  // 맛집 데이터
  const [restaurantData, setRestaurantData] = useState([]);
  const { safeFirebase } = useError();

  // === 다이어리 데이터 불러오기
  useEffect(() => {
    const fetchDiary = async () => {
      await safeFirebase(
        async () => {
          const snapshot = await getDocs(collection(db, "diary"));
          const diaryData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setDiaryData(diaryData);
        },
        "일기 데이터 로딩",
        { showLoading: true }
      );
    };
    fetchDiary();
  }, [safeFirebase]);

  // === 맛집 데이터 불러오기
  useEffect(() => {
    const fetchRestaurants = async () => {
      await safeFirebase(
        async () => {
          const snapshot = await getDocs(collection(db, "restaurants"));
          const restaurants = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setRestaurantData(restaurants);
        },
        "맛집 데이터 로딩",
        { showLoading: true }
      );
    };
    fetchRestaurants();
  }, [safeFirebase]);

  // === 다이어리 생성
  const onDiaryCreate = async ({ date, content }) => {
    return await safeFirebase(
      async () => {
        const newDoc = { date, content };
        const docRef = await addDoc(collection(db, "diary"), newDoc);
        setDiaryData([{ id: docRef.id, ...newDoc }, ...diaryData]);
        return { id: docRef.id, ...newDoc };
      },
      "일기 저장",
      { showSuccessToast: true, successMessage: "일기가 저장되었습니다." }
    );
  };

  // === 다이어리 수정
  const onDiaryEdit = async (targetId, newDate, newContent) => {
    return await safeFirebase(
      async () => {
        const diaryRef = doc(db, "diary", targetId);
        await updateDoc(diaryRef, { date: newDate, content: newContent });
        setDiaryData(
          diaryData.map((item) =>
            item.id === targetId
              ? { ...item, date: newDate, content: newContent }
              : item
          )
        );
      },
      "일기 수정",
      { showSuccessToast: true, successMessage: "일기가 수정되었습니다." }
    );
  };

  // === 다이어리 삭제
  const onDiaryRemove = async (targetId) => {
    return await safeFirebase(
      async () => {
        await deleteDoc(doc(db, "diary", targetId));
        setDiaryData(diaryData.filter((item) => item.id !== targetId));
      },
      "일기 삭제",
      { showSuccessToast: true, successMessage: "일기가 삭제되었습니다." }
    );
  };

  // === 맛집 생성
  const onRestaurantCreate = async ({ name, review, rating, lat, lng }) => {
    return await safeFirebase(
      async () => {
        const newDoc = { name, review, rating, lat, lng };
        const docRef = await addDoc(collection(db, "restaurants"), newDoc);
        setRestaurantData([{ id: docRef.id, ...newDoc }, ...restaurantData]);
        return { id: docRef.id, ...newDoc };
      },
      "맛집 등록",
      { showSuccessToast: true, successMessage: "맛집이 등록되었습니다." }
    );
  };

  // === 맛집 수정
  const onRestaurantEdit = async (targetId, newData) => {
    return await safeFirebase(
      async () => {
        const restaurantRef = doc(db, "restaurants", targetId);
        await updateDoc(restaurantRef, newData);
        setRestaurantData(
          restaurantData.map((item) =>
            item.id === targetId ? { ...item, ...newData } : item
          )
        );
      },
      "맛집 정보 수정",
      { showSuccessToast: true, successMessage: "맛집 정보가 수정되었습니다." }
    );
  };

  // === 맛집 삭제
  const onRestaurantRemove = async (targetId) => {
    return await safeFirebase(
      async () => {
        await deleteDoc(doc(db, "restaurants", targetId));
        setRestaurantData(
          restaurantData.filter((item) => item.id !== targetId)
        );
      },
      "맛집 삭제",
      { showSuccessToast: true, successMessage: "맛집이 삭제되었습니다." }
    );
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
            <Navigation />
            <Routes>
              {/* Dashboard Route */}
              <Route path="/" element={<DiaryListPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              {/* Diary Routes */}
              <Route path="/diary" element={<DiaryListPage />} />
              <Route path="/new" element={<DiaryEditor />} />
              <Route path="/view/:id" element={<DiaryView />} />
              <Route path="/edit/:id" element={<DiaryEdit />} />
              {/* Restaurant Routes */}
              <Route path="/restaurant/new" element={<RestaurantEditor />} />
              <Route path="/restaurant/list" element={<RestaurantList />} />
              {/* Map Route */}
              <Route path="/map" element={<MapPage />} />
            </Routes>
          </RestaurantDispatchContext.Provider>
        </RestaurantStateContext.Provider>
      </DiaryDispatchContext.Provider>
    </DiaryStateContext.Provider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <ToastProvider>
          <ErrorProvider>
            <AppContent />
          </ErrorProvider>
        </ToastProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
