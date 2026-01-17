// src/App.js
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import RoomLobbyPage from "./pages/RoomLobbyPage";
import GamePage from "./pages/GamePage";
import { useRoomStore } from "./state/useRoomStore";

export default function App() {
  const { initSocket } = useRoomStore();

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:code" element={<RoomLobbyPage />} />
        <Route path="/game/:code" element={<GamePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
