// 차트만 보고 매매하는 - 단타 적성검사 — 게임 엔진
const $ = (s) => document.querySelector(s);
const gaEvent = (name, params = {}) => {
  if (typeof window.gtag === "function") window.gtag("event", name, params);
};
const N = 252;      // 게임 구간: 1년 = 252봉
const PRE = 252;    // 사전 공개 구간: 직전 1년
const START_ASSET = 10000000; // 가상자금 1,000만원

const SECTOR_EMOJI = {
  "빅테크": "🖥️", "반도체": "🔬", "소프트웨어/클라우드": "☁️", "인터넷/플랫폼": "🌐",
  "핀테크/결제": "💳", "전기차/자동차": "🚗", "소비재/유통": "🛒", "식음료": "🍔",
  "헬스케어/제약": "💊", "금융": "🏦", "에너지": "🛢️", "산업재": "🏗️",
  "여행/항공": "✈️", "미디어/통신": "📡",
};

// ── 섹터 영문명 ──
const SECTOR_EN = {
  "빅테크":"Big Tech", "반도체":"Semiconductors", "소프트웨어/클라우드":"Software/Cloud",
  "인터넷/플랫폼":"Internet/Platform", "핀테크/결제":"Fintech/Payments",
  "전기차/자동차":"EV/Auto", "소비재/유통":"Consumer/Retail", "식음료":"Food & Bev",
  "헬스케어/제약":"Healthcare/Pharma", "금융":"Finance", "에너지":"Energy",
  "산업재":"Industrials", "여행/항공":"Travel/Airlines", "미디어/통신":"Media/Telecom",
};

