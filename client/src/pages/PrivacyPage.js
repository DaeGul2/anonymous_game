// src/pages/PrivacyPage.js
import React from "react";
import { Box, Typography, Paper } from "@mui/material";

export default function PrivacyPage() {
  return (
    <Box className="appShell" sx={{ pb: 6 }}>
      <Box className="pageHeader">
        <Typography className="pageTitle">📄 개인정보처리방침</Typography>
      </Box>

      {/* 핵심 강조 */}
      <Paper
        className="glassCard section"
        sx={{
          p: 2.5,
          background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.05)) !important",
          border: "1.5px solid rgba(124,58,237,0.2) !important",
        }}
      >
        <Typography sx={{ fontWeight: 950, fontSize: 18, letterSpacing: "-0.03em", mb: 1, color: "#7C3AED" }}>
          🔒 모든 질문과 답변은 100% 익명입니다
        </Typography>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)", lineHeight: 1.7 }}>
          익명게임은 질문과 답변의 <b>텍스트만</b> 수집하며, 누가 작성했는지는 저장하지 않습니다.
          게임이 종료된 후 보관되는 데이터에는 작성자 정보가 포함되지 않으며,
          어떤 방법으로도 특정 사용자와 연결할 수 없습니다.
        </Typography>
      </Paper>

      <Paper className="glassCard section" sx={{ p: 2.5 }}>
        <Section title="1. 수집하는 개인정보 항목">
          <Li>Google 계정 정보: 이메일, 이름, 프로필 사진 (로그인 시)</Li>
          <Li>게임 데이터: 질문 텍스트, 답변 텍스트 (작성자 정보 미포함)</Li>
          <Li>자동 수집 정보: 쿠키, 세션 ID</Li>
        </Section>

        <Section title="2. 수집 목적">
          <Li>Google 계정: 로그인 및 본인 식별, 재접속 시 세션 유지</Li>
          <Li>게임 데이터: 서비스 품질 개선 및 AI 질문 추천 고도화 (익명 텍스트만 활용)</Li>
          <Li>쿠키/세션: 로그인 상태 유지</Li>
        </Section>

        <Section title="3. 보유 및 파기">
          <Li>Google 계정 정보: 회원 탈퇴 시 즉시 파기</Li>
          <Li>게임 데이터 (익명 텍스트): 서비스 개선 목적으로 보관, 작성자 식별 불가</Li>
          <Li>쿠키/세션: 브라우저 종료 또는 30일 후 만료</Li>
        </Section>

        <Section title="4. 제3자 제공">
          <Li>Google LLC: OAuth 인증 처리</Li>
          <Li>Google AdSense: 광고 제공 및 최적화 (쿠키 기반, 향후 적용)</Li>
          <Li>위 외 제3자에게 개인정보를 제공하지 않습니다</Li>
        </Section>

        <Section title="5. 이용자의 권리">
          <Li>개인정보 열람, 수정, 삭제를 요청할 수 있습니다</Li>
          <Li>로그아웃 또는 계정 삭제를 통해 서비스 이용을 중단할 수 있습니다</Li>
          <Li>문의: min@insabr.kr</Li>
        </Section>

        <Section title="6. 쿠키 사용 안내">
          <Li>로그인 세션 유지를 위해 필수 쿠키를 사용합니다</Li>
          <Li>향후 광고 서비스(Google AdSense) 도입 시 광고 최적화 쿠키가 추가될 수 있습니다</Li>
          <Li>브라우저 설정에서 쿠키를 차단할 수 있으나, 일부 기능이 제한될 수 있습니다</Li>
        </Section>

        <Section title="7. 운영자 정보" last>
          <Li>운영자: 민구원</Li>
          <Li>이메일: min@insabr.kr</Li>
        </Section>

        <Typography sx={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", mt: 3, textAlign: "center" }}>
          시행일: 2025년 2월 27일
        </Typography>
      </Paper>
    </Box>
  );
}

function Section({ title, children, last }) {
  return (
    <Box sx={{ mb: last ? 0 : 2.5 }}>
      <Typography sx={{ fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em", mb: 0.8 }}>
        {title}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>{children}</Box>
    </Box>
  );
}

function Li({ children }) {
  return (
    <Typography sx={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", lineHeight: 1.7, pl: 1.5 }}>
      • {children}
    </Typography>
  );
}
