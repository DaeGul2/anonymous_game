// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import HomePage from "./pages/HomePage";
import RoomLobbyPage from "./pages/RoomLobbyPage";
import GamePage from "./pages/GamePage";
import LoginPage from "./pages/LoginPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import IntroPage from "./pages/IntroPage";
import HowToPlayPage from "./pages/HowToPlayPage";
import NotFoundPage from "./pages/NotFoundPage";
import Footer from "./components/Footer";
import usePageTracking from "./hooks/usePageTracking";
import { useRoomStore } from "./state/useRoomStore";
import "./App.css";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}

function PageTracker() {
  usePageTracking();
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
  const navigate = useNavigate();

  return (
    <header className="globalHeader" aria-label="global header">
      <div className="globalHeaderInner">
        <img
          className="globalLogo"
          src={src}
          alt="익명게임"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        />
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
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 미로그인 상태에서 현재 경로 저장
  useEffect(() => {
    if (!authLoading && !user) {
      const path = location.pathname + location.search;
      if (path && path !== "/") {
        sessionStorage.setItem("redirectAfterLogin", path);
      }
    }
  }, [authLoading, user, location]);

  // 로그인 성공 후 저장된 경로로 복원
  useEffect(() => {
    if (user) {
      const saved = sessionStorage.getItem("redirectAfterLogin");
      if (saved) {
        sessionStorage.removeItem("redirectAfterLogin");
        navigate(saved, { replace: true });
      }
    }
  }, [user, navigate]);

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

function ReconnectOverlay() {
  const { socketReady, state } = useRoomStore();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!socketReady && state?.room) {
      const t = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(t);
    }
    setShow(false);
  }, [socketReady, state]);

  if (!show) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 2500,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2.5,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <CircularProgress size={36} sx={{ color: "#fff" }} />
      <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 16, letterSpacing: "-0.02em" }}>
        다시 연결 중...
      </Typography>
      <Typography sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: 12 }}>
        잠시만 기다려주세요
      </Typography>
    </Box>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ViewportFix />
      <ScrollToTop />
      <PageTracker />

      <GlobalHeader />
      <div className="globalHeaderSpacer" />

      <Routes>
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/intro" element={<IntroPage />} />
        <Route path="/how-to-play" element={<HowToPlayPage />} />
        <Route path="*" element={
          <AuthGate>
            <ReconnectOverlay />
            <Routes>
              <Route path="/"           element={<HomePage />} />
              <Route path="/room/:code" element={<RoomLobbyPage />} />
              <Route path="/game/:code" element={<GamePage />} />
              <Route path="/room"       element={<Navigate to="/" replace />} />
              <Route path="/game"       element={<Navigate to="/" replace />} />
              <Route path="*"           element={<NotFoundPage />} />
            </Routes>
          </AuthGate>
        } />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}
