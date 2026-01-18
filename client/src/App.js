// src/App.js
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import RoomLobbyPage from "./pages/RoomLobbyPage";
import GamePage from "./pages/GamePage";
import "./App.css";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}

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

function GlobalHeader() {
  const src = `${process.env.PUBLIC_URL}/logo.png`;
  return (
    <header className="globalHeader" aria-label="global header">
      <div className="globalHeaderInner">
        <img className="globalLogo" src={src} alt="익명게임" />
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ViewportFix />
      <ScrollToTop />

      <GlobalHeader />
      {/* 헤더 공간 확보: 이게 없어서 겹친 거 */}
      <div className="globalHeaderSpacer" />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:code" element={<RoomLobbyPage />} />
        <Route path="/game/:code" element={<GamePage />} />

        <Route path="/room" element={<Navigate to="/" replace />} />
        <Route path="/game" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
