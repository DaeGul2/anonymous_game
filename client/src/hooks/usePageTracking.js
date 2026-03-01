// src/hooks/usePageTracking.js
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useRoomStore } from "../state/useRoomStore";

const PREFIX = "익명게임 - ";
const PAGE_TITLES = {
  "/": `${PREFIX}친구들과 솔직한 익명 Q&A 파티 게임`,
  "/intro": `${PREFIX}게임 소개`,
  "/how-to-play": `${PREFIX}하는 방법`,
  "/privacy": `${PREFIX}개인정보처리방침`,
  "/terms": `${PREFIX}이용약관`,
};

export default function usePageTracking() {
  const location = useLocation();
  const roomTitle = useRoomStore((s) => s.state?.room?.title);

  useEffect(() => {
    const path = location.pathname;
    if (PAGE_TITLES[path]) {
      document.title = PAGE_TITLES[path];
    } else if (path.startsWith("/room/") || path.startsWith("/game/")) {
      document.title = roomTitle ? `${PREFIX}${roomTitle}` : `${PREFIX}게임`;
    } else {
      document.title = PAGE_TITLES["/"];
    }

    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_path: path + location.search,
        page_title: document.title,
      });
    }
  }, [location, roomTitle]);
}
