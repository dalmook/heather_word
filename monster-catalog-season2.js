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
  { id: "crumb_bear", worldId: "cookie", rarity: "common", shape: "bear", names: ["포실곰", "쿠키가드", "크럼블킹"], personality: "차분하고 든든해요", favoriteMode: "choice", story: "쿠키 부스러기로 단어 지도를 그리는 마을 안내자예요.", palette: ["#f6c177", "#8b5e34", "#fff7ed"], prop: "cookie" },
  { id: "jam_mouse", worldId: "cookie", rarity: "rare", shape: "mouse", names: ["잼쥐", "베리러너", "잼마스터"], personality: "빠르고 재치 있어요", favoriteMode: "block", story: "글자 블록을 잼 병에 차곡차곡 모아요.", palette: ["#fb7185", "#7f1d1d", "#fff1f2"], prop: "jar" },
  { id: "mist_fox", worldId: "cloud", rarity: "rare", shape: "fox", names: ["몽실여우", "바람여우", "스카이테일"], personality: "호기심이 많아요", favoriteMode: "blank", story: "구름 사이에 숨은 철자를 꼬리로 찾아내요.", palette: ["#dbeafe", "#2563eb", "#ffffff"], prop: "cloud" },
  { id: "breeze_owl", worldId: "cloud", rarity: "hero", shape: "owl", names: ["솔솔부엉", "윈드위저드", "템페스트오울"], personality: "생각이 깊어요", favoriteMode: "type", story: "바람 소리를 듣고 정확한 철자를 기록해요.", palette: ["#a5f3fc", "#0e7490", "#ecfeff"], prop: "scroll" },
  { id: "bubble_fin", worldId: "ocean", rarity: "common", shape: "fish", names: ["버블핀", "아쿠아핀", "오션피닉스"], personality: "밝고 씩씩해요", favoriteMode: "blank", story: "물방울 속에 새로운 단어를 담아 헤엄쳐요.", palette: ["#22d3ee", "#0e7490", "#cffafe"], prop: "bubble" },
  { id: "coral_otter", worldId: "ocean", rarity: "rare", shape: "otter", names: ["조개달", "코랄다이버", "리프세이지"], personality: "친절하고 꼼꼼해요", favoriteMode: "choice", story: "조개껍데기에 뜻과 철자를 함께 새겨요.", palette: ["#fdba74", "#9a3412", "#fff7ed"], prop: "shell" },
  { id: "sprout_rex", worldId: "dinosaur", rarity: "common", shape: "trex", names: ["새싹렉스", "정글렉스", "킹티라노"], personality: "용감하고 끈기 있어요", favoriteMode: "type", story: "긴 단어도 한 글자씩 끝까지 따라가요.", palette: ["#84cc16", "#365314", "#ecfccb"], prop: "leaf" },
  { id: "stone_trike", worldId: "dinosaur", rarity: "hero", shape: "trike", names: ["콩뿔", "룬트리케라", "에인션트혼"], personality: "묵묵하고 믿음직해요", favoriteMode: "block", story: "세 개의 뿔로 글자 블록을 제자리에 밀어요.", palette: ["#a3e635", "#3f6212", "#f7fee7"], prop: "rune" },
  { id: "rune_cat", worldId: "magic", rarity: "rare", shape: "cat", names: ["룬냥", "스펠캣", "아케인링스"], personality: "장난스럽고 영리해요", favoriteMode: "blank", story: "빈칸에 꼭 맞는 룬 문자를 찾아내요.", palette: ["#c4b5fd", "#6d28d9", "#faf5ff"], prop: "wand" },
  { id: "page_golem", worldId: "magic", rarity: "legend", shape: "book", names: ["책콩", "페이지골렘", "그랜드렉시콘"], personality: "말수는 적지만 박식해요", favoriteMode: "type", story: "공부한 단어가 쌓일수록 책장이 갑옷으로 변해요.", palette: ["#fef3c7", "#92400e", "#fffbeb"], prop: "quill" },
  { id: "gear_bot", worldId: "robot", rarity: "common", shape: "robot", names: ["톱니봇", "기어가디언", "메가스펠봇"], personality: "정확하고 성실해요", favoriteMode: "type", story: "철자를 정확히 입력할 때마다 회로가 반짝여요.", palette: ["#94a3b8", "#334155", "#e2e8f0"], prop: "gear" },
  { id: "drill_mole", worldId: "robot", rarity: "hero", shape: "mole", names: ["볼트두더", "드릴러너", "코어브레이커"], personality: "집중력이 강해요", favoriteMode: "block", story: "헷갈리는 철자 아래를 파고들어 차이를 찾아요.", palette: ["#fbbf24", "#78350f", "#fef3c7"], prop: "drill" },
  { id: "orbit_bunny", worldId: "space", rarity: "rare", shape: "rabbit", names: ["별토끼", "코스믹버니", "갤럭시래빗"], personality: "상상력이 풍부해요", favoriteMode: "choice", story: "카테고리 사이를 궤도처럼 오가며 단어를 모아요.", palette: ["#a5b4fc", "#3730a3", "#eef2ff"], prop: "planet" },
  { id: "comet_hound", worldId: "space", rarity: "legend", shape: "hound", names: ["꼬리별멍", "코멧하운드", "노바센티널"], personality: "활기차고 충성스러워요", favoriteMode: "type", story: "정답 콤보가 이어지면 혜성 꼬리가 길어져요.", palette: ["#818cf8", "#312e81", "#fef08a"], prop: "comet" },
  { id: "frost_seal", worldId: "ice", rarity: "common", shape: "seal", names: ["눈송이물범", "프로스트씰", "오로라월러스"], personality: "느긋하고 다정해요", favoriteMode: "blank", story: "며칠 뒤 기억한 단어를 얼음별로 보관해요.", palette: ["#e0f2fe", "#0369a1", "#ffffff"], prop: "snowflake" },
  { id: "glacier_yak", worldId: "ice", rarity: "hero", shape: "yak", names: ["솜뿔", "글레이셔야크", "폴라워든"], personality: "참을성이 많아요", favoriteMode: "type", story: "천천히 반복해도 끝까지 기억을 지켜줘요.", palette: ["#bae6fd", "#075985", "#f8fafc"], prop: "ice" },
  { id: "ruin_gecko", worldId: "jungle", rarity: "rare", shape: "gecko", names: ["이끼도마", "루인게코", "템플카멜레온"], personality: "관찰력이 뛰어나요", favoriteMode: "block", story: "틀렸던 철자 흔적을 벽화에서 다시 찾아요.", palette: ["#4ade80", "#166534", "#f0fdf4"], prop: "idol" },
  { id: "whisper_ghost", worldId: "ghost", rarity: "hero", shape: "ghost", names: ["소곤유령", "북위스퍼", "아카이브팬텀"], personality: "조용하지만 응원을 잘해요", favoriteMode: "choice", story: "오래된 오답 노트에서 다시 볼 단어를 꺼내줘요.", palette: ["#ddd6fe", "#5b21b6", "#faf5ff"], prop: "book" },
  { id: "ember_drake", worldId: "dragon", rarity: "legend", shape: "dragon", names: ["불씨용", "엠버드레이크", "볼케이노와이번"], personality: "도전을 즐겨요", favoriteMode: "boss", story: "보스의 방패를 하나씩 깨며 거대한 날개를 펼쳐요.", palette: ["#fb7185", "#991b1b", "#ffedd5"], prop: "flame" },
  { id: "crown_deer", worldId: "star", rarity: "legend", shape: "deer", names: ["별사슴", "셀레스티얼디어", "코로나스타그"], personality: "우아하고 따뜻해요", favoriteMode: "type", story: "완전히 기억한 단어가 별자리 왕관으로 이어져요.", palette: ["#fde68a", "#a16207", "#fffbeb"], prop: "star" }
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

