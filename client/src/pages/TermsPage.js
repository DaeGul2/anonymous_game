// src/pages/TermsPage.js
import React from "react";
import { Box, Typography, Paper, IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function TermsPage() {
  const navigate = useNavigate();
  return (
    <Box className="appShell" sx={{ pb: 6 }}>
      <Box className="pageHeader" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            width: 36, height: 36,
            background: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "12px",
            fontSize: 18,
            "&:hover": { background: "rgba(255,255,255,0.85)" },
          }}
        >
          ←
        </IconButton>
        <Typography className="pageTitle" sx={{ mb: "0 !important" }}>📋 이용약관</Typography>
      </Box>

      <Paper className="glassCard section" sx={{ p: 2.5 }}>
        <Section title="1. 서비스 개요">
          <Li>본 서비스(이하 "익명게임")는 친구들과 익명으로 질문하고 답변하는 실시간 파티 게임입니다.</Li>
          <Li>Google 계정 로그인을 통해 서비스를 이용할 수 있으며, 별도의 회원가입 절차는 없습니다.</Li>
        </Section>

        <Section title="2. 익명성">
          <Li>게임 내 모든 질문과 답변은 철저히 익명으로 진행됩니다.</Li>
          <Li>Google 로그인 정보는 오직 본인 인증 및 재접속 시 세션 복구 목적으로만 사용됩니다.</Li>
          <Li>질문·답변 데이터는 작성자 정보 없이 텍스트만 저장되며, 어떤 방법으로도 특정 사용자와 연결할 수 없습니다.</Li>
        </Section>

        <Section title="3. 이용자의 의무">
          <Li>타인을 비방하거나 혐오를 조장하는 내용을 작성해서는 안 됩니다.</Li>
          <Li>개인정보(실명, 전화번호, 주소 등)를 게임 내에서 공유하지 않도록 주의해야 합니다.</Li>
          <Li>서비스의 정상적인 운영을 방해하는 행위(반복적인 비정상 접속, 자동화 도구 사용 등)를 해서는 안 됩니다.</Li>
          <Li>관련 법령 및 본 약관을 위반하는 행위를 해서는 안 됩니다.</Li>
        </Section>

        <Section title="4. 금지 행위">
          <Li>불법적이거나 사회적으로 부적절한 콘텐츠 작성</Li>
          <Li>타인의 명예를 훼손하거나 사생활을 침해하는 행위</Li>
          <Li>서비스를 이용한 상업적 활동 또는 광고 행위</Li>
          <Li>서비스의 보안을 위협하거나 시스템을 악용하는 행위</Li>
        </Section>

        <Section title="5. 서비스 제공 및 변경">
          <Li>운영자는 서비스의 안정적 제공을 위해 노력하지만, 무중단 운영을 보장하지는 않습니다.</Li>
          <Li>서비스 개선을 위해 기능이 추가, 변경 또는 중단될 수 있습니다.</Li>
          <Li>중대한 변경 사항은 서비스 내 공지를 통해 안내합니다.</Li>
        </Section>

        <Section title="6. 콘텐츠 및 지적재산권">
          <Li>이용자가 작성한 질문·답변은 익명으로 서비스 품질 개선에 활용될 수 있습니다.</Li>
          <Li>서비스의 디자인, 코드, 상표 등 지적재산권은 운영자에게 있습니다.</Li>
        </Section>

        <Section title="7. 면책 조항">
          <Li>이용자가 작성한 콘텐츠에 대한 책임은 해당 이용자에게 있습니다.</Li>
          <Li>운영자는 이용자 간 분쟁에 대해 개입하지 않으며, 이로 인한 손해에 대해 책임지지 않습니다.</Li>
          <Li>서비스 장애, 데이터 손실 등 불가항력으로 인한 손해에 대해 책임지지 않습니다.</Li>
        </Section>

        <Section title="8. 이용 제한">
          <Li>본 약관을 위반한 이용자에 대해 서비스 이용을 제한할 수 있습니다.</Li>
          <Li>제한 사유 및 기간은 위반의 경중에 따라 결정됩니다.</Li>
        </Section>

        <Section title="9. 약관의 변경">
          <Li>본 약관은 서비스 운영 상 필요에 따라 변경될 수 있습니다.</Li>
          <Li>변경된 약관은 서비스 내 게시함으로써 효력이 발생합니다.</Li>
        </Section>

        <Section title="10. 문의" last>
          <Li>운영자: 민구원</Li>
          <Li>이메일: min@insabr.kr</Li>
        </Section>

        <Typography sx={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", mt: 3, textAlign: "center" }}>
          시행일: 2026년 3월 1일
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
