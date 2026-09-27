/** Original Heather Word rabbit. Pure SVG; no fonts, network assets, or player mutations. */
export const BUNNY_VERSION = '14.0.0';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function rabbitMarkup({mood='idle', label='토리, 하얀 토끼 탐험가', decorative=false}={}) {
  const state=['idle','input','correct','review','celebrate','wave'].includes(mood)?mood:'idle';
  return `<svg class="bunny-rabbit" data-mood="${state}" viewBox="0 0 260 300" ${decorative?'aria-hidden="true"':`role="img" aria-label="${escape(label)}"`} focusable="false" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse class="bunny-shadow" cx="130" cy="277" rx="66" ry="11" fill="#353354" opacity=".12"/>
  <g class="bunny-rig" stroke="#343348" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path class="bunny-scarf-tail" d="m157 174 45 10-15 13 13 17-48-17" fill="#ff785f"/>
    <circle cx="188" cy="230" r="18" fill="#fffef9"/>
    <g class="bunny-body"><path d="M91 183c-21 26-25 55-11 71 17 19 78 19 95 0 15-17 8-55-12-72" fill="#fffef9"/>
    <path d="M98 226c0 22 14 29 31 29s31-8 31-29c-9 11-51 11-62 0" fill="#ece9f4" stroke="none"/>
    <path class="bunny-foot bunny-foot-left" d="M97 250c-17-1-31 7-29 17 2 11 31 14 44 5l4-14" fill="#fffef9"/>
    <path class="bunny-foot bunny-foot-right" d="M153 251c17-4 37 4 37 14 0 12-33 17-47 9l-5-16" fill="#fffef9"/>
    <path d="m91 184 58 65" stroke="#8b76cf" stroke-width="8"/>
    <rect x="135" y="225" width="42" height="31" rx="10" fill="#c5b3f5" transform="rotate(-12 156 240)"/>
    <path d="m156 229 3 6 7 1-5 5 1 6-6-3-6 3 1-6-5-5 7-1z" fill="#ffe599" stroke-width="2"/>
    </g>
    <g class="bunny-arm bunny-arm-left"><path d="M92 190c-14 0-31 13-26 27 4 11 20 2 29-8" fill="#fffef9"/></g>
    <g class="bunny-arm bunny-arm-right"><path d="M163 191c16-6 31 6 29 20-3 13-22 5-29-4" fill="#fffef9"/></g>
    <g class="bunny-head">
      <g class="bunny-ear bunny-ear-left"><path d="M97 122C77 98 59 36 78 24c22-14 45 57 43 91" fill="#fffef9"/><path d="M98 98C88 77 80 48 85 43c6-4 18 27 23 58" stroke="#efb7c9" stroke-width="10"/></g>
      <g class="bunny-ear bunny-ear-right"><path d="M135 113c-1-42 10-103 33-97 27 7 2 77-13 105" fill="#fffef9"/><path d="M148 97c4-30 11-62 17-62s-2 36-10 57" stroke="#efb7c9" stroke-width="10"/></g>
      <path d="M65 150c-1-34 27-59 63-57 39-3 69 21 69 57 0 32-27 51-67 51-40 0-66-17-65-51Z" fill="#fffef9"/>
      <path d="M75 170c15 22 87 32 109-2-6 31-85 38-109 2" fill="#edeaf5" stroke="none"/>
      <ellipse cx="87" cy="164" rx="12" ry="7" fill="#ffcbc7" stroke="none"/><ellipse cx="171" cy="164" rx="12" ry="7" fill="#ffcbc7" stroke="none"/>
      <g class="bunny-eyes"><ellipse cx="105" cy="145" rx="6" ry="9" fill="#343348" stroke="none"/><ellipse cx="155" cy="145" rx="6" ry="9" fill="#343348" stroke="none"/><circle cx="107" cy="142" r="2" fill="#fff" stroke="none"/><circle cx="157" cy="142" r="2" fill="#fff" stroke="none"/></g>
      <g class="bunny-happy-eyes"><path d="m98 147 7-6 7 6m35 0 8-6 7 6"/></g>
      <path d="m125 159 5 4 5-4" fill="#dc9eaa" stroke="#dc9eaa"/>
      <path class="bunny-mouth" d="M119 171q6 6 11-2 5 8 11 2" stroke-width="3"/>
      <path class="bunny-smile" d="M119 170q11 22 23 0Z" fill="#b25870" stroke-width="2.5"/>
      <path d="m112 98 9-7 6 7 8-5 7 7" fill="#fffef9" stroke-width="3"/>
      <path d="M98 193q28 15 65-2l1 11q-38 16-68-1Z" fill="#ff785f"/>
      <circle cx="148" cy="200" r="8" fill="#ffe599" stroke-width="2.5"/><path d="m148 195 1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5-2.5-2.5 3.5-.5Z" fill="#b67832" stroke="none"/>
    </g>
    <g class="bunny-letter"><rect x="104" y="206" width="49" height="45" rx="10" fill="#ffe49b"/><path d="m118 237 10-21 10 21m-17-7h14" stroke-width="3"/></g>
  </g></svg>`;
}
export function landscapeMarkup() {
 return `<svg class="bunny-landscape" viewBox="0 0 720 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
 <circle cx="554" cy="82" r="45" fill="#ffe9a1"/>
 <g fill="#fff" opacity=".6"><path d="M370 84c-14-2-10-21 2-21 1-22 33-25 39-5 22-8 31 22 9 26Z"/><path d="M629 126c-21 0-23-22-5-27 3-20 36-19 40 0 24-4 24 29-1 27Z"/><path d="M105 79c-12 1-16-15-4-20 0-16 24-22 31-5 18-6 28 23 5 25Z"/></g>
 <path d="M0 253q124-64 260 0t270-19 190-3v129H0Z" fill="#c9bcf0"/>
 <path d="M0 291q159-80 320-7t400-5v81H0Z" fill="#aca0d9"/>
 <ellipse cx="504" cy="319" rx="137" ry="18" fill="#645681" opacity=".16"/>
 <path d="M357 273q144-54 293-3l-39 45q-105 37-213-2Z" fill="#8070b5"/>
 <path d="M375 278q123 41 255-3l-19 40q-105 37-213-2Z" fill="#9987c9"/>
 <ellipse cx="506" cy="271" rx="149" ry="41" fill="#d5eabb"/><ellipse cx="505" cy="263" rx="142" ry="31" fill="#e9f4cf"/>
 <path d="M529 246q-36 6-22 27t-53 25" fill="none" stroke="#fff4d8" stroke-width="17"/>
 <g stroke="#5f6580" stroke-width="3" stroke-linejoin="round"><path d="M609 266v-97"/><path d="m609 169 51 12-51 17Z" fill="#ff977d"/><path d="m389 265-4-48m0 4-13-12m13 25 12-14"/><path d="m633 272 5-19m-5 19-9-10"/></g>
 <g fill="#8dae79"><ellipse cx="366" cy="247" rx="12" ry="20" transform="rotate(-24 366 247)"/><ellipse cx="646" cy="244" rx="10" ry="21" transform="rotate(27 646 244)"/></g>
 <g fill="#fff1a4"><path d="m316 155 4 12 13 4-13 4-4 13-4-13-13-4 13-4Z"/><path d="m636 67 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/></g></svg>`;
}
export function rabbitHero() {
 return `${landscapeMarkup()}<span class="bunny-orbit bunny-orbit-a" aria-hidden="true">A</span><span class="bunny-orbit bunny-orbit-b" aria-hidden="true">B</span><span class="bunny-orbit bunny-orbit-c" aria-hidden="true">✦</span><button type="button" class="bunny-hero-friend" data-bunny-pet aria-label="토리에게 인사하기">${rabbitMarkup({decorative:true})}<span class="bunny-name-tag">토리 <i>·</i> 너의 모험 친구</span></button>`;
}
export function normalizeBunnyPrefs(value = {}) {
 const v=value && typeof value==='object'?value:{};
 return {music:v.music===true, volume:Math.max(0,Math.min(1,Number.isFinite(v.volume)?v.volume:.24)), motion:['full','gentle','off'].includes(v.motion)?v.motion:'full'};
}
export function energyLabel(value) {
 const n=Math.max(0, Math.min(10, Number(value)||0));
 return n>=10?'피날레!':n>=6?'반짝반짝!':n>=3?'신나는 모험!':'차근차근 출발!';
}
