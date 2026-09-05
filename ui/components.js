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
export function homeView(s, {icon,partnerMarkup,missionCta}) {
  const cta=missionCta(s), empty=!s.wordCount;
  const rows=[
    {label:'단어 만나기',note:'카드로 보고, 듣고',current:s.mission.cardViews,target:5,action:'data-hw9-action="card"',icon:icon('book')},
    {label:'뜻 기억하기',note:'게임에서 정답 맞히기',current:s.mission.gameCorrect,target:5,action:'data-hw9-game="choice"',icon:icon('game')},
    {label:'철자 써보기',note:'빈칸 또는 직접 쓰기',current:s.mission.writingAttempts,target:3,action:'data-hw9-game="type"',icon:icon('pencil')}
  ];
  return `<section class="hw9-view hw9-home-view" aria-labelledby="hw9HomeTitle">
    <div class="hw9-view-heading"><div><span class="hw9-kicker">HEATHER WORD</span><h1 id="hw9HomeTitle">차곡차곡, 나의 단어</h1><p>오늘의 작은 배움이 내일의 자신감이 돼요.</p></div></div>
    <div class="hw9-home-grid">
      <article class="hw9-hero-card">
        <div class="hw9-hero-copy"><span class="hw9-kicker">${empty?'처음 오셨나요?':'오늘의 모험'}</span><h2>${empty?'첫 단어부터,<br>가볍게 시작해요':s.adventure.completed?'오늘도 한 걸음<br>더 자랐어요':s.adventure.hasSession?'하던 학습을<br>이어서 해볼까요?':'단어를 배우는<br>나만의 작은 모험'}</h2><p>${empty?'아직 단어가 없어요. 보호자 도구에서 단어를 추가하거나 기존 데이터를 동기화해 주세요.':escapeText(cta.note)}</p></div>
        <div class="hw9-hero-character">${partnerMarkup(s)}<span class="hw9-partner-name">${empty?'함께 배우고 성장해요':'나의 학습 파트너'}</span></div>
        ${empty?'':`<div class="hw9-hero-progress"><div><strong>모험 ${s.adventure.stageIndex} / 4단계</strong><span>모은 별 ${s.adventure.stars}개</span></div>${progress(s.adventure.percent,'모험 단계 진행률')}</div><ol class="hw9-step-track" aria-label="모험 순서">${['워밍업','단어 숲','철자 관문','보스'].map((title,i)=>`<li class="${i<s.adventure.stageIndex?'is-done':''}">${title}</li>`).join('')}</ol>`}
        <button class="hw9-button hw9-button-primary hw9-hero-cta" type="button" data-hw9-action="${empty?'parent':'adventure'}"><span>${empty?'첫 단어장 준비하기':escapeText(cta.label)}</span>${icon('arrow')}</button>
      </article>
      <article class="hw9-quest-card">
        <div class="hw9-section-title"><div><span class="hw9-kicker">작은 습관 만들기</span><h2>${s.mission.complete?'오늘 목표 달성':'오늘의 학습 목표'}</h2></div><span>${s.mission.total}/${s.mission.target}</span></div>
        ${rows.map(row=>goalRow({...row,action:empty?'data-hw9-action="parent"':row.action,completeIcon:icon('check')})).join('')}
        ${progress(s.mission.percent,'오늘 일일 미션 달성률')}
        ${s.mission.complete&&!s.mission.rewarded?'<button class="hw9-button hw9-button-reward hw9-button-wide" type="button" data-hw9-action="claim-mission">오늘 보상 받기</button>':''}
      </article>
      <div class="hw9-home-secondary">
        <button class="hw9-info-tile" type="button" data-hw9-tab-jump="learn"><span class="hw9-info-icon">${icon('book')}</span><span><small>나의 단어장</small><strong>${s.wordCount}개 단어</strong><em>${s.mastery.due?`복습할 단어 ${s.mastery.due}개`:'카테고리별로 보고 들을 수 있어요'}</em></span>${icon('chevron')}</button>
        <button class="hw9-info-tile" type="button" data-hw9-tab-jump="my"><span class="hw9-info-icon">${icon('flame')}</span><span><small>배움의 발자국</small><strong>${s.streak.current}일 연속 학습</strong><em>나의 기록과 학습 설정</em></span>${icon('chevron')}</button>
      </div>
    </div>
  </section>`;
}
