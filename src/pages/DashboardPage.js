import React, { useEffect, useState, useContext } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { DiaryStateContext } from "../App"; // DiaryStateContext 임포트
import "./DashboardPage.css";

const WEATHER_API_KEY = process.env.REACT_APP_WEATHER_API_KEY; // .env에 저장 필요
const JTBC_RSS_URL =
  "https://api.allorigins.win/get?url=https://fs.jtbc.co.kr/RSS/newsflash.xml";

const DashboardPage = () => {
  const { theme } = useTheme();
  const diaryData = useContext(DiaryStateContext); // diaryData 가져오기

  const [weather, setWeather] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [news, setNews] = useState([]);
  const [quote, setQuote] = useState(null); // 오늘의 명언 상태 추가
  const [todos, setTodos] = useState([]); // 할 일 목록 상태 추가
  const [newTodo, setNewTodo] = useState(""); // 새 할 일 입력 상태 추가

  // 일기 통계 계산
  const totalDiaryEntries = diaryData.length;
  const lastEntryDate =
    diaryData.length > 0
      ? new Date(
          Math.max(...diaryData.map((entry) => new Date(entry.date)))
        ).toLocaleDateString()
      : "N/A";

  // 날씨 이모지 함수 추가
  function getWeatherEmoji(weather, humidity, wind) {
    if (!weather) return "🌡️";
    const main = weather.weather[0].main;
    if (main === "Clear") return "☀️";
    if (main === "Rain") return "🌧️";
    if (main === "Clouds") return "☁️";
    if (main === "Snow") return "❄️";
    if (weather.main.humidity > 80) return "💧";
    if (weather.wind.speed > 10) return "💨";
    return "🌡️";
  }

  const [loading, setLoading] = useState({
    weather: true,
    exchange: true,
    news: true,
    quote: true, // 명언 로딩 상태 추가
  });
  const [error, setError] = useState({
    weather: null,
    exchange: null,
    news: null,
    quote: null, // 명언 에러 상태 추가
  });

  // 할 일 목록 로컬 스토리지에서 불러오기 및 저장
  useEffect(() => {
    const storedTodos = localStorage.getItem("todos");
    if (storedTodos) {
      setTodos(JSON.parse(storedTodos));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  // 할 일 추가
  const addTodo = () => {
    if (newTodo.trim() !== "") {
      setTodos([...todos, { id: Date.now(), text: newTodo.trim() }]);
      setNewTodo("");
    }
  };

  // 할 일 삭제
  const removeTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  useEffect(() => {
    // 날씨 정보 가져오기
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=Seoul&appid=${WEATHER_API_KEY}&units=metric&lang=kr`
        );
        if (!res.ok) throw new Error("날씨 API 오류");
        const data = await res.json();
        setWeather(data);
      } catch (e) {
        setError((prev) => ({ ...prev, weather: e.message }));
      } finally {
        setLoading((prev) => ({ ...prev, weather: false }));
      }
    };
    if (WEATHER_API_KEY) fetchWeather();
    else setLoading((prev) => ({ ...prev, weather: false }));

    // 환율 정보 가져오기 (Frankfurter API)
    const fetchExchange = async () => {
      try {
        const res = await fetch(
          "https://api.frankfurter.app/latest?from=USD&to=KRW"
        );
        if (!res.ok) throw new Error("환율 API 오류");
        const data = await res.json();
        if (data && data.rates && typeof data.rates.KRW === "number") {
          setExchangeRate(data.rates.KRW);
        } else {
          throw new Error("환율 데이터가 올바르지 않습니다.");
        }
      } catch (e) {
        setError((prev) => ({ ...prev, exchange: e.message }));
      } finally {
        setLoading((prev) => ({ ...prev, exchange: false }));
      }
    };
    fetchExchange();

    // 뉴스 헤드라인 가져오기 (JTBC 속보 RSS, allorigins 프록시)
    const fetchNews = async () => {
      try {
        const res = await fetch(JTBC_RSS_URL);
        const data = await res.json();
        const xmlText = data.contents;
        const parser = new window.DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const items = xmlDoc.querySelectorAll("item");
        const newsList = Array.from(items)
          .slice(0, 5)
          .map((item) => ({
            title: item.querySelector("title")?.textContent,
            link: item.querySelector("link")?.textContent,
          }));
        setNews(newsList);
      } catch (e) {
        setError((prev) => ({ ...prev, news: e.message }));
      } finally {
        setLoading((prev) => ({ ...prev, news: false }));
      }
    };
    fetchNews();

    // 오늘의 명언 가져오기
    const fetchQuote = async () => {
      try {
        const res = await fetch(
          `https://api.allorigins.win/get?url=${encodeURIComponent("https://zenquotes.io/api/today")}`
        );
        if (!res.ok) throw new Error("명언 API 오류");
        const data = await res.json();
        const quoteData = JSON.parse(data.contents);
        if (quoteData && quoteData.length > 0) {
          setQuote(quoteData[0]); // 첫 번째 명언 사용
        } else {
          throw new Error("명언 데이터를 찾을 수 없습니다.");
        }
      } catch (e) {
        setError((prev) => ({ ...prev, quote: e.message }));
      } finally {
        setLoading((prev) => ({ ...prev, quote: false }));
      }
    };
    fetchQuote();
  }, []);

  return (
    <div className={`dashboard-page ${theme}`}>
      <h1>대시보드</h1>
      <div className="dashboard-cards">
        {/* 날씨 카드 */}
        <section className="dashboard-card">
          <h2>오늘의 날씨 (서울)</h2>
          {loading.weather ? (
            <div>날씨 정보를 불러오는 중...</div>
          ) : error.weather ? (
            <div style={{ color: "red" }}>{error.weather} (API Key 필요)</div>
          ) : weather ? (
            <div>
              <span style={{ fontSize: "2rem" }}>
                {getWeatherEmoji(
                  weather,
                  weather.main.humidity,
                  weather.wind.speed
                )}
              </span>{" "}
              <b>{weather.weather[0].description}</b> / {weather.main.temp}°C
              <br />
              💧습도: {weather.main.humidity}% / 💨풍속: {weather.wind.speed}m/s
            </div>
          ) : (
            <div>날씨 정보를 표시할 수 없습니다.</div>
          )}
        </section>

        {/* 환율 카드 */}
        <section className="dashboard-card">
          <h2>환율 정보 (USD/KRW)</h2>
          {loading.exchange ? (
            <div>환율 정보를 불러오는 중...</div>
          ) : error.exchange ? (
            <div style={{ color: "red" }}>{error.exchange}</div>
          ) : exchangeRate ? (
            <div>
              <span style={{ fontSize: "1.5rem" }}>💵</span> 1 USD ={" "}
              <b>{exchangeRate.toLocaleString()}</b> KRW
            </div>
          ) : (
            <div>환율 정보를 표시할 수 없습니다.</div>
          )}
        </section>

        {/* 뉴스 카드 */}
        <section className="dashboard-card">
          <h2>뉴스 헤드라인</h2>
          {loading.news ? (
            <div>뉴스 정보를 불러오는 중...</div>
          ) : error.news ? (
            <div style={{ color: "red" }}>{error.news}</div>
          ) : news && news.length > 0 ? (
            <ul>
              {news.map((item, idx) => (
                <li key={idx}>
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div>뉴스 정보를 표시할 수 없습니다.</div>
          )}
        </section>

        {/* 일기 통계 요약 카드 */}
        <section className="dashboard-card">
          <h2>일기 통계 요약</h2>
          <div>
            <p>
              총 일기 수: <b>{totalDiaryEntries}</b>개
            </p>
            <p>
              마지막 작성일: <b>{lastEntryDate}</b>
            </p>
          </div>
        </section>

        {/* 오늘의 명언 카드 */}
        <section className="dashboard-card">
          <h2>오늘의 명언</h2>
          {loading.quote ? (
            <div>명언을 불러오는 중...</div>
          ) : error.quote ? (
            <div style={{ color: "red" }}>{error.quote}</div>
          ) : quote ? (
            <div>
              <p style={{ fontStyle: "italic", marginBottom: "10px" }}>
                "{quote.q}"
              </p>
              <p style={{ textAlign: "right", fontWeight: "bold" }}>
                - {quote.a}
              </p>
            </div>
          ) : (
            <div>명언을 표시할 수 없습니다.</div>
          )}
        </section>

        {/* 빠른 메모/할 일 목록 카드 */}
        <section className="dashboard-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h2>빠른 메모 / 할 일</h2>
            <button onClick={addTodo} style={{ padding: '8px 12px' }}>추가</button>
          </div>
          <div>
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addTodo();
                }
              }}
              placeholder="새 할 일을 입력하세요..."
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
            <ul style={{ listStyle: 'none', padding: '0', marginTop: '10px' }}>
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "5px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <span>{todo.text}</span>
                  <button
                    onClick={() => removeTodo(todo.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "red",
                      cursor: "pointer",
                    }}
                  >
                    X
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
