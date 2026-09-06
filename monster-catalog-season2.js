import { renderCharacterArt } from './character-art.js';
export const SEASON2_WORLDS = Object.freeze([
  { id: "cookie", name: "쿠키 마을", icon: "🍪", color: "#f59e0b", accent: "#fff7ed", hint: "준비 스테이지와 꾸준한 복습으로 만나요." },
  { id: "cloud", name: "구름 숲", icon: "☁️", color: "#38bdf8", accent: "#eff6ff", hint: "블록과 빈칸 문제를 풀며 구름길을 밝혀요." },
  { id: "ocean", name: "바다 왕국", icon: "🌊", color: "#0891b2", accent: "#ecfeff", hint: "동물과 자연 단어를 익히면 가까워져요." },
  { id: "dinosaur", name: "공룡 계곡", icon: "🦖", color: "#65a30d", accent: "#f7fee7", hint: "긴 단어에 도전하면 발자국이 나타나요." },
  { id: "magic", name: "마법 학교", icon: "🪄", color: "#8b5cf6", accent: "#f5f3ff", hint: "연속 정답과 보스전에서 마법을 모아요." },
  { id: "robot", name: "로봇 도시", icon: "🤖", color: "#475569", accent: "#f8fafc", hint: "쓰기 모드에서 정확한 철자를 입력해요." },
  { id: "space", name: "우주 정거장", icon: "🚀", color: "#4f46e5", accent: "#eef2ff", hint: "여러 카테고리를 골고루 탐험해요." },
  { id: "ice", name: "얼음 설원", icon: "❄️", color: "#0284c7", accent: "#f0f9ff", hint: "며칠 뒤 다시 맞히면 얼음별이 빛나요." },
  { id: "jungle", name: "정글 유적", icon: "🌿", color: "#15803d", accent: "#f0fdf4", hint: "어려웠던 단어를 다시 맞혀 길을 찾아요." },
  { id: "ghost", name: "유령 도서관", icon: "📚", color: "#6d28d9", accent: "#faf5ff", hint: "예전에 틀린 단어를 복습하면 책장이 열려요." },
  { id: "dragon", name: "드래곤 화산", icon: "🌋", color: "#dc2626", accent: "#fff7ed", hint: "보스전을 완주하고 진화 재료를 모아요." },
  { id: "star", name: "별빛 궁전", icon: "🌟", color: "#d97706", accent: "#fffbeb", hint: "높은 숙련도와 세계 완성 별을 모아요." }
]);

