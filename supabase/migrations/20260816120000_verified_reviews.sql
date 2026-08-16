-- FR Must: 실투숙 인증 리뷰 표시
alter table public.reviews add column verified boolean not null default false;
-- 시드 리뷰 중 신뢰도 80 이상 실사용자 리뷰는 인증 투숙으로 간주 (데모)
update public.reviews set verified = true where reliability >= 80;