// ── 다국어 (KO / EN) ──
const STRINGS = {
  ko: {
    h1sub:"차트만 보고 매매하는", h1main:"📉 단타 적성검사",
    tagline:"실제 차트, 가상자금 1,000만원. 당신의 단타 적성은?",
    rule1:"🎲 <b>정체불명의 미국 주식</b>이 랜덤으로 선택됩니다 (섹터만 공개)",
    rule2:"📜 먼저 <b>불특정 기간의 지난 1년치 일봉</b>이 그려집니다. 흐름을 파악하세요",
    rule3:"📈 <b>▶ 시작</b>을 누르면 이어서 1년(252봉)이 흘러가요 — 그때 <b>매수/매도</b>로 단타!",
    rule4:"💰 가상자금 <b>1,000만원</b> · 일시정지하고 하루씩 신중하게 매매하는 것도 가능",
    rule5:"🏁 종료 후 <b>종목 공개</b> + 존버(바이앤홀드)와 성적 비교",
    btnStart:"🚀 검사 시작", btnAgain:"🔄 한 판 더", btnCard:"📸 결과 공유", btnRestart:"🔄 다시시작",
    ma20:"― 20일선", ma60:"― 60일선", ma120:"― 120일선",
    startHint:"📜 지난 1년 차트입니다. <b>▶ 1년 단타 시작</b>을 누르면 이어서 그려져요 — 미리 매수해둬도 됩니다.",
    statEquityLabel:"총자산", statRetLabel:"수익률",
    btnBuyPart:"🔴 분할매수 ¼", btnSellPart:"🔵 분할매도 ¼", btnBuyFull:"🔴 풀매수", btnSellFull:"🔵 풀매도",
    avgRetLabel:"평단 대비",
    revealPre:"당신이 1년간 매매한 종목은...", gradeLabel:"단타 적성",
    btnChallenge:"⚔️ 친구에게 도전장 보내기",
    challengeDesc:"내가 방금 플레이한 <b>똑같은 종목·똑같은 구간</b>으로 친구가 대결하는 링크를 보냅니다.<br>친구의 결과 화면에 승패가 자동으로 표시돼요. (친구에게도 종목은 비밀)",
    copyBtn:"복사",
    caveatTitle:"⚠️ 현실은 이 게임보다 가혹합니다",
    caveat1:"이 게임엔 <b>거래 수수료·세금이 없고</b>, <b>상장폐지·파산한 종목도 빠져</b> 있습니다. 실제 시장에선 비용이 수익을 깎고, 떨어지는 종목에 물타기하다 <b>0이 되는 경우</b>도 있어 바이앤홀드(존버) 대비 승률이 게임보다 <b>훨씬 낮아질 수밖에 없습니다</b>.",
    caveat2:"따라서 이 게임의 수익률은 <b>실제 투자 수익을 전혀 보장하지 않습니다.</b>",
    otherGame:"선물코인 적성검사 해보기",
    cardModalTitle:"📸 결과 카드", shareSave:"저장", shareCopy:"복사", shareNativeBtn:"공유", closeBtn:"닫기 ✕",
    footerDisclaimer:"본 게임은 재미를 위한 것으로 투자 권유가 아니며, 게임 성적은 실제 투자 실력을 보장하지 않습니다.",
    previewPhase:"지난 1년",
    btnPlayLoading:"⏳ 차트 그리는 중", btnPlayStart:"▶ 1년 단타 시작",
    btnPlayPause:"⏸ 일시정지", btnPlayResume:"▶ 재개", btnStep:"⏭ +1일",
    toastNoCash:"현금이 없어요 😅", toastNoStock:"보유 주식이 없어요 😅",
    toastFilled:(m,s)=>`${m}${s} 체결 (현재가)`,
    toastQueued:(m,s)=>`${m}${s} 주문 — 다음 봉 시가 체결`,
    toastModeFull:"풀", toastModePart:"분할",
    toastSideBuy:"매수", toastSideSell:"매도",
    confirmRestart:"이 판을 버리고 다시 시작할까요?", confirmOk:"다시 시작", confirmCancel:"취소",
    chartRemain:(n)=>`⏳ 남은 ${n}일`,
    chartStart:"▶ 시작",
    avgCostLabel:"평단",
    chartPriceLine:"— 주가", chartAssetLine:"— 내 자산",
    statTrades:"매매 횟수", statWinRate:"매도 승률", statMdd:"최대 낙폭",
    statTradesVal:(n)=>`${n}회`,
    vsMyTrading:(won)=>`🫵 나의 단타 (최종 ${won})`,
    vsSpot:"💎 그냥 존버했다면 (바이앤홀드)",
    challengeWin:(me,them)=>`🏆 <b>승리!</b> 나 ${me} vs 상대 ${them}`,
    challengeLose:(me,them)=>`😭 <b>패배...</b> 나 ${me} vs 상대 ${them}`,
    challengeTie:(me)=>`🤝 무승부! 둘 다 ${me}`,
    challengeCopied:"✅ 복사됐어요! 카톡창에 붙여넣어 보내세요.<small>다시 누르면 재복사</small>",
    challengeManual:"아래 링크를 복사해서 친구에게 보내세요 👇",
    cardSaved:"이미지를 저장했어요! 💾",
    cardCopied:"카드 이미지가 복사됐어요! 붙여넣기 하세요 📋",
    cardCopyFail:"이 브라우저는 이미지 복사가 안 돼요. '이미지 저장'을 이용해 주세요 🙏",
    shareText:(grade,ret,bh)=>`📊 단타 적성검사 ${grade}등급! 1년 단타로 ${ret} (존버 ${bh}). 너도 한번 해봐 ⚔️`,
    shareNativeFallback:"텍스트와 링크를 복사했어요! 어디든 붙여넣기 해서 공유하세요 📋",
    shareNativeFail:"공유 기능이 지원되지 않아요. '복사' 버튼을 이용해 주세요 🙏",
    dashTitle:"📊 내 단타 기록",
    dashGames:"판수", dashBeats:"존버 이긴 비율", dashAlpha:"평균 알파", dashBest:"최고 등급",
    dashGradeEntry:(g)=>`${g}등급`,
    dashRowSuffix:(me,hold)=>`나 ${me} / 존버 ${hold}`,
    cardFilename:"단타적성검사.png",
    cardTitle:"📉 차트만 보고 매매하는 - 단타 적성검사",
    cardPeriodLabel:"1년 단타",
    cardMyLine:(ret,won)=>`나의 단타 ${ret}  (${won})`,
    cardSpotLine:(ret)=>`존버했다면 ${ret}`,
    cardStats:(t,w,m)=>`매매 ${t}회      매도 승률 ${w}      최대 낙폭 -${m}%`,
    cardChallengeWin:(them)=>`🏆 도전 승리! 상대 ${them}`,
    cardChallengeWith:(them)=>`상대 ${them}와 대결`,
    cardFootnote:"너도 해봐 → 차트만 보고 매매하는 - 단타 적성검사",
    challengeArrived:(won)=>`⚔️ <b>도전장 도착!</b> 상대의 최종 자산은 <b>${won}</b>. 같은 차트로 이겨보세요.`,
    challengeArrivedNoScore:"⚔️ <b>도전장 도착!</b> 친구와 같은 차트로 대결합니다.",
    footerData:(date)=>`실제 과거 시세(야후 파이낸스, 분할 반영) 기반 모의투자 게임 · 수수료/세금 미반영 · ${date} 데이터`,
    sectorUnit:"섹터",
    hudDay:(d,n)=>`Day ${d}/${n}`,
    rPeriod:(from,to)=>`${from} ~ ${to} 구간이었습니다`,
    gradePosProfit:(ret,bh)=>`💰 ${ret} 익절 성공 — 익절은 언제나 옳습니다! 다만 그냥 들고만 있었어도 ${bh}였기에 단타 점수는 아쉬워요.`,
    gradeProfitC:(bh)=>`💰 익절은 옳다! 수익도 냈고 존버(${bh})와 비슷한 성적. 나쁘지 않아요. 🙂`,
    gradeComment:{
      SSS:["존버 수익률을 50%p 넘게 압도했습니다. 전설적인 한 판입니다. 🏆","폭락장을 완벽하게 피했습니다. 시장에서 순간이동하셨나요? 🛸"],
      SS:["존버를 크게 앞질렀습니다. 차트가 당신에게 말을 거는 수준입니다. 🔥","폭락장에서 놀라운 방어력을 보여줬습니다. 생존을 넘어 압승입니다. 🛡️"],
      S:["당신... 혹시 여의도에서 오셨나요? 시장을 압살했습니다. 👑","폭락장에서 이 정도 방어라니. 도망치는 것도 실력입니다. 🏃"],
      A:["단타 적성 확실합니다. 실전엔 수수료가 있다는 것만 기억하세요. 😎","시장은 무너졌지만 당신은 덜 무너졌습니다. 생존왕. 🪖"],
      B:["존버보다 잘했습니다. 소질이 보여요. 🙂","손실은 났지만 존버보단 나았어요. 위기 감지 능력 있음. 🦊"],
      C:["그냥 사두고 잠이나 잘 걸 그랬습니다. 성적은 존버와 비슷해요. 😴","이러나 저러나 비슷하게 잃었습니다. 마음만 고생했네요. 😮‍💨"],
      D:["손가락이 수익률을 갉아먹었습니다. 매매 버튼과 거리두기를 권합니다. 🫠","떨어지는 칼날을 자꾸 잡으셨군요. 손은 주머니에. 🔪"],
      F:["축하합니다. 당신은 시장의 유동성 공급자였습니다. 단타 금지. 🚫","고점 매수 저점 매도의 정석. 교과서에 반면교사로 실립니다. 📚"],
      "?":["매매를 안 하면 적성을 알 수 없습니다. 다음 판엔 버튼을 눌러보세요. 👀","매매를 안 하면 적성을 알 수 없습니다. 다음 판엔 버튼을 눌러보세요. 👀"],
    },
    behaviorNoEntry:"👀 단 한 번도 매매하지 않은 관전형",
    behaviorOvertrading:(n)=>`🔥 뇌동매매 경보 — 1년간 ${n}회 매매`,
    behaviorHodler:"💎 사실상 존버였습니다",
    behaviorWinRate:(pct)=>`🎯 매도 승률 ${pct}% — 타이밍 감각 있음`,
    behaviorSummary:(n)=>`✂️ 총 ${n}회 매매`,
  },
  en: {
    h1sub:"Trade on Charts —", h1main:"📉 Stock Day-Trading Test",
    tagline:"Real charts, virtual $10,000. What's your day-trading aptitude?",
    rule1:"🎲 A <b>mystery US stock</b> is randomly selected (sector shown)",
    rule2:"📜 First, <b>one year of daily candles</b> are drawn. Read the flow.",
    rule3:"📈 Hit <b>▶ Start</b> and the next year unfolds — <b>buy/sell</b> to day-trade!",
    rule4:"💰 Virtual <b>$10,000</b> · Pause and trade day-by-day carefully if you want",
    rule5:"🏁 At the end, <b>stock revealed</b> + compared against buy-and-hold",
    btnStart:"🚀 Start Test", btnAgain:"🔄 Play Again", btnCard:"📸 Share Result", btnRestart:"🔄 Restart",
    ma20:"― MA20", ma60:"― MA60", ma120:"― MA120",
    startHint:"📜 Past 1-year chart. Hit <b>▶ Start Year Trading</b> to continue — you can buy in now.",
    statEquityLabel:"Total Equity", statRetLabel:"Return",
    btnBuyPart:"🔴 Buy ¼", btnSellPart:"🔵 Sell ¼", btnBuyFull:"🔴 Full Buy", btnSellFull:"🔵 Full Sell",
    avgRetLabel:"vs Avg Cost",
    revealPre:"The stock you traded for a year was…", gradeLabel:"Day-Trading Aptitude",
    btnChallenge:"⚔️ Challenge a Friend",
    challengeDesc:"Sends a link where your friend plays the <b>exact same stock &amp; time window</b>.<br>Win/loss appears automatically on their result. (Stock stays hidden from them too)",
    copyBtn:"Copy",
    caveatTitle:"⚠️ Reality is far harsher than this game",
    caveat1:"This game has <b>no trading fees or taxes</b>, and <b>delisted or bankrupt stocks are excluded</b>. In real markets, costs erode gains and averaging down can go to <b>zero</b>, making it much <b>harder to beat buy-and-hold</b> than in this game.",
    caveat2:"Therefore, this game's returns <b>do not guarantee real investment performance in any way.</b>",
    otherGame:"Try the Crypto Futures Test",
    cardModalTitle:"📸 Result Card", shareSave:"Save", shareCopy:"Copy", shareNativeBtn:"Share", closeBtn:"Close ✕",
    footerDisclaimer:"For entertainment only — not investment advice. Game results do not guarantee actual trading performance.",
    previewPhase:"Past 1 Year",
    btnPlayLoading:"⏳ Drawing chart…", btnPlayStart:"▶ Start Year Trading",
    btnPlayPause:"⏸ Pause", btnPlayResume:"▶ Resume", btnStep:"⏭ +1 Day",
    toastNoCash:"No cash left 😅", toastNoStock:"No shares held 😅",
    toastFilled:(m,s)=>`${m} ${s} filled (current price)`,
    toastQueued:(m,s)=>`${m} ${s} queued — fills at next candle open`,
    toastModeFull:"Full", toastModePart:"Partial",
    toastSideBuy:"Buy", toastSideSell:"Sell",
    confirmRestart:"Abandon this game and restart?", confirmOk:"Restart", confirmCancel:"Cancel",
    chartRemain:(n)=>`⏳ ${n} days left`,
    chartStart:"▶ Start",
    avgCostLabel:"Avg",
    chartPriceLine:"— Stock Price", chartAssetLine:"— My Equity",
    statTrades:"Trades", statWinRate:"Win Rate", statMdd:"Max Drawdown",
    statTradesVal:(n)=>`${n}`,
    vsMyTrading:(won)=>`🫵 My Trading (final: ${won})`,
    vsSpot:"💎 Just buy-and-hold",
    challengeWin:(me,them)=>`🏆 <b>Victory!</b> You ${me} vs opponent ${them}`,
    challengeLose:(me,them)=>`😭 <b>Defeat...</b> You ${me} vs opponent ${them}`,
    challengeTie:(me)=>`🤝 Draw! Both ${me}`,
    challengeCopied:"✅ Copied! Paste it to your friend.<small>Click again to recopy</small>",
    challengeManual:"Copy the link below and send it to your friend 👇",
    cardSaved:"Image saved! 💾",
    cardCopied:"Card image copied! Paste anywhere 📋",
    cardCopyFail:"This browser doesn't support image copy. Use 'Save' instead 🙏",
    shareText:(grade,ret,bh)=>`📊 Day-Trading Test — Grade ${grade}! 1-year: ${ret} (hold: ${bh}). Try it! ⚔️`,
    shareNativeFallback:"Text and link copied! Paste anywhere to share 📋",
    shareNativeFail:"Sharing not supported. Use the 'Copy' button instead 🙏",
    dashTitle:"📊 My Trading Record",
    dashGames:"Games", dashBeats:"Beat buy-and-hold", dashAlpha:"Avg alpha", dashBest:"Best grade",
    dashGradeEntry:(g)=>`Grade ${g}`,
    dashRowSuffix:(me,hold)=>`Me ${me} / Hold ${hold}`,
    cardFilename:"day-trading-test.png",
    cardTitle:"📉 Trade on Charts — Stock Day-Trading Test",
    cardPeriodLabel:"1-Year Trading",
    cardMyLine:(ret,won)=>`My Trading ${ret}  (${won})`,
    cardSpotLine:(ret)=>`Buy-and-hold: ${ret}`,
    cardStats:(t,w,m)=>`${t} trades      Win rate ${w}      Max DD −${m}%`,
    cardChallengeWin:(them)=>`🏆 Challenge won! Opponent: ${them}`,
    cardChallengeWith:(them)=>`vs opponent ${them}`,
    cardFootnote:"Try it → Stock Day-Trading Aptitude Test",
    challengeArrived:(won)=>`⚔️ <b>Challenge received!</b> Opponent's final equity: <b>${won}</b>. Beat them!`,
    challengeArrivedNoScore:"⚔️ <b>Challenge received!</b> Same chart as your friend.",
    footerData:(date)=>`Simulated trading on real historical prices (Yahoo Finance, split-adjusted) · No fees/taxes · ${date} data`,
    sectorUnit:"sector",
    hudDay:(d,n)=>`Day ${d}/${n}`,
    rPeriod:(from,to)=>`${from} – ${to}`,
    gradePosProfit:(ret,bh)=>`💰 ${ret} profit taken — always right to take profit! But just holding would've given ${bh}, so day-trading score is lower.`,
    gradeProfitC:(bh)=>`💰 Profit is right! Made gains, matching buy-and-hold (${bh}). Not bad. 🙂`,
    gradeComment:{
      SSS:["Beat buy-and-hold by 50%+. A legendary run. 🏆","You dodged the crash perfectly. Did you time-travel? 🛸"],
      SS:["Crushed buy-and-hold. The chart speaks to you. 🔥","Amazing defense in a falling market. Survived and won. 🛡️"],
      S:["...Were you a pro trader before? You crushed the market. 👑","That defense in a crash is elite. Knowing when to exit IS skill. 🏃"],
      A:["Clear day-trading aptitude. Just remember: real trading has fees. 😎","The market fell but you fell less. Survivor king. 🪖"],
      B:["Beat buy-and-hold. Potential showing. 🙂","Losses, but less than hodling. Decent risk sense. 🦊"],
      C:["Should've just bought and slept. Similar score to hold. 😴","Either way, similar losses. All that stress for nothing. 😮‍💨"],
      D:["Your fingers ate your returns. Keep hands away from the buttons. 🫠","Keep catching falling knives. Hands in pockets. 🔪"],
      F:["Congratulations — you were the market's liquidity provider. Trading banned. 🚫","Top-buy, bottom-sell. A textbook example of what not to do. 📚"],
      "?":["Can't measure aptitude without trading. Press some buttons next time. 👀","Can't measure aptitude without trading. Press some buttons next time. 👀"],
    },
    behaviorNoEntry:"👀 Observer mode — never made a trade",
    behaviorOvertrading:(n)=>`🔥 Overtrading alert — ${n} trades in one year`,
    behaviorHodler:"💎 Essentially just buy-and-hold",
    behaviorWinRate:(pct)=>`🎯 ${pct}% sell win rate — solid timing sense`,
    behaviorSummary:(n)=>`✂️ ${n} total trades`,
  },
};
let LOCALE = (() => {
  const s = localStorage.getItem("lang");
  if (s === "ko" || s === "en") return s;
  return navigator.language.startsWith("ko") ? "ko" : "en";
})();
const t = (key) => STRINGS[LOCALE][key];

