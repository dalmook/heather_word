/* Explicit, device-local trial. Runs before the existing storage/engine loaders. */
(function prepareHeatherTrial() {
  const params = new URLSearchParams(window.location.search);
  window.HEATHER_DEMO = params.get('demo') === '1';
  if (!window.HEATHER_DEMO) return;
  // Even a manually typed ?demo=1 must never initialize Firebase.
  if (params.get('mode') !== 'local') {
    params.set('mode', 'local');
    window.history.replaceState(null, '', `${window.location.pathname}?${params}${window.location.hash}`);
  }
  const key = 'heather_word_demo_v1';
  const packs = [
    ['animals', '동물 친구들', '🐻', [['cat','고양이','🐱'],['dog','개','🐶'],['bear','곰','🐻'],['bird','새','🐦'],['fish','물고기','🐟'],['rabbit','토끼','🐰'],['lion','사자','🦁'],['tiger','호랑이','🐯'],['duck','오리','🦆'],['frog','개구리','🐸']]],
    ['food', '맛있는 간식', '🍎', [['apple','사과','🍎'],['banana','바나나','🍌'],['orange','오렌지','🍊'],['grape','포도','🍇'],['milk','우유','🥛'],['bread','빵','🍞'],['egg','달걀','🥚'],['rice','밥','🍚'],['cookie','쿠키','🍪'],['water','물','💧']]],
    ['colors', '알록달록 색깔', '🎨', [['red','빨간색','🔴'],['blue','파란색','🔵'],['yellow','노란색','🟡'],['green','초록색','🟢'],['pink','분홍색','🌸'],['purple','보라색','🟣'],['white','하얀색','⚪'],['black','검은색','⚫'],['brown','갈색','🟤'],['gray','회색','🐘']]],
    ['school', '즐거운 학교', '🎒', [['book','책','📖'],['pencil','연필','✏️'],['pen','펜','🖊️'],['bag','가방','🎒'],['desk','책상',''],['chair','의자','🪑'],['school','학교','🏫'],['teacher','선생님','👩‍🏫'],['friend','친구','👫'],['eraser','지우개','']]],
    ['nature', '자연 탐험', '🌱', [['sun','해','☀️'],['moon','달','🌙'],['star','별','⭐'],['sky','하늘','🌤️'],['cloud','구름','☁️'],['rain','비','🌧️'],['snow','눈','❄️'],['tree','나무','🌳'],['flower','꽃','🌼'],['leaf','나뭇잎','🍃']]],
    ['actions', '몸으로 말해요', '🏃', [['run','달리다','🏃'],['walk','걷다','🚶'],['jump','뛰어오르다',''],['swim','수영하다','🏊'],['read','읽다','📖'],['write','쓰다','✍️'],['sing','노래하다','🎤'],['dance','춤추다','💃'],['eat','먹다','🍽️'],['sleep','자다','😴']]]
  ];
  try {
    // An existing trial, including its progress, is never reseeded or reset.
    if (window.localStorage.getItem(key) !== null) return;
    const categories = packs.map(([id, name, emoji]) => ({id:`starter-${id}`, name, emoji}));
    const words = packs.flatMap(([id,,, items]) => items.map(([word, meaning, emoji]) => ({
      id:`starter-${id}-${word}`, word, meaning, emoji, categoryId:`starter-${id}`, base:false
    })));
    window.localStorage.setItem(key, JSON.stringify({
      player:{name:'탐험가', sound:true}, categories, words, selectedCategoryId:'all'
    }));
  } catch {
    window.HEATHER_DEMO_ERROR = true;
  }
})();
