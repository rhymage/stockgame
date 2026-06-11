// 차트 규칙 필승법 탐색용 빠른 백테스트 (실증 근거 확인 목적)
// - 86개 종목 × 무작위 252일(1년) 구간을 수천 번 추출
// - 차트만 보고 결정하는 기계적 룰 몇 개를 long/flat 으로 시뮬
// - 룩어헤드 방지: i봉 종가/이평으로 판단 → i+1봉 시가 체결
// - 매매 시 편도 거래비용(commission+spread+FX) 차감
import { readFileSync } from "node:fs";

const N = 252, WARM = 120, TRIALS = 4000;
const COSTS = [0, 0.001, 0.003]; // 편도 0% / 0.1% / 0.3%

// 데이터 로드
const stocks = [];
for (let i = 0; i < 86; i++) {
  stocks.push(JSON.parse(readFileSync(new URL(`../public/data/${i}.json`, import.meta.url))));
}

// 시드 RNG (재현성)
function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rnd = mulberry32(20260611);

const ma = (s, i, n) => { let sum = 0; for (let k = i - n + 1; k <= i; k++) sum += s.c[k]; return sum / n; };
const maxH = (s, a, b) => { let m = -Infinity; for (let k = a; k <= b; k++) m = Math.max(m, s.h[k]); return m; };
const minL = (s, a, b) => { let m = Infinity; for (let k = a; k <= b; k++) m = Math.min(m, s.l[k]); return m; };

// 전략: (s, i, pos) → 목표 포지션(0=현금, 1=풀매수)
const STRATS = {
  "존버(B&H)": null, // 특별 처리
  "MA20>60 골든크로스": (s, i) => (ma(s, i, 20) > ma(s, i, 60) ? 1 : 0),
  "120일선 위=추세추종": (s, i) => (s.c[i] > ma(s, i, 120) ? 1 : 0),
  "20일 돌파/10일 이탈": (s, i, pos) => {
    if (pos === 0 && s.c[i] > maxH(s, i - 20, i - 1)) return 1;
    if (pos === 1 && s.c[i] < minL(s, i - 10, i - 1)) return 0;
    return pos;
  },
  "낙폭매수(MA20 -5%)": (s, i, pos) => {
    const m = ma(s, i, 20);
    if (pos === 0 && s.c[i] < m * 0.95) return 1;
    if (pos === 1 && s.c[i] > m) return 0;
    return pos;
  },
};

function bh(s, start) { return s.c[start + N - 1] / s.o[start] - 1; }

function runStrat(s, start, fn, cost) {
  let cash = 1, shares = 0, pos = 0, trades = 0;
  const end = start + N - 1;
  for (let i = start; i < end; i++) {
    const target = fn(s, i, pos);
    if (target === pos) continue;
    const px = s.o[i + 1];
    if (target === 1) { const amt = cash, fee = amt * cost; shares = (amt - fee) / px; cash = 0; }
    else { const pr = shares * px, fee = pr * cost; cash += pr - fee; shares = 0; }
    pos = target; trades++;
  }
  if (shares > 0) { const pr = shares * s.c[end]; cash += pr - pr * cost; trades++; }
  return { ret: cash - 1, trades };
}

// 무작위 구간 추출
const samples = [];
for (let t = 0; t < TRIALS; t++) {
  const s = stocks[(rnd() * stocks.length) | 0];
  const maxStart = s.c.length - N - 1;
  const minStart = WARM;
  if (maxStart <= minStart) { t--; continue; }
  const start = minStart + ((rnd() * (maxStart - minStart)) | 0);
  samples.push({ s, start });
}

const pctl = (arr, p) => { const a = [...arr].sort((x, y) => x - y); return a[Math.floor(a.length * p)]; };
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;

console.log(`\n=== 백테스트: ${TRIALS}회 무작위 1년(252일) 구간, 86종목 ===`);
console.log(`(룩어헤드 없음, long/flat, 다음봉 시가 체결)\n`);

for (const cost of COSTS) {
  console.log(`\n■ 편도 거래비용 ${(cost * 100).toFixed(1)}%`);
  console.log("전략".padEnd(22), "평균수익", "중앙값", "수익확률", "존버이김", "평균알파", "평균매매");
  // B&H 기준선 먼저
  const bhRets = samples.map(({ s, start }) => bh(s, start));
  for (const [name, fn] of Object.entries(STRATS)) {
    let rets, trades;
    if (fn === null) { rets = bhRets; trades = samples.map(() => 1); }
    else {
      const res = samples.map(({ s, start }) => runStrat(s, start, fn, cost));
      rets = res.map((r) => r.ret); trades = res.map((r) => r.trades);
    }
    const alpha = rets.map((r, i) => r - bhRets[i]);
    const beatBH = alpha.filter((a) => a > 0).length / alpha.length;
    const winP = rets.filter((r) => r > 0).length / rets.length;
    console.log(
      name.padEnd(20),
      (mean(rets) * 100).toFixed(1).padStart(7) + "%",
      (pctl(rets, 0.5) * 100).toFixed(1).padStart(6) + "%",
      (winP * 100).toFixed(0).padStart(6) + "%",
      (beatBH * 100).toFixed(0).padStart(6) + "%",
      (mean(alpha) * 100).toFixed(1).padStart(7) + "%p",
      mean(trades).toFixed(1).padStart(6),
    );
  }
}
console.log("\n주의: 살아남은 대형주 풀(생존편향) + 인샘플 + 분할/배당 반영가 기준. 실제보다 낙관적.\n");
