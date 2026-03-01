// src/components/AdBanner.js
import React, { useEffect, useRef } from "react";
import { Box } from "@mui/material";

/**
 * AdSense 배너 컴포넌트.
 * 승인 후 data-ad-client / data-ad-slot을 실제 값으로 교체.
 * 승인 전에는 빈 자리만 확보 (높이 0, 레이아웃에 영향 없음).
 */
export default function AdBanner({ style, className }) {
  const adRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      if (window.adsbygoogle && adRef.current) {
        window.adsbygoogle.push({});
        pushed.current = true;
      }
    } catch (e) {
      // adsbygoogle not loaded yet — ignore
    }
  }, []);

  // AdSense 미승인 상태에서는 아무것도 렌더링하지 않음
  if (!window.adsbygoogle) return null;

  return (
    <Box sx={{ width: "100%", textAlign: "center", overflow: "hidden", ...style }} className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-3929250227887843"
        data-ad-slot="XXXXXXXXXX"
        data-ad-format="auto"
        data-full-width-responsive="true"
        ref={adRef}
      />
    </Box>
  );
}
