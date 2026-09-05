import { escapeText as esc } from './components.js?v=12.0.0';

const DAY_LABELS = ['일','월','화','수','목','금','토'];
const MODES = {choice:'뜻 맞히기',block:'철자 블록',blank:'빈칸 완성',type:'직접 쓰기',boss:'보스 도전',warmup:'준비 운동',card:'단어 카드'};
const count = value => Math.max(0, Number.isFinite(Number(value)) ? Math.floor(Number(value)) : 0);
const dayKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

/** Presentation-only report. Current words + actual saved events, in the device timezone. */
export function parentInsights(snapshot, now = new Date()) {
  const days = Array.from({length:7}, (_,i) => {
    const date = new Date(now); date.setHours(0,0,0,0); date.setDate(date.getDate()-6+i);
    return {key:dayKey(date), label:DAY_LABELS[date.getDay()], date:`${date.getMonth()+1}/${date.getDate()}`, total:0, correct:0};
  });
  const byDay = new Map(days.map(day=>[day.key,day]));
  const modes = new Map();
  const events = Array.isArray(snapshot.season2?.activityLog) ? snapshot.season2.activityLog : [];
  for (const event of events) {
    const date = new Date(event?.at);
    if (event?.type !== 'answer' || !Number.isFinite(date.getTime()) || date > now) continue;
    const day = byDay.get(dayKey(date));
    if (!day || !['correct','wrong','skip'].includes(event.result)) continue;
    const correct = event.result === 'correct' ? 1 : 0;
    day.total++; day.correct += correct;
    const mode = String(event.mode || 'practice');
    const row = modes.get(mode) || {mode, name:MODES[mode] || '단어 연습', total:0, correct:0};
    row.total++; row.correct += correct; modes.set(mode,row);
  }
  const total = days.reduce((sum,day)=>sum+day.total,0);
  const correct = days.reduce((sum,day)=>sum+day.correct,0);
  const mastery = snapshot.season2?.wordMastery || {};
  const words = Array.isArray(snapshot.words) ? snapshot.words : [];
  const studied = words.filter(word=>count(mastery[word.id]?.correct)+count(mastery[word.id]?.wrong)+count(mastery[word.id]?.skip)>0 || count(mastery[word.id]?.level)>0);
  const mastered = words.filter(word=>count(mastery[word.id]?.level)>=5).length;
  const dueWords = studied.filter(word=>{
    const item=mastery[word.id] || {}, next=Date.parse(item.nextReviewAt);
    return (Number.isFinite(next) && next<=now.getTime()) || count(item.wrong)+count(item.skip)>count(item.correct);
  });
  const categories=(snapshot.categories || []).filter(c=>c.id!=='all'&&words.some(w=>w.categoryId===c.id)).map(category=>{
    const items=words.filter(w=>w.categoryId===category.id);
    const learned=items.filter(w=>count(mastery[w.id]?.level)>=5).length;
    return {name:category.name,total:items.length,learned,percent:Math.round(learned/items.length*100)};
  });
  return {days,total,correct,accuracy:total?Math.round(correct/total*100):null,activeDays:days.filter(d=>d.total>0).length,
    modes:[...modes.values()].map(row=>({...row,accuracy:Math.round(row.correct/row.total*100)})),
    studied:studied.length,mastered,dueWords,categories,wordCount:words.length,
    range:`${days[0].date} – ${days[6].date}`,name:snapshot.name==='Player'?'우리 아이':snapshot.name};
}

export function parentReportText(report) {
  return `${report.name}의 학습 수첩 (${report.range})\n최근 7일: ${report.activeDays}일 학습 · ${report.total}문제 · 정답률 ${report.accuracy===null?'기록 없음':report.accuracy+'%'}\n완전히 익힌 단어: ${report.mastered}/${report.wordCount}개\n다시 볼 단어: ${report.dueWords.length}개${report.dueWords.length?'\n'+report.dueWords.slice(0,8).map(w=>`${w.word} — ${w.meaning}`).join('\n'):''}\n현재 기기에 저장된 학습 기록 기준 · Heather Word`;
}

