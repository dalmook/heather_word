/** Pure presentation helpers. They never mutate a player or invent learning records. */
export const escapeText = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export function progress(value, label) {
  const percent = Math.max(0, Math.min(100, Number(value) || 0));
  return `<div class="hw9-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(percent)}" aria-label="${escapeText(label)}"><i style="--progress:${percent}%"></i></div>`;
}
export function goalRow({label, note, current, target, action, icon, completeIcon}) {
  return `<button class="hw9-goal-row ${current >= target ? 'is-complete' : ''}" type="button" ${action}>${current >= target ? completeIcon : icon}<span>${escapeText(label)}<small>${escapeText(note)}</small></span><strong>${current} / ${target}</strong></button>`;
}
export function wordResults(words, query, categoryId, limit=60) {
  const needle=String(query||'').trim().toLowerCase();
  const all=words.filter(w => (categoryId==='all'||w.categoryId===categoryId) && (!needle||w.word.toLowerCase().includes(needle)||w.meaning.toLowerCase().includes(needle)));
  return {items:all.slice(0,Math.max(60,limit)),total:all.length,hasMore:all.length>limit};
}
/** A selection that actually exists in the game menu; never changes stored progress. */
export function availableCategory(s) {
  return s.categories.some(c => c.id === s.selectedCategoryId && (c.id === 'all' || c.count > 0)) ? s.selectedCategoryId : 'all';
}

/** Mode illustrations, not sample questions or invented learning records. */
export function gameArtwork(mode) {
  const art = {
    choice: '<rect x="13" y="8" width="62" height="52" rx="14" fill="#fff" stroke="currentColor" stroke-width="3"/><path d="m31 32 9 9 18-20" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="75" cy="58" r="13" fill="#ffd568"/><path d="m68 58 5 5 8-10" fill="none" stroke="#795016" stroke-width="3" stroke-linecap="round"/>',
    block: '<rect x="5" y="25" width="32" height="35" rx="8" fill="#fff" stroke="currentColor" stroke-width="3"/><rect x="32" y="9" width="32" height="35" rx="8" fill="#fff" stroke="currentColor" stroke-width="3"/><rect x="59" y="32" width="32" height="35" rx="8" fill="#ffd568" stroke="currentColor" stroke-width="3"/><path d="m15 50 6-15 6 15m-9-5h6M44 20h6a4 4 0 0 1 0 8h-6m0-8v16h7a4 4 0 0 0 0-8M80 44c-13-6-13 18 0 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>',
    blank: '<rect x="6" y="25" width="24" height="34" rx="7" fill="#fff" stroke="currentColor" stroke-width="3"/><rect x="36" y="25" width="24" height="34" rx="7" fill="#fff" stroke="currentColor" stroke-width="3" stroke-dasharray="4 4"/><rect x="66" y="25" width="24" height="34" rx="7" fill="#fff" stroke="currentColor" stroke-width="3"/><path d="M13 48h10m-5-14v14m26-15c0-7 12-7 12 0 0 5-6 4-6 9m0 7h.1M72 35h12m-6 0v15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="m47 5 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#ffd568"/>',
    type: '<rect x="12" y="8" width="56" height="59" rx="12" fill="#fff" stroke="currentColor" stroke-width="3"/><path d="M24 26h23M24 37h16M24 50h12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="m50 58 6-16 22-23 10 10-23 22z" fill="#ffd568" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="m73 24 10 10M50 58l9-2" stroke="currentColor" stroke-width="3"/>'
  };
  return `<svg viewBox="0 0 96 76" fill="none" aria-hidden="true" focusable="false">${art[mode] || art.choice}</svg>`;
}