function face(eyeY = 99, mouthY = 121) {
  return `<circle cx="99" cy="${eyeY}" r="6" fill="#172033"/><circle cx="141" cy="${eyeY}" r="6" fill="#172033"/><path d="M106 ${mouthY} Q120 ${mouthY + 10} 134 ${mouthY}" fill="none" stroke="#172033" stroke-width="5" stroke-linecap="round"/>`;
}

function propSvg(prop, color) {
  const props = {
    cookie: `<circle cx="177" cy="147" r="24" fill="#f5c26b" stroke="#8b5e34" stroke-width="5"/><circle cx="168" cy="139" r="4" fill="#7c2d12"/><circle cx="184" cy="151" r="4" fill="#7c2d12"/><circle cx="172" cy="159" r="3" fill="#7c2d12"/>`,
    jar: `<path d="M157 128 h39 l-4 55 h-31z" fill="#fda4af" stroke="#7f1d1d" stroke-width="5"/><path d="M155 126 h43" stroke="#7f1d1d" stroke-width="8"/>`,
    cloud: `<path d="M155 166c0-15 13-26 27-22 5-13 26-12 31 2 17-2 24 22 7 30h-51c-8 0-14-4-14-10z" fill="#fff" stroke="${color}" stroke-width="5"/>`,
    scroll: `<path d="M161 128h36v55h-36c8-9 8-46 0-55z" fill="#fef3c7" stroke="#92400e" stroke-width="5"/><path d="M168 143h21M168 156h21M168 169h15" stroke="#92400e" stroke-width="3"/>`,
    bubble: `<circle cx="181" cy="151" r="26" fill="#cffafe" fill-opacity=".7" stroke="#0e7490" stroke-width="5"/><circle cx="173" cy="141" r="7" fill="#fff" fill-opacity=".85"/>`,
    shell: `<path d="M158 176c0-30 44-46 59-10-13 16-48 21-59 10z" fill="#fed7aa" stroke="#9a3412" stroke-width="5"/><path d="M177 158v24M191 158v22M164 166l44 8" stroke="#9a3412" stroke-width="3"/>`,
    leaf: `<path d="M163 178c-8-35 28-55 52-47-1 31-21 52-52 47z" fill="#4ade80" stroke="#166534" stroke-width="5"/><path d="M169 171l34-30" stroke="#166534" stroke-width="4"/>`,
    rune: `<path d="M180 125l28 28-28 28-28-28z" fill="#d9f99d" stroke="#3f6212" stroke-width="5"/><path d="M168 154h24M180 142v24" stroke="#3f6212" stroke-width="5"/>`,
    wand: `<path d="M158 181l43-58" stroke="#6d28d9" stroke-width="8" stroke-linecap="round"/><path d="M204 112l5 13 14 1-11 9 3 14-12-7-12 7 3-14-11-9 14-1z" fill="#fde047" stroke="#a16207" stroke-width="3"/>`,
    quill: `<path d="M157 184c16-50 35-62 58-67-1 28-18 51-50 61" fill="#fef3c7" stroke="#92400e" stroke-width="5"/><path d="M165 178l42-51" stroke="#92400e" stroke-width="4"/>`,
    gear: `<g transform="translate(181 151)"><circle r="25" fill="#cbd5e1" stroke="#334155" stroke-width="5"/><circle r="9" fill="#fff" stroke="#334155" stroke-width="4"/>${Array.from({length:8},(_,i)=>`<rect x="-5" y="-35" width="10" height="14" rx="2" fill="#64748b" transform="rotate(${i*45})"/>`).join("")}</g>`,
    drill: `<path d="M158 143h24v39h-24z" fill="#fbbf24" stroke="#78350f" stroke-width="5"/><path d="M182 143l36 20-36 19z" fill="#d97706" stroke="#78350f" stroke-width="5"/><path d="M190 153l-5 20M202 159l-5 19" stroke="#fef3c7" stroke-width="4"/>`,
    planet: `<circle cx="184" cy="151" r="24" fill="#818cf8" stroke="#312e81" stroke-width="5"/><ellipse cx="184" cy="151" rx="39" ry="12" fill="none" stroke="#fef08a" stroke-width="6" transform="rotate(-15 184 151)"/>`,
    comet: `<path d="M159 176c20-49 40-54 58-44-2 22-20 43-58 44z" fill="#fde047" stroke="#a16207" stroke-width="5"/><path d="M155 169l-27 14M159 155l-31 1M169 140l-25-16" stroke="#818cf8" stroke-width="7" stroke-linecap="round"/>`,
    snowflake: `<g transform="translate(184 151)" stroke="#0369a1" stroke-width="5" stroke-linecap="round"><path d="M0-31V31M-27-16L27 16M-27 16L27-16"/><path d="M0-31l-8 9M0-31l8 9M0 31l-8-9M0 31l8-9"/></g>`,
    ice: `<path d="M181 118l30 33-30 38-30-38z" fill="#bae6fd" stroke="#075985" stroke-width="5"/><path d="M181 127l-8 24 8 29 8-29z" fill="#fff" fill-opacity=".8"/>`,
    idol: `<path d="M158 183v-52l23-17 27 17v52z" fill="#a3e635" stroke="#166534" stroke-width="5"/><circle cx="176" cy="146" r="5" fill="#166534"/><circle cx="194" cy="146" r="5" fill="#166534"/><path d="M174 164h22" stroke="#166534" stroke-width="5"/>`,
    book: `<path d="M151 132c14-8 29-8 43 0v52c-14-8-29-8-43 0z" fill="#faf5ff" stroke="#5b21b6" stroke-width="5"/><path d="M194 132c14-8 29-8 43 0v52c-14-8-29-8-43 0z" fill="#ede9fe" stroke="#5b21b6" stroke-width="5"/><path d="M194 132v52" stroke="#5b21b6" stroke-width="4"/>`,
    flame: `<path d="M184 190c-31-17-26-45-4-65-1 17 10 19 10 31 11-11 14-25 10-39 31 27 34 60-16 73z" fill="#fb7185" stroke="#991b1b" stroke-width="5"/><path d="M184 181c-13-9-9-22 0-31 0 8 8 10 8 19 0 6-3 10-8 12z" fill="#fde047"/>`,
    star: `<path d="M184 116l10 23 25 2-19 16 6 25-22-13-22 13 6-25-19-16 25-2z" fill="#fde68a" stroke="#a16207" stroke-width="5"/>`
  };
  return props[prop] || "";
}