export function parentReportView(snapshot, {icon, demo=false}, now = new Date()) {
  const r=parentInsights(snapshot,now), peak=Math.max(1,...r.days.map(d=>d.total));
  const message=!r.total?'첫 번째 배움을 기다리고 있어요':r.dueWords.length?'다시 만나면 더 오래 기억해요':'차곡차곡, 배움이 쌓이고 있어요';
  return `<div class="hw12-report" data-hw12-report>
    <header class="hw12-report-heading"><span class="hw9-kicker">PARENT NOTE · ${demo?'무료 체험 기록':'보호자 학습 수첩'}</span><h2 id="hw12HubTitle">${esc(r.name)}의 작은 성장이 보여요</h2><p>${esc(r.range)} · 최근 7일의 저장된 답변 기록</p></header>
    <section class="hw12-report-summary" aria-label="최근 7일 학습 요약">
      <div><span>배운 날</span><strong>${r.activeDays}<small> / 7일</small></strong></div>
      <div><span>도전한 문제</span><strong>${r.total}<small>문제</small></strong></div>
      <div><span>정답률</span><strong>${r.accuracy===null?'—':r.accuracy+'%'}<small>${r.total?'':'아직 기록 없음'}</small></strong></div>
    </section>
    <div class="hw12-report-grid"><section class="hw12-report-panel"><h3>일주일의 발자국</h3><div class="hw12-week-chart" role="list" aria-label="날짜별 풀이 수">${r.days.map(day=>`<div role="listitem" aria-label="${day.date} ${day.label}요일 ${day.total}문제"><b>${day.total||'·'}</b><div class="hw12-bar-track"><i style="--bar:${Math.round(day.total/peak*100)}%"></i></div><span>${day.label}</span><small>${day.date}</small></div>`).join('')}</div><p class="hw12-note">쉬는 날이 있어도 괜찮아요. 다시 시작한 날도 소중해요.</p></section>
    <section class="hw12-report-panel hw12-next-step"><span class="hw9-kicker">다음 한 걸음</span><h3>${message}</h3><p>${!r.total?'단어 카드를 함께 보고, 아이가 고른 놀이로 시작해 보세요.':r.dueWords.length?`복습할 ${r.dueWords.length}개 중 몇 개만 함께 읽어 보세요. 모험에서 복습할 단어를 우선 골라 줘요.`:'오늘 만난 단어를 생활 속에서 한 번 말해 보세요. 결과보다 시도한 과정을 칭찬해 주세요.'}</p><button class="hw9-button hw9-button-primary" type="button" data-hw9-action="hub-learn">${icon('book')} 함께 학습하기</button></section></div>
    <section class="hw12-report-panel"><div class="hw9-section-title"><h3>얼마나 익숙해졌을까요?</h3><span>완전히 익힌 단어 ${r.mastered} / ${r.wordCount}개</span></div>${r.categories.length?`<div class="hw12-mastery-list">${r.categories.map(c=>`<div><span>${esc(c.name)}</span><div class="hw9-progress" role="progressbar" aria-label="${esc(c.name)} 숙련도" aria-valuenow="${c.percent}" aria-valuemin="0" aria-valuemax="100"><i style="--progress:${c.percent}%"></i></div><b>${c.learned}/${c.total}</b></div>`).join('')}</div>`:'<p>단어를 준비하면 주제별 성장을 볼 수 있어요.</p>'}<p class="hw12-note">숙련 5단계에 도달한 단어를 집계해요. 정답률과 숙련도는 서로 다른 지표예요.</p></section>
    <div class="hw12-report-grid"><section class="hw12-report-panel"><h3>놀이별 학습 기록</h3>${r.modes.length?`<div class="hw12-mode-list">${r.modes.map(m=>`<div><span>${esc(m.name)}</span><b>${m.accuracy}%</b><small>${m.correct}/${m.total}문제</small></div>`).join('')}</div>`:'<p>문제를 풀면 놀이별 기록이 나타나요.</p>'}</section>
    <section class="hw12-report-panel"><h3>다시 만나면 좋은 단어</h3>${r.dueWords.length?`<div class="hw12-review-words">${r.dueWords.slice(0,8).map(w=>`<span><b>${esc(w.word)}</b>${esc(w.meaning)}</span>`).join('')}</div>`:`<p>${r.studied?'현재 기록에 복습이 필요한 단어가 없어요.':'학습을 시작하면 다시 볼 단어를 찾아 드려요.'}</p>`}</section></div>
    <footer class="hw12-report-footer"><p>현재 저장된 기록 기준이며, 기기·연결 상태에 따라 다른 기기의 학습이 포함되지 않을 수 있어요.</p><div><button type="button" class="hw9-button hw9-button-secondary" data-hw9-action="print-report">${icon('report')} 인쇄 · PDF 저장</button><button type="button" class="hw9-button hw9-button-secondary" data-hw9-action="copy-report">${icon('data')} 요약 복사</button><button type="button" class="hw9-text-button" data-hw9-action="detailed-report">기존 상세 리포트</button></div><p data-hw12-copy-status role="status"></p></footer>
  </div>`;
}

