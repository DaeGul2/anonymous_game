-- 비밀번호 방 기능 추가
-- 실행: mysql -u root -p anonymous_game < migrations/20260228_add_room_password.sql

ALTER TABLE rooms ADD COLUMN has_password TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE rooms ADD COLUMN password_hash VARCHAR(255) NULL;
