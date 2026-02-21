// src/App.js
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Box, Button, CircularProgress } from "@mui/material";
import HomePage from "./pages/HomePage";
import RoomLobbyPage from "./pages/RoomLobbyPage";
import GamePage from "./pages/GamePage";
import LoginPage from "./pages/LoginPage";
import { useRoomStore } from "./state/useRoomStore";
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
  const { user, logout } = useRoomStore();

  return (
    <header className="globalHeader" aria-label="global header">
      <div className="globalHeaderInner">
        <img className="globalLogo" src={src} alt="익명게임" />
        {user && (
          <Button
            size="small"
            onClick={logout}
            sx={{
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 12,
              px: 1.6,
              py: 0.5,
              minHeight: 32,
              background: "rgba(255,255,255,0.55)",
              border: "1px solid rgba(124,58,237,0.20)",
              color: "var(--text-2)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
              transition: "all 0.15s ease",
              "&:hover": {
                background: "rgba(255,255,255,0.80)",
                borderColor: "rgba(124,58,237,0.35)",
              },
              "&:active": { transform: "scale(0.95)" },
              pointerEvents: "auto",
            }}
          >
            로그아웃
          </Button>
        )}
      </div>
    </header>
  );
}

function AuthGate({ children }) {
  const { user, authLoading, fetchUser } = useRoomStore();

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authLoading) {
    return (
      <Box
        sx={{
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          minHeight: "100dvh", gap: 2,
        }}
      >
        <Box
          sx={{
            width: 56, height: 56, borderRadius: "20px",
            background: "linear-gradient(135deg, #7C3AED, #EC4899)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, boxShadow: "0 6px 24px rgba(124,58,237,0.35)",
            animation: "pulseBeat 1.2s ease-in-out infinite",
          }}
        >
          🎭
        </Box>
        <CircularProgress size={20} sx={{ color: "var(--c-primary)", opacity: 0.6 }} />
      </Box>
    );
  }

  if (!user) return <LoginPage />;

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ViewportFix />
      <ScrollToTop />

      <GlobalHeader />
      <div className="globalHeaderSpacer" />

      <AuthGate>
        <Routes>
          <Route path="/"           element={<HomePage />} />
          <Route path="/room/:code" element={<RoomLobbyPage />} />
          <Route path="/game/:code" element={<GamePage />} />
          <Route path="/room"       element={<Navigate to="/" replace />} />
          <Route path="/game"       element={<Navigate to="/" replace />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </AuthGate>
    </BrowserRouter>
  );
}
