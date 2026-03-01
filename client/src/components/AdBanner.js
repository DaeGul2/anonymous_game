// src/components/AdBanner.js
import React, { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";

// 실제 광고 슬롯 ID로 교체하면 광고 노출 시작
const AD_SLOT = "";  // TODO: AdSense 승인 후 슬롯 ID 입력

export default function AdBanner({ style, className }) {
  const adRef = useRef(null);
  const pushed = useRef(false);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    if (!AD_SLOT || pushed.current) return;
    try {
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
        pushed.current = true;
        // 광고가 실제로 채워졌는지 확인
        const timer = setTimeout(() => {
          if (adRef.current && adRef.current.offsetHeight > 0) {
            setFilled(true);
          }
        }, 1500);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // 슬롯 ID 없거나 광고 로드 안 됐으면 완전히 숨김
  if (!AD_SLOT) return null;

  return (
    <Box
      sx={{
        width: "100%", textAlign: "center", overflow: "hidden",
        display: filled ? "block" : "none",
        ...style,
      }}
      className={className}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-3929250227887843"
        data-ad-slot={AD_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
        ref={adRef}
      />
    </Box>
  );
}
