// 평균회귀 + 분할(스케일링) 계열 전략의 프로파일 확인
// 이평선 아래에서 분할매수 / 위에서 분할매도 = MA 엔벨로프 + 그리드
// 핵심 관전 포인트: 평균/중앙값뿐 아니라 "왼쪽 꼬리(최악)"를 함께 본다.
import { readFileSync } from "node:fs";

const N = 252, WARM = 120, TRIALS = 4000;
const COST = 0.001; // 편도 0.1%
const REF = 40;     // 기준 이평선 (20~60 사이)

const stocks = [];
for (let i = 0; i < 86; i++)
  stocks.push(JSON.parse(readFileSync(new URL(`../public/data/${i}.json`, import.meta.url))));

function mulberry32(a){return()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const rnd = mulberry32(20260611);
const ma = (s, i, n) => { let x = 0; for (let k = i - n + 1; k <= i; k++) x += s.c[k]; return x / n; };

// 이격도에 따라 목표 투자비중(0~1)을 계단식으로 정함: 아래로 갈수록 더 매수
function targetWeight(dev) {
  if (dev <= -0.10) return 1.00;
  if (dev <= -0.05) return 0.75;
  if (dev <  0.00) return 0.50;
  if (dev <  0.05) return 0.25;
  return 0.00; // 이평 +5% 위 = 전량 비움
}

// 분할 스케일링 시뮬 (목표비중에 다음봉 시가로 리밸런싱, 변화 25%p 이상일 때만)
function runScaling(s, start) {
  let cash = 1, shares = 0, prevW = 0, trades = 0;
  const end = start + N - 1;
  for (let i = start; i < end; i++) {
    const dev = s.c[i] / ma(s, i, REF) - 1;
    const tw = targetWeight(dev);
    if (Math.abs(tw - prevW) < 0.25) continue;
    const px = s.o[i + 1];
    const equity = cash + shares * px;
    const targetStockVal = equity * tw;
    const curStockVal = shares * px;
    const diff = targetStockVal - curStockVal;
    if (diff > 0) { const fee = diff * COST; shares += (diff - fee) / px; cash -= diff; }
    else { const sell = -diff; const fee = sell * COST; shares -= sell / px; cash += sell - fee; }
    prevW = tw; trades++;
  }
  if (shares > 0) { const pr = shares * s.c[end]; cash += pr - pr * COST; trades++; }
  return { ret: cash - 1, trades };
}
const bh = (s, start) => s.c[start + N - 1] / s.o[start] - 1;

const samples = [];
for (let t = 0; t < TRIALS; t++) {
  const s = stocks[(rnd() * stocks.length) | 0];
  const maxStart = s.c.length - N - 1;
  if (maxStart <= WARM) { t--; continue; }
  samples.push({ s, start: WARM + ((rnd() * (maxStart - WARM)) | 0) });
}

const sort = (a) => [...a].sort((x, y) => x - y);
const pctl = (a, p) => sort(a)[Math.floor(a.length * p)];
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;

const bhR = samples.map(({ s, start }) => bh(s, start));
const sc = samples.map(({ s, start }) => runScaling(s, start));
const scR = sc.map((r) => r.ret), scT = sc.map((r) => r.trades);
const alpha = scR.map((r, i) => r - bhR[i]);

const fmt = (v) => (v * 100).toFixed(1) + "%";
console.log(`\n=== 평균회귀+분할(MA${REF} 엔벨로프 그리드) vs 존버 / 편도비용 ${COST*100}% / ${TRIALS}회 ===\n`);
console.log("지표".padEnd(20), "분할전략", "  존버(B&H)");
console.log("평균 수익".padEnd(18), fmt(mean(scR)).padStart(8), fmt(mean(bhR)).padStart(10));
console.log("중앙값".padEnd(19), fmt(pctl(scR,0.5)).padStart(8), fmt(pctl(bhR,0.5)).padStart(10));
console.log("수익 확률".padEnd(18), fmt(scR.filter(r=>r>0).length/scR.length).padStart(8), fmt(bhR.filter(r=>r>0).length/bhR.length).padStart(10));
console.log("하위5% (꼬리)".padEnd(15), fmt(pctl(scR,0.05)).padStart(8), fmt(pctl(bhR,0.05)).padStart(10));
console.log("최악 1건".padEnd(18), fmt(Math.min(...scR)).padStart(8), fmt(Math.min(...bhR)).padStart(10));
console.log("\n존버 대비:");
console.log("  존버 이긴 비율 :", fmt(alpha.filter(a=>a>0).length/alpha.length));
console.log("  평균 알파      :", fmt(mean(alpha)) + "p");
console.log("  평균 매매 횟수 :", mean(scT).toFixed(1));
console.log("\n해석 단서: '수익확률·존버이김'은 높은데 '평균·꼬리'는? — 승률형 vs 손익비형\n");