export const SEASON2_SPECIES = Object.freeze([
  { id: "crumb_bear", worldId: "cookie", rarity: "common", shape: "bear", names: ["포실곰", "쿠키배달곰", "쿠키수호곰"], personality: "차분하고 든든해요", favoriteMode: "choice", story: "쿠키 부스러기로 단어 지도를 그리는 마을 안내자예요.", palette: ["#f6c177", "#8b5e34", "#fff7ed"], prop: "cookie" },
  { id: "jam_mouse", worldId: "cookie", rarity: "rare", shape: "mouse", names: ["잼쥐", "베리달리", "잼도사"], personality: "빠르고 재치 있어요", favoriteMode: "block", story: "글자 블록을 잼 병에 차곡차곡 모아요.", palette: ["#fb7185", "#7f1d1d", "#fff1f2"], prop: "jar" },
  { id: "mist_fox", worldId: "cloud", rarity: "rare", shape: "fox", names: ["몽실여우", "바람꼬리", "하늘꼬리"], personality: "호기심이 많아요", favoriteMode: "blank", story: "구름 사이에 숨은 철자를 꼬리로 찾아내요.", palette: ["#dbeafe", "#2563eb", "#ffffff"], prop: "cloud" },
  { id: "breeze_owl", worldId: "cloud", rarity: "hero", shape: "owl", names: ["솔솔부엉", "바람부엉", "날개현자"], personality: "생각이 깊어요", favoriteMode: "type", story: "바람 소리를 듣고 정확한 철자를 기록해요.", palette: ["#a5f3fc", "#0e7490", "#ecfeff"], prop: "scroll" },
  { id: "bubble_fin", worldId: "ocean", rarity: "common", shape: "fish", names: ["버블핀", "물결핀", "바다날개"], personality: "밝고 씩씩해요", favoriteMode: "blank", story: "물방울 속에 새로운 단어를 담아 헤엄쳐요.", palette: ["#22d3ee", "#0e7490", "#cffafe"], prop: "bubble" },
  { id: "coral_otter", worldId: "ocean", rarity: "rare", shape: "otter", names: ["조개달", "산호달", "물빛현자"], personality: "친절하고 꼼꼼해요", favoriteMode: "choice", story: "조개껍데기에 뜻과 철자를 함께 새겨요.", palette: ["#fdba74", "#9a3412", "#fff7ed"], prop: "shell" },
  { id: "sprout_rex", worldId: "dinosaur", rarity: "common", shape: "trex", names: ["새싹렉스", "숲길렉스", "숲왕렉스"], personality: "용감하고 끈기 있어요", favoriteMode: "type", story: "긴 단어도 한 글자씩 끝까지 따라가요.", palette: ["#84cc16", "#365314", "#ecfccb"], prop: "leaf" },
  { id: "stone_trike", worldId: "dinosaur", rarity: "hero", shape: "trike", names: ["콩뿔", "돌빛뿔", "산맥뿔"], personality: "묵묵하고 믿음직해요", favoriteMode: "block", story: "세 개의 뿔로 글자 블록을 제자리에 밀어요.", palette: ["#a3e635", "#3f6212", "#f7fee7"], prop: "rune" },
  { id: "rune_cat", worldId: "magic", rarity: "rare", shape: "cat", names: ["룬냥", "마법냥", "별룬냥"], personality: "장난스럽고 영리해요", favoriteMode: "blank", story: "빈칸에 꼭 맞는 룬 문자를 찾아내요.", palette: ["#c4b5fd", "#6d28d9", "#faf5ff"], prop: "wand" },
  { id: "page_golem", worldId: "magic", rarity: "legend", shape: "book", names: ["책콩", "책걸음", "큰책현자"], personality: "말수는 적지만 박식해요", favoriteMode: "type", story: "공부한 단어가 쌓일수록 책장이 갑옷으로 변해요.", palette: ["#fef3c7", "#92400e", "#fffbeb"], prop: "quill" },
  { id: "gear_bot", worldId: "robot", rarity: "common", shape: "robot", names: ["톱니봇", "척척봇", "든든기어"], personality: "정확하고 성실해요", favoriteMode: "type", story: "철자를 정확히 입력할 때마다 회로가 반짝여요.", palette: ["#94a3b8", "#334155", "#e2e8f0"], prop: "gear" },
  { id: "drill_mole", worldId: "robot", rarity: "hero", shape: "mole", names: ["볼트두더", "굴착두더", "땅속대장"], personality: "집중력이 강해요", favoriteMode: "block", story: "헷갈리는 철자 아래를 파고들어 차이를 찾아요.", palette: ["#fbbf24", "#78350f", "#fef3c7"], prop: "drill" },
  { id: "orbit_bunny", worldId: "space", rarity: "rare", shape: "rabbit", names: ["별토끼", "궤도토끼", "은하토끼"], personality: "상상력이 풍부해요", favoriteMode: "choice", story: "카테고리 사이를 궤도처럼 오가며 단어를 모아요.", palette: ["#a5b4fc", "#3730a3", "#eef2ff"], prop: "planet" },
  { id: "comet_hound", worldId: "space", rarity: "legend", shape: "hound", names: ["꼬리별멍", "혜성멍", "별길수호멍"], personality: "활기차고 충성스러워요", favoriteMode: "type", story: "정답 콤보가 이어지면 혜성 꼬리가 길어져요.", palette: ["#818cf8", "#312e81", "#fef08a"], prop: "comet" },
  { id: "frost_seal", worldId: "ice", rarity: "common", shape: "seal", names: ["눈송이물범", "눈바람물범", "오로라코"], personality: "느긋하고 다정해요", favoriteMode: "blank", story: "며칠 뒤 기억한 단어를 얼음별로 보관해요.", palette: ["#e0f2fe", "#0369a1", "#ffffff"], prop: "snowflake" },
  { id: "glacier_yak", worldId: "ice", rarity: "hero", shape: "yak", names: ["솜뿔", "빙하솜뿔", "눈산지킴이"], personality: "참을성이 많아요", favoriteMode: "type", story: "천천히 반복해도 끝까지 기억을 지켜줘요.", palette: ["#bae6fd", "#075985", "#f8fafc"], prop: "ice" },
  { id: "ruin_gecko", worldId: "jungle", rarity: "rare", shape: "gecko", names: ["이끼도마", "유적도마", "숲돌수호자"], personality: "관찰력이 뛰어나요", favoriteMode: "block", story: "틀렸던 철자 흔적을 벽화에서 다시 찾아요.", palette: ["#4ade80", "#166534", "#f0fdf4"], prop: "idol" },
  { id: "whisper_ghost", worldId: "ghost", rarity: "hero", shape: "ghost", names: ["소곤유령", "책장소곤", "기억지기"], personality: "조용하지만 응원을 잘해요", favoriteMode: "choice", story: "오래된 오답 노트에서 다시 볼 단어를 꺼내줘요.", palette: ["#ddd6fe", "#5b21b6", "#faf5ff"], prop: "book" },
  { id: "ember_drake", worldId: "dragon", rarity: "legend", shape: "dragon", names: ["불씨용", "날갯불용", "화산날개"], personality: "도전을 즐겨요", favoriteMode: "boss", story: "보스의 방패를 하나씩 깨며 거대한 날개를 펼쳐요.", palette: ["#fb7185", "#991b1b", "#ffedd5"], prop: "flame" },
  { id: "crown_deer", worldId: "star", rarity: "legend", shape: "deer", names: ["별사슴", "별빛사슴", "별왕관사슴"], personality: "우아하고 따뜻해요", favoriteMode: "type", story: "완전히 기억한 단어가 별자리 왕관으로 이어져요.", palette: ["#fde68a", "#a16207", "#fffbeb"], prop: "star" }
]);

