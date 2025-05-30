import { db } from "./firebase";
import {
  collection,
  addDoc,
  Timestamp,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

export const addRestaurant = async ({
  name,
  review,
  rating,
  lat,
  lng,
  detail,
}) => {
  try {
    const docRef = await addDoc(collection(db, "restaurants"), {
      name,
      review,
      rating,
      lat,
      lng,
      detail,
      createdAt: Timestamp.now(),
    });
    console.log("맛집이 저장되었습니다. ID:", docRef.id);
  } catch (e) {
    console.error("맛집 저장 실패:", e);
  }
};

export const getRestaurants = async () => {
  const q = query(collection(db, "restaurants"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