export function parentGuideView({icon,demo=false}) {
  return `<div class="hw12-guide"><span class="hw9-kicker">FOR LITTLE EXPLORERS, WITH YOU</span><h2 id="hw12HubTitle">아이는 모험하고,<br>부모는 성장을 발견해요.</h2><p class="hw12-guide-intro">7–10세를 위한 영어 단어 탐험. 보고 듣기부터 직접 쓰기까지, 아이의 속도로 한 걸음씩.</p>
    <div class="hw12-value-grid"><article><span>${icon('book')}</span><h3>직접 해 보는 영어</h3><p>단어 카드와 네 가지 놀이로 뜻과 철자를 함께 연습해요.</p></article><article><span>${icon('pet')}</span><h3>다음이 궁금한 모험</h3><p>학습하며 만나는 친구, 부화와 진화, 나만의 모습 꾸미기.</p></article><article><span>${icon('report')}</span><h3>눈으로 보는 성장</h3><p>실제 학습 기록과 복습 단어로 다음에 할 일을 알아봐요.</p></article></div>
    <section class="hw12-offer"><div><span class="hw12-tag">지금 이용 가능</span><h3>첫 탐험, 무료로 시작해요</h3><p>6개 주제 · 60개 기초 단어 · 카드와 네 가지 놀이 · 모험과 리포트</p><p class="hw12-note">가입·카드 등록 없이 체험해요. 체험 기록은 이 브라우저에 따로 보관돼요.</p><button type="button" class="hw9-button hw9-button-primary" data-hw9-action="${demo?'hub-learn':'start-demo'}">${demo?'체험 이어가기':'무료로 체험하기'} ${icon('arrow')}</button></div><div class="hw12-offer-mark">60<small>첫 단어</small></div></section>
    <section class="hw12-membership"><span class="hw12-tag is-soon">준비 중 · 아직 판매하지 않아요</span><h3>Heather Family</h3><p>아이별 학습을 한곳에 모으는 가족 멤버십을 준비하고 있어요.</p><ul><li>자녀별 학습 공간과 기기 간 이어하기</li><li>수준과 관심사에 맞춘 추가 학습팩</li><li>오래 쌓아 보는 성장 리포트</li></ul><p class="hw12-note">예정 기능이며 제공 범위와 가격은 출시 시 안내해요. 현재 유료 결제나 자동 구독은 없어요.</p></section>
    <div class="hw12-faq"><h3>시작 전 궁금한 점</h3><details><summary>기존 단어장과 기록은 어떻게 되나요?</summary><p>그대로 유지해요. 무료 체험은 별도 기록을 사용하며, 체험을 나가면 원래 학습 공간으로 돌아와요.</p></details><details><summary>우리 아이의 학교 단어로 배울 수 있나요?</summary><p>네. 원래 학습 공간의 보호자 도구에서 단어를 직접 추가하거나 한 번에 붙여 넣을 수 있어요. 기존 백업·복원도 이용할 수 있어요.</p></details><details><summary>기록을 보관하려면 어떻게 하나요?</summary><p>현재 기기 저장과 기존 클라우드 연결을 사용해요. 브라우저 데이터를 삭제하기 전 보호자 도구에서 백업해 주세요. 체험은 현재 브라우저에만 저장돼요.</p></details><details><summary>보호자 PIN은 무엇인가요?</summary><p>이 기기에서 관리 화면과 아이의 리포트를 열 때 사용하는 잠금이에요. 계정 로그인이나 결제 인증을 대신하지는 않아요.</p></details></div>
    <footer class="hw12-guide-footer"><button type="button" class="hw9-text-button" data-hw9-action="hub-report">보호자 학습 수첩 열기 ${icon('arrow')}</button></footer></div>`;
}
