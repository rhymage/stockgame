// 차트만 보고 매매하는 - 단타 적성검사 — 게임 엔진
const $ = (s) => document.querySelector(s);
const N = 252;      // 게임 구간: 1년 = 252봉
const PRE = 252;    // 사전 공개 구간: 직전 1년
const START_ASSET = 10000000; // 가상자금 1,000만원

const SECTOR_EMOJI = {
  "빅테크": "🖥️", "반도체": "🔬", "소프트웨어/클라우드": "☁️", "인터넷/플랫폼": "🌐",
  "핀테크/결제": "💳", "전기차/자동차": "🚗", "소비재/유통": "🛒", "식음료": "🍔",
  "헬스케어/제약": "💊", "금융": "🏦", "에너지": "🛢️", "산업재": "🏗️",
  "여행/항공": "✈️", "미디어/통신": "📡",
};

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

// ── 초기화 ──
async function init() {
  MANIFEST = await (await fetch("data/manifest.json")).json();
  $("#f-updated").textContent = MANIFEST.updated + " 데이터";

  const p = new URLSearchParams(location.search);
  if (p.get("g")) {
    G.challenge = { g: p.get("g"), r: p.get("r") ? parseFloat(p.get("r")) : null };
    const b = $("#challenge-banner");
    b.classList.remove("hidden");
    b.innerHTML = G.challenge.r != null
      ? `⚔️ <b>도전장 도착!</b> 상대의 최종 자산은 <b>${fmtWon(G.challenge.r)}</b>. 같은 차트로 이겨보세요.`
      : `⚔️ <b>도전장 도착!</b> 친구와 같은 차트로 대결합니다.`;
  }

  renderDash();
  $("#btn-start").onclick = startGame;
  $("#btn-restart").onclick = async () => {
    // 진행 중이면 멈춰두고, 취소하면 재개
    const wasRunning = G.phase === "playing" && !G.paused && G.timer;
    if (wasRunning) { clearInterval(G.timer); G.timer = null; }
    const ok = await askConfirm("이 판을 버리고 다시 시작할까요?", "다시 시작");
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
    try { document.execCommand("copy"); challengeMsg("복사됐어요! 친구에게 보내세요 ⚔️"); } catch {}
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
    $("#start-hint").classList.add("hidden");
    btn.textContent = "⏸ 정지";
    btn.className = "";
    $("#btn-step").disabled = true;
    G.timer = setInterval(tick, 250 / G.speed);
    return;
  }
  if (G.paused) {
    G.paused = false;
    btn.textContent = "⏸ 정지";
    btn.classList.remove("paused");
    G.timer = setInterval(tick, 250 / G.speed);
  } else {
    G.paused = true;
    btn.textContent = "▶ 재개";
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

  $("#g-sector").textContent = `${SECTOR_EMOJI[stock.sector] || "📈"} ${stock.sector} 섹터`;
  $("#g-day").textContent = "지난 1년";
  // 미리보기 단계에서도 본게임 UI를 그대로 노출 (버튼은 사전 차트 그리는 동안만 잠금)
  $("#play-ui").classList.remove("hidden");
  $("#start-hint").classList.remove("hidden");
  const pBtn = $("#btn-pause");
  pBtn.textContent = "⏳ 차트 그리는 중";
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
  pBtn.textContent = "▶ 1년 단타 시작";
  pBtn.className = "start";
  pBtn.disabled = false;
  $("#btn-step").disabled = true;
  drawGameChart(); // 첫 봉(Day 1) 공개
  updateHud();     // 매수 버튼 활성화
}

// ── 주문 (분할 = 총자산의 1/4, 풀 = 전부 / 다음 봉 시가 체결) ──
function order(side, mode) {
  if (G.phase !== "playing") return;
  if (side === "buy" && G.cash < 1) return toast("현금이 없어요 😅");
  if (side === "sell" && G.shares <= 0) return toast("보유 주식이 없어요 😅");
  if (G.paused) {
    // 일시정지 중에는 현재 봉 종가로 즉시 체결
    execute(side, mode, G.stock.c[bar(G.day)], G.day);
    updateHud();
    drawGameChart();
    toast(`${mode === "full" ? "풀" : "분할"}${side === "buy" ? "매수" : "매도"} 체결 (현재가)`);
    return;
  }
  G.pending.push({ side, mode });
  toast(`${mode === "full" ? "풀" : "분할"}${side === "buy" ? "매수" : "매도"} 주문 — 다음 봉 시가 체결`);
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
  $("#g-day").textContent = `Day ${G.day + 1}/${N}`;
  $("#g-equity").textContent = fmtWon(equity);
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
      ctx.fillText("▶ 시작", x(zeroK) + 3, padT + 9);
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
    ctx.fillStyle = "#ffd84d"; ctx.font = "700 17px sans-serif"; ctx.textAlign = "right";
    ctx.fillText(`⏳ 남은 ${N - 1 - G.day}일`, W - 10, 20);
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
      const label = `평단 ${G.avgCost >= 100 ? G.avgCost.toFixed(0) : G.avgCost.toFixed(2)}`;
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
    alpha >= 0.20 ? "S" : alpha >= 0.10 ? "A" : alpha >= 0.03 ? "B" :
    alpha > -0.03 ? "C" : alpha > -0.15 ? "D" : "F";

  G.result = { equity, myRet, bhRet, alpha, mdd, grade, nTrades: G.trades.length,
    winRate: G.sellCount ? G.sellWins / G.sellCount : null };

  saveHistory();
  renderResult();
}

// [기본 멘트, 내 수익률이 마이너스일 때 멘트]
const GRADE_COMMENT = {
  S: ["당신... 혹시 여의도에서 오셨나요? 시장을 압살했습니다. 👑",
      "폭락장에서 이 정도 방어라니. 도망치는 것도 실력입니다. 🏃"],
  A: ["단타 적성 확실합니다. 실전엔 수수료가 있다는 것만 기억하세요. 😎",
      "시장은 무너졌지만 당신은 덜 무너졌습니다. 생존왕. 🪖"],
  B: ["존버보다 잘했습니다. 소질이 보여요. 🙂",
      "손실은 났지만 존버보단 나았어요. 위기 감지 능력 있음. 🦊"],
  C: ["그냥 사두고 잠이나 잘 걸 그랬습니다. 성적은 존버와 비슷해요. 😴",
      "이러나 저러나 비슷하게 잃었습니다. 마음만 고생했네요. 😮‍💨"],
  D: ["손가락이 수익률을 갉아먹었습니다. 매매 버튼과 거리두기를 권합니다. 🫠",
      "떨어지는 칼날을 자꾸 잡으셨군요. 손은 주머니에. 🔪"],
  F: ["축하합니다. 당신은 시장의 유동성 공급자였습니다. 단타 금지. 🚫",
      "고점 매수 저점 매도의 정석. 교과서에 반면교사로 실립니다. 📚"],
  "?": ["매매를 안 하면 적성을 알 수 없습니다. 다음 판엔 버튼을 눌러보세요. 👀",
        "매매를 안 하면 적성을 알 수 없습니다. 다음 판엔 버튼을 눌러보세요. 👀"],
};
function gradeComment(r) {
  // 수익은 냈지만 존버보다 못한 경우: 익절 응원 + 점수가 낮은 이유 설명
  if (r.myRet > 0 && (r.grade === "D" || r.grade === "F")) {
    return `💰 ${pct(r.myRet)} 익절 성공 — 익절은 언제나 옳습니다! 다만 그냥 들고만 있었어도 ${pct(r.bhRet)}였기에 단타 점수는 아쉬워요.`;
  }
  if (r.myRet > 0 && r.grade === "C") {
    return `💰 익절은 옳다! 수익도 냈고 존버(${pct(r.bhRet)})와 비슷한 성적. 나쁘지 않아요. 🙂`;
  }
  return GRADE_COMMENT[r.grade][r.myRet < 0 ? 1 : 0];
}

function behaviorTag() {
  const r = G.result;
  if (r.nTrades === 0) return "👀 단 한 번도 매매하지 않은 관전형";
  if (r.nTrades >= 40) return `🔥 뇌동매매 경보 — 1년간 ${r.nTrades}회 매매`;
  if (G.holdDays >= N * 0.9 && r.nTrades <= 3) return "💎 사실상 존버였습니다";
  if (r.winRate != null && r.winRate >= 0.6) return `🎯 매도 승률 ${(r.winRate * 100).toFixed(0)}% — 타이밍 감각 있음`;
  return `✂️ 총 ${r.nTrades}회 매매`;
}

function renderResult() {
  const s = G.stock, r = G.result;
  show("scr-result");
  $("#challenge-msg").classList.add("hidden");
  $("#challenge-copy").classList.add("hidden");
  $("#btn-challenge").innerHTML = "⚔️ 친구에게 도전장 보내기";

  $("#r-name").textContent = `${SECTOR_EMOJI[s.sector] || "📈"} ${s.name} (${s.t})`;
  $("#r-period").textContent = `${fmtDate(s.d[G.start])} ~ ${fmtDate(s.d[bar(N - 1)])} 구간이었습니다`;
  $("#r-grade").textContent = r.grade;
  $("#r-comment").innerHTML = gradeComment(r) + '<br><span class="r-behavior">' + behaviorTag() + "</span>";

  const row = (label, ret, me) =>
    `<div class="row${me ? " me" : ""}"><span>${label}</span><b class="${ret >= 0 ? "plus" : "minus"}">${pct(ret)}</b></div>`;
  $("#r-vs").innerHTML =
    row(`🫵 나의 단타 (최종 ${fmtWon(r.equity)})`, r.myRet, true) +
    row(`💎 그냥 존버했다면 (바이앤홀드)`, r.bhRet);

  $("#r-stats").innerHTML = `
    <div class="stat"><span>매매 횟수</span><b>${r.nTrades}회</b></div>
    <div class="stat"><span>매도 승률</span><b>${r.winRate == null ? "-" : (r.winRate * 100).toFixed(0) + "%"}</b></div>
    <div class="stat"><span>최대 낙폭</span><b>-${(r.mdd * 100).toFixed(1)}%</b></div>`;

  const cEl = $("#r-challenge");
  if (G.challenge && G.challenge.r != null) {
    const mine = r.equity, theirs = G.challenge.r;
    cEl.classList.remove("hidden");
    cEl.innerHTML = mine > theirs
      ? `🏆 <b>승리!</b> 나 ${fmtWon(mine)} vs 상대 ${fmtWon(theirs)}`
      : mine < theirs
      ? `😭 <b>패배...</b> 나 ${fmtWon(mine)} vs 상대 ${fmtWon(theirs)}`
      : `🤝 무승부! 둘 다 ${fmtWon(mine)}`;
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
  ctx.fillStyle = "#8b93b8"; ctx.fillText("— 주가", ox + pad + 4, oy + (big ? 30 : 18));
  ctx.fillStyle = "#ffd84d"; ctx.fillText("— 내 자산", ox + pad + (big ? 110 : 60), oy + (big ? 30 : 18));
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
  const order = ["S", "A", "B", "C", "D", "F"];
  const best = order.find((g) => h.some((x) => x.grade === g)) || "-";
  dash.innerHTML = `
    <h3>📊 내 단타 기록</h3>
    <div class="sum">
      <span>판수 <b>${h.length}</b></span>
      <span>존버 이긴 비율 <b>${((beats / h.length) * 100).toFixed(0)}%</b></span>
      <span>평균 알파 <b>${pct(avgAlpha)}</b></span>
      <span>최고 등급 <b>${best}</b></span>
    </div>
    ${h.slice(0, 5).map((x) =>
      `<div class="hist"><span>${x.grade}등급 · ${x.name}</span><span>나 ${pct(x.ret)} / 존버 ${pct(x.bh)}</span></div>`
    ).join("")}`;
}

// ── 공유 ──
function challengeUrl() {
  return `${location.origin}${location.pathname}?g=${G.stockIdx}.${G.start}&r=${Math.round(G.result.equity)}`;
}

async function shareChallenge() {
  const r = G.result;
  const text = `📉 차트만 보고 매매하는 - 단타 적성검사 ${r.grade}등급! 1년 단타로 ${pct(r.myRet)} (존버는 ${pct(r.bhRet)}). 같은 차트로 나를 이겨봐 ⚔️`;
  const url = challengeUrl();
  const btn = $("#btn-challenge");
  const COPIED = '✅ 복사됐어요! 카톡창에 붙여넣어 보내세요.<small>다시 누르면 재복사</small>';
  // 클릭 즉시 도전장(메시지+링크) 복사 → 버튼 문구로 안내. 다시 눌러도 재복사됨
  try {
    await navigator.clipboard.writeText(text + "\n" + url);
    btn.innerHTML = COPIED;
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
  } catch {
    challengeMsg("아래 링크를 복사해서 친구에게 보내세요 👇");
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
  ctx.fillText("📉 차트만 보고 매매하는 - 단타 적성검사", W / 2, 90);

  // 등급 배지
  ctx.strokeStyle = "#ffd84d"; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(W / 2, 250, 118, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "#ffd84d"; ctx.font = "900 150px Pretendard, sans-serif";
  ctx.fillText(r.grade, W / 2, 303);

  // 종목 공개
  ctx.fillStyle = "#eef1ff"; ctx.font = "700 46px Pretendard, sans-serif";
  ctx.fillText(`${s.name} (${s.t}) 1년 단타`, W / 2, 452);
  ctx.fillStyle = "#8b93b8"; ctx.font = "400 32px Pretendard, sans-serif";
  ctx.fillText(`${fmtDate(s.d[G.start])} ~ ${fmtDate(s.d[bar(N - 1)])}`, W / 2, 506);

  // 수익률 비교
  ctx.font = "700 50px Pretendard, sans-serif";
  ctx.fillStyle = r.myRet >= 0 ? "#ff4d4d" : "#4d7fff";
  ctx.fillText(`나의 단타 ${pct(r.myRet)}  (${fmtWon(r.equity)})`, W / 2, 592);
  ctx.fillStyle = "#8b93b8"; ctx.font = "400 38px Pretendard, sans-serif";
  ctx.fillText(`존버했다면 ${pct(r.bhRet)}`, W / 2, 646);

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
  ctx.fillText(`매매 ${r.nTrades}회      매도 승률 ${winTxt}      최대 낙폭 -${(r.mdd * 100).toFixed(1)}%`, W / 2, 1300);

  // 도전 결과(있으면)
  if (G.challenge && G.challenge.r != null) {
    const win = r.equity > G.challenge.r;
    ctx.fillStyle = win ? "#ff4d4d" : "#4d7fff";
    ctx.font = "700 34px Pretendard, sans-serif";
    ctx.fillText(win ? `🏆 도전 승리! 상대 ${fmtWon(G.challenge.r)}` : `상대 ${fmtWon(G.challenge.r)}와 대결`, W / 2, 1360);
  }

  ctx.fillStyle = "#4a5278"; ctx.font = "400 26px Pretendard, sans-serif";
  ctx.fillText("너도 해봐 → 차트만 보고 매매하는 - 단타 적성검사", W / 2, 1430);

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
  a.download = "단타적성검사.png";
  a.click();
  cardModalMsg("이미지를 저장했어요! 💾");
}

async function copyCard() {
  if (!CARD_BLOB) return;
  try {
    if (!navigator.clipboard || !window.ClipboardItem) throw new Error("unsupported");
    await navigator.clipboard.write([new ClipboardItem({ "image/png": CARD_BLOB })]);
    cardModalMsg("카드 이미지가 복사됐어요! 붙여넣기 하세요 📋");
  } catch {
    cardModalMsg("이 브라우저는 이미지 복사가 안 돼요. '이미지 저장'을 이용해 주세요 🙏");
  }
}

init().catch(() => {
  document.body.innerHTML = "<p style='padding:40px;text-align:center'>데이터를 불러오지 못했어요 😢</p>";
});