export function homeView(s, {icon,partnerMarkup,avatarMarkup=()=>""}) {
  const empty=!s.wordCount, demo=globalThis.HEATHER_DEMO===true;
  const stage=Math.min(4,Math.max(0,s.adventure.stageIndex));
  const name=s.name==='Player'?'탐험가':s.name;
  const rows=[
    {label:'단어 카드 보기',note:'보고, 듣고 기억해요',current:s.mission.cardViews,target:5,action:'data-hw9-action="card"',icon:icon('book')},
    {label:'뜻 맞히기',note:'정답을 찾아 톡!',current:s.mission.gameCorrect,target:5,action:'data-hw9-game="choice"',icon:icon('game')},
    {label:'철자 써 보기',note:'생각난 단어를 한 글자씩',current:s.mission.writingAttempts,target:3,action:'data-hw9-game="type"',icon:icon('pencil')}
  ];
  const places=[{name:'준비 운동',icon:'book',count:5},{name:'단어 숲',icon:'sparkles',count:7},{name:'철자 관문',icon:'blocks',count:5},{name:'보스 도전',icon:'trophy',count:4}];
  return `<section class="hw9-view hw9-home-view" aria-labelledby="hw9HomeTitle">
    <div class="hw9-view-heading hw12-home-heading"><div><span class="hw9-kicker">MY LITTLE ADVENTURE</span><h1 id="hw9HomeTitle">${escapeText(name)}, 오늘도 만나서 반가워!</h1></div><span class="hw12-day-badge">${icon('flame')} ${s.streak.current}일의 발자국</span></div>
    ${demo?'<div class="hw12-demo-banner"><span><b>무료 체험 중</b> · 이 브라우저에 따로 저장돼요</span><button type="button" data-hw9-action="exit-demo">원래 학습으로</button></div>':''}
    <div class="hw9-home-grid">
      <article class="hw9-hero-card">
        <div class="kids-scene"><img class="kids-scenery" src="./assets/art/word-garden.svg" alt="" width="1536" height="1024" fetchpriority="high" decoding="async" />
          <div class="kids-speech"><span class="hw12-adventure-label">${icon('sparkles')} ${empty?'작은 탐험가를 기다려요':'오늘의 단어 모험'}</span><h2>${empty?'영어가 자라는<br><em>마법 같은 모험.</em>':s.adventure.completed?'오늘의 모험,<br><em>끝까지 해냈어!</em>':s.adventure.hasSession?'우리의 모험은<br><em>계속되는 거야.</em>':'단어 하나 배우면,<br><em>세상이 더 커져!</em>'}</h2><p>${empty?'친구들과 보고, 듣고, 놀다 보면<br>어느새 단어가 내 것이 돼요.':s.adventure.completed?'별을 모은 너의 도전을 기억해.<br>다음에는 어떤 단어를 만나 볼까?':'틀려도 괜찮아. 천천히 가도 좋아.<br>오늘도 함께 한 걸음, 출발!'}</p></div>
          <div class="hw-character-hero"><div class="hw-hero-avatar">${avatarMarkup(s)}</div><div class="hw-hero-partner">${partnerMarkup(s)}</div><span>${s.partnerId?"나와 함께하는 친구":"나의 첫 탐험을 기다려요"}</span></div>
        </div>
        <div class="kids-launch"><div><span class="hw12-launch-note">${empty?'가입 없이 60개 단어 체험':'4단계 · 21문제 · 이어서 학습'}</span><p>${empty?'동물부터 자연까지, 6개 주제':'작은 도전이 모여 커다란 자신감으로'}</p></div><button class="hw9-button hw9-button-primary hw9-hero-cta" type="button" data-hw9-action="${empty?'start-demo':'adventure'}"><span>${empty?'무료로 탐험 시작':s.adventure.completed?'오늘 모험 다시 보기':stage>0||s.adventure.hasSession?'이어서 탐험하기':'탐험 시작!'}</span>${icon('arrow')}</button></div>
      </article>
      <section class="kids-journey" aria-labelledby="kidsJourneyTitle"><div class="hw9-section-title"><div><span class="hw9-kicker">ONE STEP AT A TIME</span><h2 id="kidsJourneyTitle">오늘의 탐험 길</h2></div><span>${empty?'준비되면 출발!':`${stage}/4단계 완료`}</span></div><ol class="kids-path">${places.map((place,i)=>`<li class="${!empty&&i<stage?'is-done':!empty&&i===stage?'is-current':'is-next'}" ${!empty&&i===stage?'aria-current="step"':''}><span class="kids-path-node" aria-hidden="true">${!empty&&i<stage?icon('check'):icon(place.icon)}</span><strong>${place.name}</strong><small>${!empty&&i<stage?'완료!':!empty&&i===stage?'여기부터!':`${place.count}문제`}</small></li>`).join('')}</ol><div class="kids-path-caption"><span>${icon('star')} 모은 별 ${s.adventure.stars}개</span><span>한 걸음씩 가도 좋아</span></div></section>
      <article class="hw9-quest-card"><div class="hw9-section-title"><div><span class="hw9-kicker">TODAY’S LITTLE WINS</span><h2>${s.mission.complete?'오늘 미션 성공!':'작은 미션, 큰 뿌듯함'}</h2></div><span class="kids-mission-badge">${[s.mission.cardViews>=5,s.mission.gameCorrect>=5,s.mission.writingAttempts>=3].filter(Boolean).length}/3</span></div>${rows.map(row=>goalRow({...row,action:empty?'data-hw9-action="start-demo"':row.action,completeIcon:icon('check')})).join('')}${progress(s.mission.percent,'오늘 일일 미션 달성률')}${s.mission.complete&&!s.mission.rewarded?'<button class="hw9-button hw9-button-reward hw9-button-wide" type="button" data-hw9-action="claim-mission">잘했어! 미션 선물 받기</button>':''}
        <button type="button" class="hw12-companion" data-hw9-tab-jump="collection"><span class="hw12-companion-art">${partnerMarkup(s)}</span><span><small>${s.partnerId?'나의 탐험 친구':'아직 파트너를 고르기 전이에요'}</small><strong>${s.partnerId?'같이 자라는 우리':'첫 친구를 만나 볼까?'}</strong></span>${icon('chevron')}</button>
      </article>
      <div class="hw9-home-secondary"><button class="hw9-info-tile" type="button" data-hw9-tab-jump="learn"><span class="hw9-info-icon">${icon('book')}</span><span><small>나의 단어 숲</small><strong>${s.wordCount}개 단어</strong><em>${s.mastery.due?`다시 볼 단어 ${s.mastery.due}개`:'보고, 듣고, 알아 가요'}</em></span>${icon('chevron')}</button><button class="hw9-info-tile" type="button" data-hw9-tab-jump="games"><span class="hw9-info-icon">${icon('game')}</span><span><small>단어 놀이터</small><strong>오늘은 어떤 놀이?</strong><em>뜻부터 철자까지, 네 가지 도전</em></span>${icon('chevron')}</button></div>
    </div>
    <footer class="hw12-home-footer"><span>${icon('shield')} 보호자와 함께, 아이의 속도로</span><div>${empty?'<button type="button" class="hw9-text-button" data-hw9-action="parent">첫 단어장 준비하기</button>':''}<button type="button" class="hw9-text-button" data-hw9-action="parent-guide">부모님께 드리는 안내 ${icon('arrow')}</button></div></footer>
  </section>`;
}
