// src/components/AdBanner.js
import React, { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";

const AD_CLIENT = "ca-pub-3929250227887843";
const AD_SLOT = "";  // TODO: AdSense 승인 후 슬롯 ID 입력

// AdSense 스크립트를 동적으로 로드 (한 번만)
let scriptLoaded = false;
function loadAdSenseScript() {
  if (scriptLoaded) return;
  if (document.querySelector(`script[src*="adsbygoogle.js?client=${AD_CLIENT}"]`)) {
    scriptLoaded = true;
    return;
  }
  const s = document.createElement("script");
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`;
  s.async = true;
  s.crossOrigin = "anonymous";
  document.head.appendChild(s);
  scriptLoaded = true;
}

export default function AdBanner({ style, className }) {
  const adRef = useRef(null);
  const pushed = useRef(false);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    if (!AD_SLOT) return;
    // 콘텐츠가 있는 페이지에서만 스크립트 로드
    loadAdSenseScript();
  }, []);

  useEffect(() => {
    if (!AD_SLOT || pushed.current) return;
    try {
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
        pushed.current = true;
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
        data-ad-client={AD_CLIENT}
        data-ad-slot={AD_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
        ref={adRef}
      />
    </Box>
  );
}