const RARITY_LABELS = Object.freeze({ common: "일반", rare: "희귀", hero: "영웅", legend: "전설" });
const STAGE_LABELS = Object.freeze({ 1: "첫 만남", 2: "성장", 3: "최종 진화" });

export const SEASON2_CATALOG = Object.freeze(SEASON2_SPECIES.flatMap((species) => [1, 2, 3].map((stage) => ({
  id: `s2_${species.worldId}_${species.id}_${stage}`,
  season: 2,
  worldId: species.worldId,
  speciesId: species.id,
  evolutionStage: stage,
  name: species.names[stage - 1],
  rarity: species.rarity,
  rarityLabel: RARITY_LABELS[species.rarity],
  stageLabel: STAGE_LABELS[stage],
  personality: species.personality,
  favoriteMode: species.favoriteMode,
  description: species.story,
  palette: species.palette,
  shape: species.shape,
  prop: species.prop,
  image: `./assets/monsters/season2/${species.worldId}/${species.id}_${stage}.svg`
}))));

export const SEASON2_STARTERS = Object.freeze([
  "s2_cookie_crumb_bear_1",
  "s2_ocean_bubble_fin_1",
  "s2_robot_gear_bot_1"
]);

export function getSeason2World(worldId) {
  return SEASON2_WORLDS.find((world) => world.id === worldId) || SEASON2_WORLDS[0];
}

export function getSeason2Character(characterId) {
  return SEASON2_CATALOG.find((character) => character.id === characterId) || null;
}

export function getSpeciesStages(speciesId) {
  return SEASON2_CATALOG.filter((character) => character.speciesId === speciesId).sort((a, b) => a.evolutionStage - b.evolutionStage);
}

export function getStageOneCharacters(worldId) {
  return SEASON2_CATALOG.filter((character) => character.worldId === worldId && character.evolutionStage === 1);
}

export function renderMonsterSvg(characterOrId, options = {}) {
  const character = typeof characterOrId === "string" ? getSeason2Character(characterOrId) : characterOrId;
  return character ? renderCharacterArt(character, options) : renderFallbackMonsterSvg();
}

export function renderFallbackMonsterSvg() {
  return renderCharacterArt(SEASON2_CATALOG[0], {locked:true,ariaLabel:"캐릭터 이미지를 불러오지 못했어요"});
}
