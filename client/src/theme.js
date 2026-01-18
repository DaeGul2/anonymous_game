// src/theme.js
import { createTheme } from "@mui/material/styles";

// Soft pastel + glass UI (mobile-first)
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#8B5CF6" }, // violet
    secondary: { main: "#EC4899" }, // pink
    success: { main: "#22C55E" },
    warning: { main: "#F59E0B" },
    error: { main: "#EF4444" },
    text: {
      primary: "#16161A",
      secondary: "#4B5563",
    },
  },
  shape: {
    borderRadius: 20,
  },
  typography: {
    fontFamily: [
      "ui-sans-serif",
      "system-ui",
      "-apple-system",
      "Segoe UI",
      "Roboto",
      "Apple SD Gothic Neo",
      "Noto Sans KR",
      "sans-serif",
    ].join(","),
    h5: { fontWeight: 900, letterSpacing: "-0.02em" },
    h6: { fontWeight: 900, letterSpacing: "-0.02em" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: { height: "100%" },
        body: {
          height: "100%",
          margin: 0,
          color: "#16161A",
          background:
            "radial-gradient(1200px 600px at 30% 15%, rgba(236,72,153,0.22), transparent 60%)," +
            "radial-gradient(1000px 700px at 75% 35%, rgba(139,92,246,0.22), transparent 60%)," +
            "radial-gradient(900px 600px at 45% 90%, rgba(59,130,246,0.14), transparent 60%)," +
            "linear-gradient(180deg, #F7F3FF 0%, #F5F7FF 40%, #F7F1FF 100%)",
          backgroundAttachment: "fixed",
        },
        "#root": { minHeight: "100%" },
        "*": { boxSizing: "border-box" },
        a: { color: "inherit", textDecoration: "none" },
      },
    },
    MuiContainer: {
      defaultProps: { maxWidth: "sm" }, // 폰 프레임 느낌
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: "rgba(255, 255, 255, 0.62)",
          border: "1px solid rgba(255, 255, 255, 0.55)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow:
            "0 18px 40px rgba(17, 24, 39, 0.08), 0 1px 0 rgba(255,255,255,0.6) inset",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 999,
          textTransform: "none",
          fontWeight: 900,
          letterSpacing: "-0.01em",
          paddingLeft: 16,
          paddingRight: 16,
          minHeight: 42,
        },
        containedPrimary: {
          background:
            "linear-gradient(135deg, rgba(236,72,153,0.92), rgba(139,92,246,0.92))",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: "rgba(255, 255, 255, 0.72)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        },
        notchedOutline: { borderColor: "rgba(255, 255, 255, 0.65)" },
      },
    },
    MuiInputLabel: {
      styleOverrides: { root: { fontWeight: 700 } },
    },
  },
});

export default theme;