function baseShape(shape, p, s) {
  const c1 = p[0], c2 = p[1], c3 = p[2];
  const shapes = {
    bear: `<circle cx="75" cy="70" r="30" fill="${c1}" stroke="${c2}" stroke-width="6"/><circle cx="165" cy="70" r="30" fill="${c1}" stroke="${c2}" stroke-width="6"/><ellipse cx="120" cy="121" rx="72" ry="77" fill="${c1}" stroke="${c2}" stroke-width="7"/><ellipse cx="120" cy="125" rx="32" ry="26" fill="${c3}"/>${face(105,130)}`,
    mouse: `<circle cx="70" cy="67" r="34" fill="${c1}" stroke="${c2}" stroke-width="6"/><circle cx="170" cy="67" r="34" fill="${c1}" stroke="${c2}" stroke-width="6"/><path d="M73 97Q120 54 167 97L158 181Q120 210 82 181z" fill="${c1}" stroke="${c2}" stroke-width="7"/><path d="M120 117l-10 11h20z" fill="${c2}"/>${face(102,142)}<path d="M77 129l-32-8M79 142l-34 4M163 129l32-8M161 142l34 4" stroke="${c2}" stroke-width="4"/>`,
    fox: `<path d="M55 93L66 31l50 43M185 93l-11-62-50 43" fill="${c1}" stroke="${c2}" stroke-width="7" stroke-linejoin="round"/><path d="M58 95Q120 54 182 95l-22 83q-40 35-80 0z" fill="${c1}" stroke="${c2}" stroke-width="7"/><path d="M120 113l-15 22h30z" fill="${c3}"/>${face(105,151)}<path d="M78 170Q43 181 55 207q44 5 65-28" fill="${c1}" stroke="${c2}" stroke-width="7"/>`,
    owl: `<path d="M52 91q15-55 68-25 53-30 68 25v78q-68 58-136 0z" fill="${c1}" stroke="${c2}" stroke-width="7"/><circle cx="91" cy="110" r="30" fill="${c3}" stroke="${c2}" stroke-width="5"/><circle cx="149" cy="110" r="30" fill="${c3}" stroke="${c2}" stroke-width="5"/><circle cx="91" cy="110" r="8" fill="#172033"/><circle cx="149" cy="110" r="8" fill="#172033"/><path d="M120 118l-11 17h22z" fill="${c2}"/><path d="M72 167l-35 22M168 167l35 22" stroke="${c2}" stroke-width="9" stroke-linecap="round"/>`,
    fish: `<path d="M46 128q54-69 123-22l43-39-5 58 5 58-43-39q-69 47-123-16z" fill="${c1}" stroke="${c2}" stroke-width="7" stroke-linejoin="round"/><circle cx="92" cy="112" r="8" fill="#172033"/><path d="M92 146q18 13 36 0" fill="none" stroke="#172033" stroke-width="5" stroke-linecap="round"/><path d="M127 89l18-32 20 41M127 167l18 32 20-41" fill="${c3}" stroke="${c2}" stroke-width="5"/>`,
    otter: `<ellipse cx="120" cy="128" rx="62" ry="78" fill="${c1}" stroke="${c2}" stroke-width="7"/><circle cx="79" cy="68" r="22" fill="${c1}" stroke="${c2}" stroke-width="6"/><circle cx="161" cy="68" r="22" fill="${c1}" stroke="${c2}" stroke-width="6"/><ellipse cx="120" cy="132" rx="34" ry="42" fill="${c3}"/>${face(98,126)}<path d="M65 146q-34 35-1 56M175 146q34 35 1 56" fill="none" stroke="${c2}" stroke-width="12" stroke-linecap="round"/>`,
    trex: `<path d="M54 92q52-56 114-13 32 22 12 57l31 34-41-3q-17 43-65 41l-9-35-39 18 14-45Q39 119 54 92z" fill="${c1}" stroke="${c2}" stroke-width="7"/><circle cx="126" cy="91" r="8" fill="#172033"/><path d="M140 116l-25 9 29 9" fill="${c3}" stroke="${c2}" stroke-width="4"/><path d="M79 191l-8 27M139 198l9 22" stroke="${c2}" stroke-width="12" stroke-linecap="round"/>`,
    trike: `<path d="M46 117l33-39 12-47 27 43h28l27-43 7 51 24 35-22 70q-62 39-124 0z" fill="${c1}" stroke="${c2}" stroke-width="7" stroke-linejoin="round"/><path d="M120 73V24l18 54" fill="${c3}" stroke="${c2}" stroke-width="6"/><circle cx="91" cy="120" r="7" fill="#172033"/><circle cx="149" cy="120" r="7" fill="#172033"/><path d="M104 153q16 10 32 0" fill="none" stroke="#172033" stroke-width="5"/>`,
    cat: `<path d="M58 102l5-66 47 35h20l47-35 5 66-17 82q-45 33-90 0z" fill="${c1}" stroke="${c2}" stroke-width="7"/><path d="M120 121l-10 10h20z" fill="${c2}"/>${face(104,145)}<path d="M75 135l-35-7M77 148l-38 6M165 135l35-7M163 148l38 6" stroke="${c2}" stroke-width="4"/>`,
    book: `<path d="M48 68q36-20 72 3v124q-36-23-72-3z" fill="${c1}" stroke="${c2}" stroke-width="7"/><path d="M120 71q36-23 72-3v124q-36-20-72 3z" fill="${c3}" stroke="${c2}" stroke-width="7"/><path d="M120 71v124" stroke="${c2}" stroke-width="6"/><circle cx="88" cy="120" r="7" fill="#172033"/><circle cx="152" cy="120" r="7" fill="#172033"/><path d="M103 147q17 12 34 0" fill="none" stroke="#172033" stroke-width="5"/>`,
    robot: `<rect x="55" y="62" width="130" height="125" rx="28" fill="${c1}" stroke="${c2}" stroke-width="7"/><path d="M120 62V32M106 32h28" stroke="${c2}" stroke-width="7"/><rect x="78" y="92" width="84" height="60" rx="18" fill="${c3}" stroke="${c2}" stroke-width="5"/><circle cx="98" cy="118" r="8" fill="#172033"/><circle cx="142" cy="118" r="8" fill="#172033"/><path d="M104 137h32" stroke="#172033" stroke-width="5"/><path d="M55 103H28v55h27M185 103h27v55h-27" fill="${c1}" stroke="${c2}" stroke-width="7"/>`,
    mole: `<ellipse cx="120" cy="133" rx="68" ry="67" fill="${c1}" stroke="${c2}" stroke-width="7"/><path d="M65 89l-28-35 45 13M175 89l28-35-45 13" fill="${c3}" stroke="${c2}" stroke-width="6"/><path d="M120 122l-17 15h34z" fill="${c2}"/><circle cx="92" cy="110" r="5" fill="#172033"/><circle cx="148" cy="110" r="5" fill="#172033"/><path d="M86 151l-48 18M154 151l48 18" stroke="${c2}" stroke-width="10" stroke-linecap="round"/>`,
    rabbit: `<ellipse cx="86" cy="48" rx="23" ry="48" fill="${c1}" stroke="${c2}" stroke-width="7" transform="rotate(-9 86 48)"/><ellipse cx="154" cy="48" rx="23" ry="48" fill="${c1}" stroke="${c2}" stroke-width="7" transform="rotate(9 154 48)"/><ellipse cx="120" cy="133" rx="65" ry="73" fill="${c1}" stroke="${c2}" stroke-width="7"/>${face(113,145)}<circle cx="120" cy="130" r="7" fill="${c2}"/>`,
    hound: `<path d="M50 89q20-39 61-25h18q41-14 61 25l-11 91q-59 39-118 0z" fill="${c1}" stroke="${c2}" stroke-width="7"/><path d="M59 92L27 57l12 74M181 92l32-35-12 74" fill="${c3}" stroke="${c2}" stroke-width="7"/><ellipse cx="120" cy="137" rx="28" ry="24" fill="${c3}"/><circle cx="94" cy="110" r="7" fill="#172033"/><circle cx="146" cy="110" r="7" fill="#172033"/><path d="M120 128l-10 10h20z" fill="${c2}"/>`,
    seal: `<path d="M52 135q3-72 68-78 65 6 68 78l28 45-50-5q-46 42-92 0l-50 5z" fill="${c1}" stroke="${c2}" stroke-width="7"/><circle cx="94" cy="111" r="7" fill="#172033"/><circle cx="146" cy="111" r="7" fill="#172033"/><ellipse cx="120" cy="132" rx="23" ry="19" fill="${c3}"/><path d="M120 127v18M120 145l-13 9M120 145l13 9" stroke="${c2}" stroke-width="4"/>`,
    yak: `<path d="M53 101l-20-46 48 25q39-35 78 0l48-25-20 46 8 74q-75 52-150 0z" fill="${c1}" stroke="${c2}" stroke-width="7"/><path d="M61 88Q120 42 179 88" fill="none" stroke="${c3}" stroke-width="25" stroke-linecap="round"/><circle cx="92" cy="119" r="7" fill="#172033"/><circle cx="148" cy="119" r="7" fill="#172033"/><ellipse cx="120" cy="150" rx="30" ry="23" fill="${c3}"/>`,
    gecko: `<path d="M42 124q26-58 79-42 47-24 77 20l27-6-17 27 17 28-32-7q-28 50-82 22l-42 40 7-51q-25-5-34-31z" fill="${c1}" stroke="${c2}" stroke-width="7" stroke-linejoin="round"/><circle cx="95" cy="111" r="9" fill="#172033"/><circle cx="149" cy="105" r="9" fill="#172033"/><path d="M104 138q17 11 34-2" fill="none" stroke="#172033" stroke-width="5"/>`,
    ghost: `<path d="M56 181V112q0-59 64-64 64 5 64 64v69l-20-17-18 19-20-19-20 19-20-19z" fill="${c1}" stroke="${c2}" stroke-width="7" stroke-linejoin="round"/><ellipse cx="91" cy="112" rx="10" ry="14" fill="#172033"/><ellipse cx="149" cy="112" rx="10" ry="14" fill="#172033"/><ellipse cx="120" cy="145" rx="13" ry="9" fill="${c3}"/>`,
    dragon: `<path d="M59 101L40 50l49 27 31-35 31 35 49-27-19 51 10 76q-71 42-142 0z" fill="${c1}" stroke="${c2}" stroke-width="7" stroke-linejoin="round"/><path d="M65 142L22 119l17 51M175 142l43-23-17 51" fill="${c3}" stroke="${c2}" stroke-width="7"/><circle cx="92" cy="113" r="7" fill="#172033"/><circle cx="148" cy="113" r="7" fill="#172033"/><path d="M110 145h20l-10 13z" fill="${c2}"/>`,
    deer: `<path d="M78 85L48 48l8-25 16 28 17-40 11 57M162 85l30-37-8-25-16 28-17-40-11 57" fill="none" stroke="${c2}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M63 93q57-41 114 0l-17 89q-40 34-80 0z" fill="${c1}" stroke="${c2}" stroke-width="7"/><path d="M120 129l-10 11h20z" fill="${c2}"/>${face(108,153)}<path d="M70 91L45 75M170 91l25-16" stroke="${c2}" stroke-width="7"/>`
  };
  return shapes[shape] || shapes.bear;
}

