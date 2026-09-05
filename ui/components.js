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

function forestScene() {
  return `<svg class="kids-scenery" viewBox="0 0 720 280" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><circle cx="570" cy="64" r="34" fill="#ffda78"/><path d="M53 65c-3-31 42-43 57-17 22-9 44 8 38 25H59c-10 0-14-8-6-8M395 42c2-19 24-25 36-11 15-7 29 7 25 20h-53c-9 0-15-5-8-9" fill="#fff" opacity=".85"/><path d="M0 194Q129 142 267 203T720 158V280H0Z" fill="#b6dfc7"/><path d="M0 242Q180 191 360 235T720 209V280H0Z" fill="#86c9a3"/><path d="M180 280Q240 244 352 244T453 221" fill="none" stroke="#fff0c5" stroke-width="24"/><g fill="#479979"><path d="m73 89-47 121h94z"/><path d="m653 84-51 126h101z"/></g><g stroke="#41745e" stroke-width="8" stroke-linecap="round"><path d="M73 173v63M652 176v63"/></g><g fill="#dff1da"><ellipse cx="115" cy="244" rx="35" ry="14"/><ellipse cx="600" cy="250" rx="37" ry="12"/></g><g fill="#fff4cc"><circle cx="165" cy="223" r="5"/><circle cx="550" cy="252" r="5"/><circle cx="621" cy="226" r="4"/></g></svg>`;
}

export function homeView(s, {icon,partnerMarkup,missionCta}) {
  const empty = !s.wordCount;
  const stage = Math.min(4, Math.max(0, s.adventure.stageIndex));
  const rows = [
    {label:'단어 카드 보기',note:'보고, 듣고!',current:s.mission.cardViews,target:5,action:'data-hw9-action="card"',icon:icon('book')},
    {label:'뜻 맞히기',note:'정답을 톡!',current:s.mission.gameCorrect,target:5,action:'data-hw9-game="choice"',icon:icon('game')},
    {label:'철자 써 보기',note:'한 글자씩 꾹!',current:s.mission.writingAttempts,target:3,action:'data-hw9-game="type"',icon:icon('pencil')}
  ];
  const places = [{name:'준비 운동',icon:'book',count:5},{name:'단어 숲',icon:'sparkles',count:7},{name:'철자 관문',icon:'blocks',count:5},{name:'보스 도전',icon:'trophy',count:4}];
  return `<section class="hw9-view hw9-home-view" aria-labelledby="hw9HomeTitle">
    <div class="hw9-view-heading"><div><span class="hw9-kicker">HEATHER WORD · 단어 탐험대</span><h1 id="hw9HomeTitle">작은 모험, 커다란 발견!</h1></div></div>
    <div class="hw9-home-grid">
      <article class="hw9-hero-card">
        <div class="kids-scene">${forestScene()}
          <div class="kids-speech"><span>${empty?'탐험 친구의 초대':'오늘의 모험'}</span><h2>${empty?'반가워!<br>같이 시작할까?':s.adventure.completed?'끝까지 해냈어!<br>정말 멋진 모험이야':s.adventure.hasSession?'다시 만나 반가워!<br>이어서 가 볼까?':'친구와 함께<br>단어 숲으로!'}</h2></div>
          <div class="hw9-hero-character">${partnerMarkup(s)}<span class="hw9-partner-name">${s.partnerId?'나의 탐험 친구':'탐험 안내 친구'}</span></div>
        </div>
        <div class="kids-launch">
          <button class="hw9-button hw9-button-primary hw9-hero-cta" type="button" data-hw9-action="${empty?'parent':'adventure'}"><span>${empty?'첫 단어장 준비하기':s.adventure.completed?'오늘 모험 다시 보기':stage>0||s.adventure.hasSession?'이어서 탐험하기':'탐험 시작!'}</span>${icon('arrow')}</button>
          <p>${empty?'보호자와 함께 단어를 준비해 줘.':'4단계 · 21문제 · 중간에 쉬어도 저장돼'}</p>
        </div>
      </article>
      <section class="kids-journey" aria-labelledby="kidsJourneyTitle">
        <div class="hw9-section-title"><h2 id="kidsJourneyTitle">오늘의 탐험 길</h2><span>${empty?'단어를 준비하면 출발!':`${stage}/4단계 완료`}</span></div>
        <ol class="kids-path">${places.map((place,i)=>`<li class="${!empty&&i<stage?'is-done':!empty&&i===stage?'is-current':'is-next'}" ${!empty&&i===stage?'aria-current="step"':''}><span class="kids-path-node" aria-hidden="true">${!empty&&i<stage?icon('check'):icon(place.icon)}</span><strong>${place.name}</strong><small>${!empty&&i<stage?'완료!':!empty&&i===stage?'여기부터!':`${place.count}문제`}</small></li>`).join('')}</ol>
        <div class="kids-path-caption"><span>${icon('star')} 모은 별 ${s.adventure.stars}개</span><span>한 걸음씩 가도 좋아</span></div>
      </section>
      <article class="hw9-quest-card">
        <div class="hw9-section-title"><div><span class="hw9-kicker">하나씩 해 보자</span><h2>${s.mission.complete?'오늘 미션 성공!':'오늘의 작은 미션'}</h2></div><span class="kids-mission-badge">${[s.mission.cardViews>=5,s.mission.gameCorrect>=5,s.mission.writingAttempts>=3].filter(Boolean).length}/3 완료</span></div>
        ${rows.map(row=>goalRow({...row,action:empty?'data-hw9-action="parent"':row.action,completeIcon:icon('check')})).join('')}
        ${progress(s.mission.percent,'오늘 일일 미션 달성률')}
        ${s.mission.complete&&!s.mission.rewarded?'<button class="hw9-button hw9-button-reward hw9-button-wide" type="button" data-hw9-action="claim-mission">잘했어! 미션 선물 받기</button>':''}
      </article>
      <div class="hw9-home-secondary">
        <button class="hw9-info-tile" type="button" data-hw9-tab-jump="learn"><span class="hw9-info-icon">${icon('book')}</span><span><small>나의 단어 숲</small><strong>${s.wordCount}개 단어</strong><em>${s.mastery.due?`다시 볼 단어 ${s.mastery.due}개`:'궁금한 단어를 만나 봐'}</em></span>${icon('chevron')}</button>
        <button class="hw9-info-tile" type="button" data-hw9-tab-jump="collection"><span class="hw9-info-icon">${icon('pet')}</span><span><small>친구들의 마을</small><strong>내 친구 만나기</strong><em>돌보고, 꾸미고, 함께 놀자</em></span>${icon('chevron')}</button>
      </div>
    </div>
  </section>`;
}