let MANIFEST = null;

const G = {
  stock: null, stockIdx: 0, start: 0,
  phase: "intro", // intro | preview | ready | playing | done
  day: 0, cash: START_ASSET, shares: 0, avgCost: 0,
  pending: [], trades: [], equityCurve: [],
  sellWins: 0, sellCount: 0, holdDays: 0,
  speed: 1, timer: null, previewTimer: null, paused: false,
  challenge: null, // {g:"idx.start", r: 상대점수|null}
  result: null,
};

// ── 유틸 ──
const pct = (v, digits = 1) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(digits)}%`;

// 원화 표기: 1,234만원 / 1억 2,345만원
function fmtWon(v) {
  const man = Math.round(v / 10000);
  if (Math.abs(man) >= 10000) {
    const eok = Math.floor(Math.abs(man) / 10000) * Math.sign(man);
    const rest = Math.abs(man) % 10000;
    return `${eok.toLocaleString("ko-KR")}억${rest ? " " + rest.toLocaleString("ko-KR") + "만원" : "원"}`;
  }
  return `${man.toLocaleString("ko-KR")}만원`;
}
// 로케일별 금액 표기 (EN: $10,000 시작 기준, ₩10,000,000 = $10,000)
function fmtMoney(v) {
  if (LOCALE === "en") return "$" + Math.round(v / 1000).toLocaleString("en-US");
  return fmtWon(v);
}
const fmtDate = (di) => `${Math.floor(di / 10000)}.${String(Math.floor(di / 100) % 100).padStart(2, "0")}.${String(di % 100).padStart(2, "0")}`;
const bar = (i) => G.start + i; // window 인덱스(음수 = 사전 구간) → 전체 인덱스

// n일 이동평균 (전체 인덱스 기준, 데이터 부족 시 null)
function ma(i, n) {
  if (i - n + 1 < 0) return null;
  let sum = 0;
  for (let k = i - n + 1; k <= i; k++) sum += G.stock.c[k];
  return sum / n;
}

function show(id) {
  ["scr-intro", "scr-game", "scr-result"].forEach((s) => $("#" + s).classList.add("hidden"));
  $("#" + id).classList.remove("hidden");
  window.scrollTo(0, 0);
}

let toastTimer = null;
function toast(msg) {
  $("#g-toast").textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#g-toast").textContent = ""), 1500);
}

// ── 다국어 적용 ──
function applyLocale() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const v = t(el.dataset.i18n);
    if (v !== undefined) el.innerHTML = v;
  });
  if (MANIFEST) $("#f-data").textContent = t("footerData")(MANIFEST.updated);
  const langBtn = $("#btn-lang");
  if (langBtn) langBtn.textContent = LOCALE === "ko" ? "EN" : "KO";
  document.documentElement.lang = LOCALE;
  // 섹터 chip (게임 중에도 즉시 반영)
  if (G.stock && G.phase !== "intro") {
    const sName = LOCALE === "en" ? (SECTOR_EN[G.stock.sector] || G.stock.sector) : G.stock.sector;
    $("#g-sector").textContent = `${SECTOR_EMOJI[G.stock.sector] || "📈"} ${sName} ${t("sectorUnit")}`;
  }
  // 플레이 버튼 텍스트 (동적 상태)
  if (G.phase === "playing") {
    const btn = $("#btn-pause");
    if (btn && !btn.disabled) {
      if (!G.started) btn.textContent = t("btnPlayStart");
      else if (G.paused) btn.textContent = t("btnPlayResume");
      else btn.textContent = t("btnPlayPause");
    }
  }
}

function setLocale(lang) {
  LOCALE = lang;
  try { localStorage.setItem("lang", lang); } catch {}
  applyLocale();
  if (G.phase === "playing" || G.phase === "preview") {
    updateHud();
    if (G.phase === "playing") drawGameChart();
  }
  if (G.phase === "done" && G.result) {
    renderResult();
    drawResultChart();
  }
}

// ── 초기화 ──
async function init() {
  MANIFEST = await (await fetch("data/manifest.json")).json();
  applyLocale();

  const p = new URLSearchParams(location.search);
  if (p.get("g")) {
    G.challenge = { g: p.get("g"), r: p.get("r") ? parseFloat(p.get("r")) : null };
    const b = $("#challenge-banner");
    b.classList.remove("hidden");
    b.innerHTML = G.challenge.r != null
      ? t("challengeArrived")(fmtMoney(G.challenge.r))
      : t("challengeArrivedNoScore");
  }

  renderDash();
  const langBtn = $("#btn-lang");
  if (langBtn) langBtn.onclick = () => setLocale(LOCALE === "ko" ? "en" : "ko");
  $("#btn-start").onclick = startGame;
  $("#btn-restart").onclick = async () => {
    // 진행 중이면 멈춰두고, 취소하면 재개
    const wasRunning = G.phase === "playing" && !G.paused && G.timer;
    if (wasRunning) { clearInterval(G.timer); G.timer = null; }
    const ok = await askConfirm(t("confirmRestart"), t("confirmOk"));
    if (ok) { startGame(); return; }
    if (wasRunning) { G.timer = setInterval(tick, 250 / G.speed); }
  };
  $("#btn-again").onclick = () => {
    G.challenge = null;
    history.replaceState(null, "", location.pathname);
    startGame();
  };
  $("#btn-card").onclick = saveCard;
  $("#btn-card-save").onclick = downloadCard;
  $("#btn-card-copy").onclick = copyCard;
  $("#btn-share-native").onclick = shareNative;
  $("#btn-card-close").onclick = closeCardModal;
  $("#card-modal").addEventListener("click", (e) => {
    if (e.target === $("#card-modal")) closeCardModal(); // 배경 클릭 시 닫기
  });
  $("#btn-challenge").onclick = shareChallenge;
  document.querySelectorAll(".speed button").forEach((b) => {
    b.onclick = () => {
      document.querySelectorAll(".speed button").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      G.speed = parseFloat(b.dataset.sp);
      if (G.timer) { clearInterval(G.timer); G.timer = setInterval(tick, 250 / G.speed); }
    };
  });
  $("#btn-buy-part").onclick = () => order("buy", "part");
  $("#btn-buy-full").onclick = () => order("buy", "full");
  $("#btn-sell-part").onclick = () => order("sell", "part");
  $("#btn-sell-full").onclick = () => order("sell", "full");
  $("#btn-pause").onclick = togglePause;
  $("#btn-step").onclick = stepDay;
  $("#btn-copyurl").onclick = () => {
    const inp = $("#challenge-url");
    inp.focus(); inp.select();
    try { document.execCommand("copy"); challengeMsg(t("challengeCopied")); } catch {}
  };
}

function challengeMsg(text) {
  const m = $("#challenge-msg");
  m.textContent = text;
  m.classList.remove("hidden");
}

// 내부 확인 팝업 (window.confirm 대체) → Promise<boolean>
function askConfirm(msg, okLabel = "확인") {
  return new Promise((resolve) => {
    const modal = $("#confirm-modal"), ok = $("#confirm-ok"), cancel = $("#confirm-cancel");
    $("#confirm-msg").textContent = msg;
    ok.textContent = okLabel;
    modal.classList.remove("hidden");
    const done = (v) => {
      modal.classList.add("hidden");
      ok.onclick = cancel.onclick = modal.onclick = null;
      resolve(v);
    };
    ok.onclick = () => done(true);
    cancel.onclick = () => done(false);
    modal.onclick = (e) => { if (e.target === modal) done(false); }; // 배경 클릭 = 취소
  });
}

// 일시정지 중 하루씩 진행 (게임이 시작된 이후에만)
function stepDay() {
  if (G.phase !== "playing" || !G.paused || !G.started) return;
  tick();
}

function togglePause() {
  if (G.phase !== "playing") return;
  const btn = $("#btn-pause");
  // 최초 재생 = 1년 단타 시작
  if (!G.started) {
    G.started = true;
    G.paused = false;
    gaEvent("game_start", { challenge_mode: G.challenge ? "challenge" : "standard" });
    $("#start-hint").classList.add("hidden");
    btn.textContent = t("btnPlayPause");
    btn.className = "";
    $("#btn-step").disabled = true;
    G.timer = setInterval(tick, 250 / G.speed);
    return;
  }
  if (G.paused) {
    G.paused = false;
    btn.textContent = t("btnPlayPause");
    btn.classList.remove("paused");
    G.timer = setInterval(tick, 250 / G.speed);
  } else {
    G.paused = true;
    btn.textContent = t("btnPlayResume");
    btn.classList.add("paused");
    clearInterval(G.timer); G.timer = null;
  }
  $("#btn-step").disabled = !G.paused;
}

// ── 게임 시작 (사전 차트 공개 단계) ──
async function startGame() {
  clearInterval(G.timer); G.timer = null;
  clearInterval(G.previewTimer); G.previewTimer = null;

  let idx, start;
  if (G.challenge) {
    [idx, start] = G.challenge.g.split(".").map(Number);
  } else {
    idx = Math.floor(Math.random() * MANIFEST.stocks.length);
  }
  const stock = await (await fetch(`data/${idx}.json`)).json();
  const minStart = PRE + 120; // 사전 구간 전체에서 120일선까지 그려지도록
  const maxStart = stock.d.length - N - 1;
  if (start == null || isNaN(start) || start < minStart || start > maxStart) {
    start = minStart + Math.floor(Math.random() * (maxStart - minStart + 1));
  }

  Object.assign(G, {
    stock, stockIdx: idx, start, phase: "preview", paused: false, started: false,
    day: 0, cash: START_ASSET, shares: 0, avgCost: 0,
    pending: [], trades: [], equityCurve: [START_ASSET],
    sellWins: 0, sellCount: 0, holdDays: 0, result: null,
  });

  const sName = LOCALE === "en" ? (SECTOR_EN[stock.sector] || stock.sector) : stock.sector;
  $("#g-sector").textContent = `${SECTOR_EMOJI[stock.sector] || "📈"} ${sName} ${t("sectorUnit")}`;
  $("#g-day").textContent = t("previewPhase");
  // 미리보기 단계에서도 본게임 UI를 그대로 노출 (버튼은 사전 차트 그리는 동안만 잠금)
  $("#play-ui").classList.remove("hidden");
  $("#start-hint").classList.remove("hidden");
  const pBtn = $("#btn-pause");
  pBtn.textContent = t("btnPlayLoading");
  pBtn.className = "start";
  pBtn.disabled = true;
  $("#btn-step").disabled = true;
  ["#btn-buy-part", "#btn-buy-full", "#btn-sell-part", "#btn-sell-full"].forEach((s) => ($(s).disabled = true));
  show("scr-game");

  // 직전 1년 차트 빠른 스윕 (약 1초)
  let k = 0;
  G.previewTimer = setInterval(() => {
    k = Math.min(k + 9, PRE);
    drawPreviewChart(k);
    if (k >= PRE) {
      clearInterval(G.previewTimer); G.previewTimer = null;
      enterReady();
    }
  }, 30);
}

// ── 사전 차트 완성 → 매매 가능한 일시정지 상태로 대기 ──
function enterReady() {
  G.phase = "playing"; // 매매 허용 (단, 시계는 멈춰 있음)
  G.paused = true;
  G.started = false;
  const pBtn = $("#btn-pause");
  pBtn.textContent = t("btnPlayStart");
  pBtn.className = "start";
  pBtn.disabled = false;
  $("#btn-step").disabled = true;
  drawGameChart(); // 첫 봉(Day 1) 공개
  updateHud();     // 매수 버튼 활성화
}

// ── 주문 (분할 = 총자산의 1/4, 풀 = 전부 / 다음 봉 시가 체결) ──
function order(side, mode) {
  if (G.phase !== "playing") return;
  if (side === "buy" && G.cash < 1) return toast(t("toastNoCash"));
  if (side === "sell" && G.shares <= 0) return toast(t("toastNoStock"));
  const modeStr = mode === "full" ? t("toastModeFull") : t("toastModePart");
  const sideStr = side === "buy" ? t("toastSideBuy") : t("toastSideSell");
  if (G.paused) {
    execute(side, mode, G.stock.c[bar(G.day)], G.day);
    updateHud();
    drawGameChart();
    toast(t("toastFilled")(modeStr, sideStr));
    return;
  }
  G.pending.push({ side, mode });
  toast(t("toastQueued")(modeStr, sideStr));
}

function execute(side, mode, price, dayIdx) {
  const equity = G.cash + G.shares * price;
  const chunk = equity / 4; // 분할 단위 = 총자산의 1/4
  if (side === "buy") {
    if (G.cash < 1) return;
    let amount = mode === "full" ? G.cash : Math.min(G.cash, chunk);
    if (G.cash - amount < equity * 0.05) amount = G.cash; // 자투리 현금은 함께 매수
    const qty = amount / price;
    G.avgCost = G.shares + qty > 0 ? (G.avgCost * G.shares + amount) / (G.shares + qty) : 0;
    G.cash -= amount; G.shares += qty;
    G.trades.push({ day: dayIdx, side, price });
  } else {
    if (G.shares <= 0) return;
    let qty = mode === "full" ? G.shares : Math.min(G.shares, chunk / price);
    if ((G.shares - qty) * price < equity * 0.05) qty = G.shares; // 자투리 주식은 함께 매도
    G.cash += qty * price;
    G.sellCount++;
    if (price > G.avgCost) G.sellWins++;
    G.shares -= qty;
    if (G.shares < 1e-9) { G.shares = 0; G.avgCost = 0; }
    G.trades.push({ day: dayIdx, side, price });
  }
}

// ── 게임 루프 ──
function tick() {
  G.day++;
  const i = bar(G.day);
  const s = G.stock;

  for (const od of G.pending) execute(od.side, od.mode, s.o[i], G.day);
  G.pending = [];

  if (G.shares > 0) G.holdDays++;
  G.equityCurve.push(G.cash + G.shares * s.c[i]);

  updateHud();
  drawGameChart();

  if (G.day >= N - 1) endGame();
}

function updateHud() {
  const i = bar(G.day);
  const stockVal = G.shares * G.stock.c[i];
  const equity = G.cash + stockVal;
  const ret = equity / START_ASSET - 1;
  $("#g-day").textContent = t("hudDay")(G.day + 1, N);
  $("#g-equity").textContent = fmtMoney(equity);
  const r = $("#g-ret");
  r.textContent = pct(ret);
  r.className = ret >= 0 ? "plus" : "minus";

  // 버튼 게이지: 매수 = 현금 비중, 매도 = 주식 비중
  const cashRatio = equity > 0 ? (G.cash / equity) * 100 : 0;
  const stockRatio = equity > 0 ? (stockVal / equity) * 100 : 0;
  document.querySelectorAll(".gg-buy").forEach((g) => (g.style.width = cashRatio + "%"));
  document.querySelectorAll(".gg-sell").forEach((g) => (g.style.width = stockRatio + "%"));

  const noCash = G.cash < 1, noStock = G.shares <= 0;
  $("#btn-buy-part").disabled = noCash;
  $("#btn-buy-full").disabled = noCash;
  $("#btn-sell-part").disabled = noStock;
  $("#btn-sell-full").disabled = noStock;

  // 보유 중엔 평단 대비 수익률 크게
  const big = $("#g-bigret");
  if (G.shares > 0) {
    const posRet = G.stock.c[i] / G.avgCost - 1;
    big.classList.remove("hidden");
    big.className = "big-ret " + (posRet >= 0 ? "plus" : "minus");
    big.querySelector("b").textContent = pct(posRet);
  } else {
    big.classList.add("hidden");
  }
}

// ── 차트 공통 그리기 ──
// days: 표시할 window 인덱스 배열(음수 = 사전 구간)
// 옵션: markers 매매 마커 / totalSlots 가로축 고정 봉 수(빈 오른쪽 = 남은 시간)
//       mini 오버뷰 모드(라벨 생략) / showRemain 남은 일수 표시 / zoomWin [d0,d1] 확대 구간 하이라이트
function drawCandles(cv, days, { markers = true, totalSlots = null, mini = false, showRemain = false, zoomWin = null } = {}) {
  const ctx = cv.getContext("2d");
  const W = cv.width, H = cv.height;
  ctx.clearRect(0, 0, W, H);
  const s = G.stock;
  const slots = totalSlots || days.length;

  let lo = Infinity, hi = -Infinity;
  for (const d of days) {
    lo = Math.min(lo, s.l[bar(d)]); hi = Math.max(hi, s.h[bar(d)]);
    for (const n of [20, 60, 120]) {
      const m = ma(bar(d), n);
      if (m != null) { lo = Math.min(lo, m); hi = Math.max(hi, m); }
    }
  }
  const padY = (hi - lo) * 0.08 || 1;
  lo -= padY; hi += padY;

  const padL = 8, padR = mini ? 10 : 64, padT = mini ? 8 : 26, padB = mini ? 12 : 10;
  const cw = (W - padL - padR) / slots;
  const x = (k) => padL + k * cw + cw / 2;
  const y = (v) => padT + (H - padT - padB) * (1 - (v - lo) / (hi - lo));

  // 확대 구간 하이라이트 (오버뷰)
  if (zoomWin) {
    const k0 = days.indexOf(zoomWin[0]), k1 = days.indexOf(zoomWin[1]);
    if (k0 >= 0 && k1 >= 0) {
      ctx.fillStyle = "#ffd84d14";
      ctx.fillRect(x(k0) - cw / 2, padT, x(k1) - x(k0) + cw, H - padT - padB);
      ctx.strokeStyle = "#ffd84d33"; ctx.lineWidth = 1;
      ctx.strokeRect(x(k0) - cw / 2, padT, x(k1) - x(k0) + cw, H - padT - padB);
    }
  }

  // 그리드
  ctx.strokeStyle = "#1e2447"; ctx.lineWidth = 1;
  for (let g = 1; g <= 3; g++) {
    const gy = padT + ((H - padT - padB) * g) / 4;
    ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(W - padR, gy); ctx.stroke();
  }

  // 사전/게임 구간 경계선 (Day 1)
  const zeroK = days.indexOf(0);
  if (zeroK > 0) {
    ctx.strokeStyle = "#ffd84d44"; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(x(zeroK) - cw / 2, padT); ctx.lineTo(x(zeroK) - cw / 2, H - padB); ctx.stroke();
    ctx.setLineDash([]);
    if (mini) {
      ctx.fillStyle = "#ffd84d66"; ctx.font = "10px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(t("chartStart"), x(zeroK) + 3, padT + 9);
    }
  }

  // 진행 바 (오버뷰 하단)
  if (mini && totalSlots && G.phase === "playing") {
    const gx0 = zeroK >= 0 ? x(zeroK) - cw / 2 : padL;
    const gx1 = W - padR;
    const prog = (G.day + 1) / N;
    ctx.fillStyle = "#1e2447";
    ctx.fillRect(gx0, H - 7, gx1 - gx0, 4);
    ctx.fillStyle = "#ffd84d";
    ctx.fillRect(gx0, H - 7, (gx1 - gx0) * prog, 4);
  }

  // 남은 거래일 (확대 차트 상단)
  if (showRemain && G.phase === "playing") {
    ctx.save();
    ctx.font = "800 30px sans-serif"; ctx.textAlign = "right";
    ctx.shadowColor = "#0a0d18"; ctx.shadowBlur = 6;
    ctx.fillStyle = "#ffd84d";
    ctx.fillText(t("chartRemain")(N - 1 - G.day), W - 12, 34);
    ctx.restore();
  }

  // 캔들
  days.forEach((d, k) => {
    const i = bar(d);
    const up = s.c[i] >= s.o[i];
    ctx.strokeStyle = ctx.fillStyle = up ? "#ff4d4d" : "#4d7fff";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x(k), y(s.h[i])); ctx.lineTo(x(k), y(s.l[i])); ctx.stroke();
    const bodyTop = y(Math.max(s.o[i], s.c[i])), bodyBot = y(Math.min(s.o[i], s.c[i]));
    const bw = Math.max(cw * 0.64, 0.9);
    ctx.fillRect(x(k) - bw / 2, bodyTop, bw, Math.max(1, bodyBot - bodyTop));
  });

  // 이동평균선
  const drawMa = (n, color) => {
    ctx.beginPath();
    let started = false;
    days.forEach((d, k) => {
      const v = ma(bar(d), n);
      if (v == null) return;
      if (!started) { ctx.moveTo(x(k), y(v)); started = true; }
      else ctx.lineTo(x(k), y(v));
    });
    ctx.strokeStyle = color; ctx.lineWidth = mini ? 1 : 1.5; ctx.stroke();
  };
  drawMa(20, "#ffd84d");
  drawMa(60, "#b86bff");
  drawMa(120, "#2ec8a6");

  // 매매 마커
  if (markers) {
    ctx.textAlign = "center";
    for (const t of G.trades) {
      const k = days.indexOf(t.day);
      if (k < 0) continue;
      const i = bar(t.day);
      const buy = t.side === "buy";
      const mx = x(k), my = buy ? y(s.l[i]) + (mini ? 9 : 20) : y(s.h[i]) - (mini ? 3 : 8);
      ctx.fillStyle = buy ? "#ff4d4d" : "#4d7fff";
      if (mini) {
        ctx.font = "9px sans-serif";
        ctx.fillText(buy ? "▲" : "▼", mx, my);
      } else {
        // 확대 차트: 글로우 + 흰 외곽선으로 강조
        ctx.save();
        ctx.font = "900 19px sans-serif";
        ctx.shadowColor = buy ? "#ff4d4d" : "#4d7fff";
        ctx.shadowBlur = 8;
        ctx.fillText(buy ? "▲" : "▼", mx, my);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#ffffffcc"; ctx.lineWidth = 1;
        ctx.strokeText(buy ? "▲" : "▼", mx, my);
        ctx.restore();
      }
    }
  }

  // 현재가 라벨 + 평단가 라인 (확대 차트만)
  if (!mini) {
    const lastD = days[days.length - 1];
    const cur = s.c[bar(lastD)];
    ctx.fillStyle = "#ffd84d"; ctx.font = "700 13px sans-serif"; ctx.textAlign = "left";
    ctx.fillText(cur >= 100 ? cur.toFixed(0) : cur.toFixed(2), W - padR + 6, y(cur) + 4);
    ctx.strokeStyle = "#ffd84d33";
    ctx.beginPath(); ctx.moveTo(padL, y(cur)); ctx.lineTo(W - padR, y(cur)); ctx.stroke();

    if (G.shares > 0) {
      const ay = y(G.avgCost);
      ctx.strokeStyle = "#ffffffdd"; ctx.lineWidth = 2; ctx.setLineDash([7, 5]);
      ctx.beginPath(); ctx.moveTo(padL, ay); ctx.lineTo(W - padR, ay); ctx.stroke();
      ctx.setLineDash([]); ctx.lineWidth = 1;
      // 평단 라벨 (좌측 배지)
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 12px sans-serif"; ctx.textAlign = "left";
      const label = `${t("avgCostLabel")} ${G.avgCost >= 100 ? G.avgCost.toFixed(0) : G.avgCost.toFixed(2)}`;
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = "#ffffff22";
      ctx.fillRect(padL + 2, ay - 16, tw + 10, 16);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, padL + 7, ay - 4);
    }
  }
}

// 사전 1년 + 게임 1년 = 2년 고정축
const TOTAL_SLOTS = PRE + N;
const ZOOM = 60; // 확대 차트에 보여줄 최근 봉 수

// 듀얼뷰: 위 = 2년 오버뷰, 아래 = 최근 60봉 확대
function drawDual(endDay, { sweep = false } = {}) {
  const full = [];
  for (let d = -PRE; d <= endDay; d++) full.push(d);
  if (full.length < 2) return;
  const zoom = full.slice(-ZOOM);
  drawCandles($("#g-chart-full"), full, {
    markers: !sweep, totalSlots: TOTAL_SLOTS, mini: true,
    zoomWin: [zoom[0], zoom[zoom.length - 1]],
  });
  drawCandles($("#g-chart"), zoom, { markers: !sweep, showRemain: true });
}

// 사전 1년 스윕 (진행도 k)
function drawPreviewChart(k) {
  drawDual(-PRE + k - 1, { sweep: true });
}

// 플레이 중
function drawGameChart() {
  drawDual(G.day);
}

// ── 종료 ──
function endGame() {
  clearInterval(G.timer); G.timer = null;
  G.phase = "done";
  const s = G.stock;
  const lastC = s.c[bar(N - 1)];

  if (G.shares > 0) {
    G.cash += G.shares * lastC;
    G.sellCount++; if (lastC > G.avgCost) G.sellWins++;
    G.shares = 0;
  }
  const equity = G.cash;
  const myRet = equity / START_ASSET - 1;
  const bhRet = lastC / s.o[G.start] - 1;
  const alpha = myRet - bhRet;

  let peak = -Infinity, mdd = 0;
  for (const v of G.equityCurve) {
    peak = Math.max(peak, v);
    mdd = Math.max(mdd, 1 - v / peak);
  }

  const grade =
    G.trades.length === 0 ? "?" :
    alpha >= 0.50 ? "SSS" : alpha >= 0.35 ? "SS" : alpha >= 0.20 ? "S" :
    alpha >= 0.10 ? "A" : alpha >= 0.03 ? "B" :
    alpha > -0.03 ? "C" : alpha > -0.15 ? "D" : "F";

  G.result = { equity, myRet, bhRet, alpha, mdd, grade, nTrades: G.trades.length,
    winRate: G.sellCount ? G.sellWins / G.sellCount : null };

  gaEvent("game_complete", {
    grade,
    return_pct: Number((myRet * 100).toFixed(2)),
    benchmark_return_pct: Number((bhRet * 100).toFixed(2)),
    alpha_pct: Number((alpha * 100).toFixed(2)),
    trade_count: G.trades.length,
  });
  saveHistory();
  renderResult();
}

function gradeComment(r) {
  if (r.myRet > 0 && (r.grade === "D" || r.grade === "F")) {
    return t("gradePosProfit")(pct(r.myRet), pct(r.bhRet));
  }
  if (r.myRet > 0 && r.grade === "C") {
    return t("gradeProfitC")(pct(r.bhRet));
  }
  return t("gradeComment")[r.grade][r.myRet < 0 ? 1 : 0];
}

function behaviorTag() {
  const r = G.result;
  if (r.nTrades === 0) return t("behaviorNoEntry");
  if (r.nTrades >= 40) return t("behaviorOvertrading")(r.nTrades);
  if (G.holdDays >= N * 0.9 && r.nTrades <= 3) return t("behaviorHodler");
  if (r.winRate != null && r.winRate >= 0.6) return t("behaviorWinRate")((r.winRate * 100).toFixed(0));
  return t("behaviorSummary")(r.nTrades);
}

function renderResult() {
  const s = G.stock, r = G.result;
  show("scr-result");
  $("#challenge-msg").classList.add("hidden");
  $("#challenge-copy").classList.add("hidden");
  $("#btn-challenge").innerHTML = t("btnChallenge");

  $("#r-name").textContent = `${SECTOR_EMOJI[s.sector] || "📈"} ${s.name} (${s.t})`;
  $("#r-period").textContent = t("rPeriod")(fmtDate(s.d[G.start]), fmtDate(s.d[bar(N - 1)]));
  $("#r-grade").textContent = r.grade;
  $("#r-comment").innerHTML = gradeComment(r) + '<br><span class="r-behavior">' + behaviorTag() + "</span>";

  const row = (label, ret, me) =>
    `<div class="row${me ? " me" : ""}"><span>${label}</span><b class="${ret >= 0 ? "plus" : "minus"}">${pct(ret)}</b></div>`;
  $("#r-vs").innerHTML =
    row(t("vsMyTrading")(fmtMoney(r.equity)), r.myRet, true) +
    row(t("vsSpot"), r.bhRet);

  $("#r-stats").innerHTML = `
    <div class="stat"><span>${t("statTrades")}</span><b>${t("statTradesVal")(r.nTrades)}</b></div>
    <div class="stat"><span>${t("statWinRate")}</span><b>${r.winRate == null ? "-" : (r.winRate * 100).toFixed(0) + "%"}</b></div>
    <div class="stat"><span>${t("statMdd")}</span><b>-${(r.mdd * 100).toFixed(1)}%</b></div>`;

  const cEl = $("#r-challenge");
  if (G.challenge && G.challenge.r != null) {
    const mine = r.equity, theirs = G.challenge.r;
    cEl.classList.remove("hidden");
    cEl.innerHTML = mine > theirs
      ? t("challengeWin")(fmtMoney(mine), fmtMoney(theirs))
      : mine < theirs
      ? t("challengeLose")(fmtMoney(mine), fmtMoney(theirs))
      : t("challengeTie")(fmtMoney(mine));
  } else cEl.classList.add("hidden");

  drawResultChart();
}

// 결과 곡선(주가 vs 내 자산) — 화면/카드 공용.
// 주가뿐 아니라 자산 곡선까지 포함해 Y축 스케일을 잡아 그래프가 잘리지 않게 한다.
function paintResultCurves(ctx, ox, oy, w, h, big = false) {
  const s = G.stock;
  const closes = [];
  for (let d = 0; d < N; d++) closes.push(s.c[bar(d)]);
  const eq = G.equityCurve.map((v) => (v / START_ASSET) * s.o[G.start]);
  let lo = Math.min(Math.min(...closes), Math.min(...eq));
  let hi = Math.max(Math.max(...closes), Math.max(...eq));
  const span = (hi - lo) || 1;
  lo -= span * 0.08; hi += span * 0.08; // 마커/선 두께 여유
  const pad = big ? 24 : 14;
  const x = (d) => ox + pad + (d / (N - 1)) * (w - pad * 2);
  const y = (v) => oy + pad + (h - pad * 2) * (1 - (v - lo) / (hi - lo));

  ctx.beginPath();
  closes.forEach((v, d) => (d ? ctx.lineTo(x(d), y(v)) : ctx.moveTo(x(d), y(v))));
  ctx.strokeStyle = "#8b93b8"; ctx.lineWidth = big ? 2.5 : 2; ctx.stroke();

  ctx.beginPath();
  eq.forEach((v, d) => (d ? ctx.lineTo(x(d), y(v)) : ctx.moveTo(x(d), y(v))));
  ctx.strokeStyle = "#ffd84d"; ctx.lineWidth = big ? 3.5 : 2.5; ctx.stroke();

  ctx.font = `${big ? 19 : 13}px sans-serif`; ctx.textAlign = "center";
  for (const t of G.trades) {
    ctx.fillStyle = t.side === "buy" ? "#ff4d4d" : "#4d7fff";
    const off = t.side === "buy" ? (big ? 24 : 16) : (big ? -12 : -8);
    ctx.fillText(t.side === "buy" ? "▲" : "▼", x(t.day), y(closes[t.day]) + off);
  }

  ctx.textAlign = "left"; ctx.font = `${big ? 20 : 12}px sans-serif`;
  ctx.fillStyle = "#8b93b8"; ctx.fillText(t("chartPriceLine"), ox + pad + 4, oy + (big ? 30 : 18));
  ctx.fillStyle = "#ffd84d"; ctx.fillText(t("chartAssetLine"), ox + pad + (big ? 110 : 60), oy + (big ? 30 : 18));
}

function drawResultChart() {
  const cv = $("#r-chart"), ctx = cv.getContext("2d");
  ctx.clearRect(0, 0, cv.width, cv.height);
  paintResultCurves(ctx, 0, 0, cv.width, cv.height, false);
}

// ── 기록 (localStorage) ──
function saveHistory() {
  try {
    const h = JSON.parse(localStorage.getItem("dt_history") || "[]");
    h.unshift({
      ts: Date.now(), name: G.stock.name, t: G.stock.t,
      ret: G.result.myRet, bh: G.result.bhRet, grade: G.result.grade,
    });
    localStorage.setItem("dt_history", JSON.stringify(h.slice(0, 50)));
  } catch {}
}

function renderDash() {
  let h = [];
  try { h = JSON.parse(localStorage.getItem("dt_history") || "[]"); } catch {}
  if (!h.length) return;
  const dash = $("#dash");
  dash.classList.remove("hidden");
  const beats = h.filter((x) => x.ret > x.bh).length;
  const avgAlpha = h.reduce((a, x) => a + (x.ret - x.bh), 0) / h.length;
  const order = ["SSS", "SS", "S", "A", "B", "C", "D", "F"];
  const best = order.find((g) => h.some((x) => x.grade === g)) || "-";
  dash.innerHTML = `
    <h3>${t("dashTitle")}</h3>
    <div class="sum">
      <span>${t("dashGames")} <b>${h.length}</b></span>
      <span>${t("dashBeats")} <b>${((beats / h.length) * 100).toFixed(0)}%</b></span>
      <span>${t("dashAlpha")} <b>${pct(avgAlpha)}</b></span>
      <span>${t("dashBest")} <b>${best}</b></span>
    </div>
    ${h.slice(0, 5).map((x) =>
      `<div class="hist"><span>${t("dashGradeEntry")(x.grade)} · ${x.name}</span><span>${t("dashRowSuffix")(pct(x.ret), pct(x.bh))}</span></div>`
    ).join("")}`;
}

// ── 공유 ──
function challengeUrl() {
  return `${location.origin}${location.pathname}?g=${G.stockIdx}.${G.start}&r=${Math.round(G.result.equity)}`;
}

async function shareChallenge() {
  const r = G.result;
  const text = t("shareText")(r.grade, pct(r.myRet), pct(r.bhRet));
  const url = challengeUrl();
  const btn = $("#btn-challenge");
  const COPIED = t("challengeCopied");
  // 클릭 즉시 도전장(메시지+링크) 복사 → 버튼 문구로 안내. 다시 눌러도 재복사됨
  try {
    await navigator.clipboard.writeText(text + "\n" + url);
    btn.innerHTML = COPIED;
    gaEvent("challenge_copy", { grade: r.grade });
    return;
  } catch {}
  // 폴백: 링크 입력칸 노출 (클립보드 권한이 막힌 환경)
  const box = $("#challenge-copy");
  box.classList.remove("hidden");
  const inp = $("#challenge-url");
  inp.value = url;
  inp.focus(); inp.select();
  try {
    document.execCommand("copy");
    btn.innerHTML = COPIED;
    gaEvent("challenge_copy", { grade: r.grade });
  } catch {
    challengeMsg(t("challengeManual"));
  }
}

function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(" ");
  let line = "", yy = y;
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy); line = w; yy += lh;
    } else line = test;
  }
  ctx.fillText(line, x, yy);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function saveCard() {
  const r = G.result, s = G.stock;
  const cv = $("#card-canvas"), ctx = cv.getContext("2d");
  const W = 1080, H = 1480;
  cv.width = W; cv.height = H;
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#131830"); bg.addColorStop(1, "#0a0d18");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffd84d"; ctx.font = "700 36px Pretendard, sans-serif";
  ctx.fillText(t("cardTitle"), W / 2, 90);

  // 등급 배지
  ctx.strokeStyle = "#ffd84d"; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(W / 2, 250, 118, 0, Math.PI * 2); ctx.stroke();
  const gradeFontSize = r.grade.length === 3 ? 105 : r.grade.length === 2 ? 130 : 150;
  ctx.fillStyle = "#ffd84d"; ctx.font = `900 ${gradeFontSize}px Pretendard, sans-serif`;
  ctx.fillText(r.grade, W / 2, 303);

  // 종목 공개
  ctx.fillStyle = "#eef1ff"; ctx.font = "700 46px Pretendard, sans-serif";
  ctx.fillText(`${s.name} (${s.t}) ${t("cardPeriodLabel")}`, W / 2, 452);
  ctx.fillStyle = "#8b93b8"; ctx.font = "400 32px Pretendard, sans-serif";
  ctx.fillText(`${fmtDate(s.d[G.start])} ~ ${fmtDate(s.d[bar(N - 1)])}`, W / 2, 506);

  // 수익률 비교
  ctx.font = "700 50px Pretendard, sans-serif";
  ctx.fillStyle = r.myRet >= 0 ? "#ff4d4d" : "#4d7fff";
  ctx.fillText(t("cardMyLine")(pct(r.myRet), fmtMoney(r.equity)), W / 2, 592);
  ctx.fillStyle = "#8b93b8"; ctx.font = "400 38px Pretendard, sans-serif";
  ctx.fillText(t("cardSpotLine")(pct(r.bhRet)), W / 2, 646);

  // 코멘트
  ctx.fillStyle = "#ffd84d"; ctx.font = "400 32px Pretendard, sans-serif";
  wrapText(ctx, gradeComment(r), W / 2, 714, W - 130, 44);

  // 매매 마커가 찍힌 차트 (주가 vs 내 자산)
  const cx = 70, cy = 800, cwd = W - 140, chh = 420;
  ctx.fillStyle = "#0f1430";
  roundRect(ctx, cx, cy, cwd, chh, 18); ctx.fill();
  paintResultCurves(ctx, cx, cy, cwd, chh, true);

  // 통계
  ctx.textAlign = "center"; ctx.fillStyle = "#8b93b8"; ctx.font = "400 30px Pretendard, sans-serif";
  const winTxt = r.winRate == null ? "-" : (r.winRate * 100).toFixed(0) + "%";
  ctx.fillText(t("cardStats")(r.nTrades, winTxt, (r.mdd * 100).toFixed(1)), W / 2, 1300);

  // 도전 결과(있으면)
  if (G.challenge && G.challenge.r != null) {
    const win = r.equity > G.challenge.r;
    ctx.fillStyle = win ? "#ff4d4d" : "#4d7fff";
    ctx.font = "700 34px Pretendard, sans-serif";
    ctx.fillText(win ? t("cardChallengeWin")(fmtMoney(G.challenge.r)) : t("cardChallengeWith")(fmtMoney(G.challenge.r)), W / 2, 1360);
  }

  ctx.fillStyle = "#4a5278"; ctx.font = "400 26px Pretendard, sans-serif";
  ctx.fillText(t("cardFootnote"), W / 2, 1430);

  const blob = await new Promise((res) => cv.toBlob(res, "image/png"));
  openCardModal(blob);
}

// ── 결과 카드 팝업 (시스템 창 대신 내부 팝업) ──
let CARD_BLOB = null, CARD_URL = null;

function cardModalMsg(text) {
  $("#card-modal-msg").textContent = text || "";
}

function openCardModal(blob) {
  CARD_BLOB = blob;
  if (CARD_URL) URL.revokeObjectURL(CARD_URL);
  CARD_URL = URL.createObjectURL(blob);
  $("#card-preview").src = CARD_URL;
  cardModalMsg("");
  $("#card-modal").classList.remove("hidden");
}

function closeCardModal() {
  $("#card-modal").classList.add("hidden");
}

function downloadCard() {
  if (!CARD_BLOB) return;
  const a = document.createElement("a");
  a.href = CARD_URL;
  a.download = t("cardFilename");
  a.click();
  gaEvent("card_save", { grade: G.result?.grade || "unknown" });
  cardModalMsg(t("cardSaved"));
}

async function shareNative() {
  const r = G.result;
  if (!r) return;
  const url = location.origin + location.pathname;
  const text = t("shareText")(r.grade, pct(r.myRet), pct(r.bhRet));
  try {
    if (navigator.share) {
      const shareData = { text, url };
      if (CARD_BLOB && navigator.canShare) {
        const file = new File([CARD_BLOB], t("cardFilename"), { type: "image/png" });
        if (navigator.canShare({ files: [file] })) shareData.files = [file];
      }
      await navigator.share(shareData);
      gaEvent("card_share", { platform: "native", grade: r.grade });
      return;
    }
  } catch (e) {
    if (e.name === "AbortError") return;
  }
  try {
    await navigator.clipboard.writeText(text + "\n" + url);
    cardModalMsg(t("shareNativeFallback"));
  } catch {
    cardModalMsg(t("shareNativeFail"));
  }
  gaEvent("card_share", { platform: "clipboard_fallback", grade: r.grade });
}

async function copyCard() {
  if (!CARD_BLOB) return;
  try {
    if (!navigator.clipboard || !window.ClipboardItem) throw new Error("unsupported");
    await navigator.clipboard.write([new ClipboardItem({ "image/png": CARD_BLOB })]);
    gaEvent("card_copy", { grade: G.result?.grade || "unknown" });
    cardModalMsg(t("cardCopied"));
  } catch {
    cardModalMsg(t("cardCopyFail"));
  }
}

init().catch(() => {
  document.body.innerHTML = "<p style='padding:40px;text-align:center'>데이터를 불러오지 못했어요 😢</p>";
});
