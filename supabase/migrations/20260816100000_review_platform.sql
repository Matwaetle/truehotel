-- TRUE REVIEW 플랫폼 스키마
create table public.users (
  id uuid primary key default gen_random_uuid(),
  nickname text not null unique,
  bio text not null default '',
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  platform text not null default '',
  product text not null,
  title text not null,
  content text not null,
  stars int not null check (stars between 1 and 5),
  reliability int not null default 50 check (reliability between 0 and 100),
  created_at timestamptz not null default now()
);
create index reviews_product_idx on public.reviews using gin (to_tsvector('simple', product));
create index reviews_user_idx on public.reviews (user_id);

-- 신뢰(즐겨찾기) 관계: truster는 로컬 프로필 닉네임
create table public.trusts (
  truster text not null,
  trusted_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (truster, trusted_user_id)
);

alter table public.users enable row level security;
alter table public.reviews enable row level security;
alter table public.trusts enable row level security;
create policy "read users" on public.users for select to anon using (true);
create policy "read reviews" on public.reviews for select to anon using (true);
-- trusts는 서버(service_role)만 접근

-- 시드: 사용자 (신뢰도 높은 실사용자 + 봇 의심 계정)
insert into public.users (nickname, bio) values
  ('박서준', '출장 잦은 직장인. 호텔은 침구와 방음부터 봅니다.'),
  ('이수아', '신혼여행 다녀온 지 1년. 솔직 후기만 남겨요.'),
  ('최유리', '가성비 중심. 조식 퀄리티에 진심입니다.'),
  ('김도현', '모든 것이 완벽했습니다. 최고의 선택. 강력 추천합니다.'),
  ('정하은', '인생이 바뀌는 경험을 선물하는 리뷰어.'),
  ('트래블마스터77', '전 세계 호텔 전문 리뷰. 프리미엄 경험 공유.');

-- 시드: 호텔 리뷰 (페르소나: 신혼여행 호텔 찾기)
insert into public.reviews (user_id, platform, product, title, content, stars, reliability, created_at) values
  ((select id from users where nickname='박서준'), '호텔스컴바인', '시그니엘 서울', '고층 뷰는 확실한데 방음이 아쉬움', '76층 묵었습니다. 야경은 압도적인데 복도 소음이 새벽에 좀 들렸어요. 침구는 최상급. 신혼여행이면 코너룸 추천합니다.', 4, 95, now() - interval '2 hours'),
  ((select id from users where nickname='이수아'), '호텔스컴바인', '시그니엘 서울', '신혼여행으로 2박 했어요', '스파 예약이 밀려서 체크인 날엔 못 갔던 게 유일한 아쉬움. 웰컴 케이크 챙겨주셨고 직원분들이 과하지 않게 친절해요.', 5, 92, now() - interval '5 hours'),
  ((select id from users where nickname='김도현'), '호텔스컴바인', '시그니엘 서울', '완벽한 호텔, 인생 최고의 경험', '모든 것이 완벽했습니다. 이보다 더 좋을 수 없습니다. 무조건 예약하세요. 강력히 추천합니다. 최고입니다.', 5, 12, now() - interval '3 hours'),
  ((select id from users where nickname='트래블마스터77'), '호텔스컴바인', '시그니엘 서울', '프리미엄의 정석, 강력 추천', '세계적 수준의 서비스와 시설. 완벽한 위치와 완벽한 뷰. 특별한 날을 위한 완벽한 선택입니다.', 5, 8, now() - interval '1 hours'),
  ((select id from users where nickname='최유리'), '호텔스컴바인', '신라호텔 서울', '조식이 값을 합니다', '어반아일랜드 때문에 갔는데 조식 뷔페가 예상을 뛰어넘었어요. 룸 컨디션은 리모델링 전 층이라 약간 연식이 느껴집니다.', 4, 89, now() - interval '1 day'),
  ((select id from users where nickname='이수아'), '배달의민족', '신라호텔 망고빙수', '비싸지만 한 번은 먹어볼 만', '얼음이 정말 곱고 망고가 아낌없이 들어있어요. 둘이서 하나면 충분합니다.', 5, 91, now() - interval '4 hours'),
  ((select id from users where nickname='정하은'), '호텔스컴바인', '신라호텔 서울', '이 호텔을 선택하고 인생이 바뀌었습니다', '환상적입니다. 꿈만 같았습니다. 모두에게 추천합니다. 다시 태어나도 여기입니다.', 5, 15, now() - interval '6 hours'),
  ((select id from users where nickname='박서준'), '호텔스컴바인', '파르나스 제주', '풀빌라 대신 이거면 충분', '인피니티풀 개장 직후라 사람이 적었고, 오션뷰 객실 어메니티도 알찼습니다. 셔틀 배차 간격만 참고하세요.', 5, 94, now() - interval '2 days'),
  ((select id from users where nickname='최유리'), '쿠팡', '무선 이어폰', '가격 대비 훌륭한 선택', '노이즈 캔슬링이 이 가격대에서 기대 이상입니다. 통화 품질도 준수해요.', 4, 87, now() - interval '1 day'),
  ((select id from users where nickname='박서준'), '쿠팡', '맥북 프로 M3', '실사용 2주 후기', '발열도 적고 배터리도 하루종일 갑니다. 영상 편집용으로 샀는데 팬 소리 들을 일이 거의 없네요.', 5, 96, now() - interval '2 hours');

-- 시드: 기본 신뢰 관계 (데모 프로필 '성우')
insert into public.trusts (truster, trusted_user_id) values
  ('성우', (select id from users where nickname='박서준')),
  ('성우', (select id from users where nickname='이수아'));