function stageFeatures(stage, p) {
  const c1 = p[0], c2 = p[1], c3 = p[2];
  if (stage === 1) return `<path d="M89 196q31 19 62 0" fill="none" stroke="${c2}" stroke-width="7" stroke-linecap="round"/>`;
  if (stage === 2) return `<path d="M57 158l-32 26 41 4M183 158l32 26-41 4" fill="${c3}" stroke="${c2}" stroke-width="6"/><path d="M86 190h68l-8 31H94z" fill="${c2}"/><circle cx="120" cy="204" r="8" fill="${c1}"/>`;
  return `<path d="M52 157L13 132l17 58 38-8M188 157l39-25-17 58-38-8" fill="${c3}" stroke="${c2}" stroke-width="7"/><path d="M82 61l14-31 24 20 24-20 14 31" fill="#fde047" stroke="#a16207" stroke-width="6" stroke-linejoin="round"/><circle cx="120" cy="30" r="8" fill="#fff"/><path d="M75 199q45 27 90 0" fill="none" stroke="#fde047" stroke-width="10" stroke-linecap="round"/>`;
}

export function renderMonsterSvg(characterValue, options = {}) {
  const character = typeof characterValue === "string" ? getSeason2Character(characterValue) : characterValue;
  if (!character) return renderFallbackMonsterSvg();
  const world = getSeason2World(character.worldId);
  const locked = options.locked === true;
  const p = character.palette;
  const silhouette = locked ? "#475569" : p[0];
  const outline = locked ? "#1e293b" : p[1];
  const highlight = locked ? "#64748b" : p[2];
  const palette = [silhouette, outline, highlight];
  const aria = String(options.ariaLabel || character.name).replace(/[&<>"']/g, "");
  return `<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${aria}" class="s2-monster-svg" data-character-id="${character.id}">
    <defs><radialGradient id="bg-${character.id}" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="${locked ? "#cbd5e1" : world.accent}"/><stop offset="1" stop-color="${locked ? "#94a3b8" : world.color}" stop-opacity=".22"/></radialGradient></defs>
    <circle cx="120" cy="120" r="112" fill="url(#bg-${character.id})"/>
    <g>${baseShape(character.shape, palette, character.evolutionStage)}${stageFeatures(character.evolutionStage, palette)}${locked ? "" : propSvg(character.prop, world.color)}</g>
    ${locked ? `<path d="M95 102q25-20 50 0v19h8v45H87v-45h8zm14 19h22v-14q-11-9-22 0z" fill="#0f172a" fill-opacity=".75"/>` : ""}
  </svg>`;
}

export function renderFallbackMonsterSvg() {
  return `<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="캐릭터 이미지를 불러오지 못했어요" class="s2-monster-svg"><circle cx="120" cy="120" r="108" fill="#e2e8f0"/><path d="M73 178V99q0-47 47-47t47 47v79l-16-14-16 16-15-16-16 16-15-16z" fill="#94a3b8" stroke="#334155" stroke-width="7"/><circle cx="98" cy="112" r="8" fill="#172033"/><circle cx="142" cy="112" r="8" fill="#172033"/><path d="M108 143q12 9 24 0" fill="none" stroke="#172033" stroke-width="5"/></svg>`;
}
