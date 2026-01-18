// src/App.js
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import RoomLobbyPage from "./pages/RoomLobbyPage";
import GamePage from "./pages/GamePage";
import "./App.css";

// 페이지 이동 시 스크롤을 위로(모바일에서 특히 필요)
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // 즉시 점프 대신 자연스럽게. 불편하면 auto로 바꿔도 됨.
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}

// 모바일 viewport 높이(dvh) 대응: iOS 주소창/키보드 흔들림 완화
function ViewportFix() {
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setVH();
    window.addEventListener("resize", setVH);
    window.addEventListener("orientationchange", setVH);
    return () => {
      window.removeEventListener("resize", setVH);
      window.removeEventListener("orientationchange", setVH);
    };
  }, []);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ViewportFix />
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:code" element={<RoomLobbyPage />} />
        <Route path="/game/:code" element={<GamePage />} />

        {/* 혹시 예전 링크/오타 대비 */}
        <Route path="/room" element={<Navigate to="/" replace />} />
        <Route path="/game" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
