import { useState } from "react";
import { addRestaurant } from "../firebase/restaurantApi";

const RestaurantForm = ({ onAdd }) => {
  const [name, setName] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(0);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addRestaurant({
      name,
      review,
      rating: Number(rating),
      lat: Number(lat),
      lng: Number(lng),
    });
    setName("");
    setReview("");
    setRating(0);
    setLat("");
    setLng("");
    if (onAdd) onAdd();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="가게 이름"
        required
      />
      <input
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="한줄평"
        required
      />
      <input
        type="number"
        value={rating}
        onChange={(e) => setRating(e.target.value)}
        min={0}
        max={5}
        placeholder="별점 (0~5)"
        required
      />
      <input
        type="number"
        value={lat}
        onChange={(e) => setLat(e.target.value)}
        placeholder="위도"
        required
        step="0.000001"
      />
      <input
        type="number"
        value={lng}
        onChange={(e) => setLng(e.target.value)}
        placeholder="경도"
        required
        step="0.000001"
      />
      <button type="submit">저장</button>
    </form>
  );
};

export default RestaurantForm;
