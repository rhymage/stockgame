// 단타 적성검사 - 일봉 데이터 베이킹
// Yahoo Finance에서 미국주 10년 일봉 OHLC를 수집해 종목당 JSON으로 저장
// 파일명은 인덱스(0.json...)로 티커 비노출, manifest.json에는 섹터 힌트만 포함
// 실행: node scripts/fetch-daily.mjs

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// 섹터는 플레이 중 유일한 힌트 — 종목을 특정하기 어려운 수준의 굵기로 유지
const STOCKS = [
  // 빅테크
  ["AAPL", "애플", "빅테크"], ["MSFT", "마이크로소프트", "빅테크"],
  ["GOOGL", "구글", "빅테크"], ["AMZN", "아마존", "빅테크"],
  ["META", "메타(페이스북)", "빅테크"], ["NFLX", "넷플릭스", "빅테크"],
  // 반도체
  ["NVDA", "엔비디아", "반도체"], ["AMD", "AMD", "반도체"],
  ["INTC", "인텔", "반도체"], ["QCOM", "퀄컴", "반도체"],
  ["AVGO", "브로드컴", "반도체"], ["MU", "마이크론", "반도체"],
  ["TXN", "텍사스인스트루먼트", "반도체"], ["AMAT", "어플라이드머티리얼즈", "반도체"],
  ["TSM", "TSMC", "반도체"],
  // 소프트웨어/클라우드
  ["ORCL", "오라클", "소프트웨어/클라우드"], ["CRM", "세일즈포스", "소프트웨어/클라우드"],
  ["ADBE", "어도비", "소프트웨어/클라우드"], ["IBM", "IBM", "소프트웨어/클라우드"],
  ["CSCO", "시스코", "소프트웨어/클라우드"], ["PLTR", "팔란티어", "소프트웨어/클라우드"],
  ["SNOW", "스노우플레이크", "소프트웨어/클라우드"], ["NET", "클라우드플레어", "소프트웨어/클라우드"],
  ["DDOG", "데이터독", "소프트웨어/클라우드"], ["ZM", "줌", "소프트웨어/클라우드"],
  ["DOCU", "도큐사인", "소프트웨어/클라우드"], ["U", "유니티", "소프트웨어/클라우드"],
  // 인터넷/플랫폼
  ["UBER", "우버", "인터넷/플랫폼"], ["ABNB", "에어비앤비", "인터넷/플랫폼"],
  ["DASH", "도어대시", "인터넷/플랫폼"], ["SHOP", "쇼피파이", "인터넷/플랫폼"],
  ["SNAP", "스냅챗", "인터넷/플랫폼"], ["PINS", "핀터레스트", "인터넷/플랫폼"],
  ["RBLX", "로블록스", "인터넷/플랫폼"], ["SPOT", "스포티파이", "인터넷/플랫폼"],
  ["ROKU", "로쿠", "인터넷/플랫폼"], ["LYFT", "리프트", "인터넷/플랫폼"],
  // 핀테크/결제
  ["PYPL", "페이팔", "핀테크/결제"], ["COIN", "코인베이스", "핀테크/결제"],
  ["HOOD", "로빈후드", "핀테크/결제"], ["V", "비자", "핀테크/결제"],
  ["MA", "마스터카드", "핀테크/결제"], ["AXP", "아멕스", "핀테크/결제"],
  // 전기차/자동차
  ["TSLA", "테슬라", "전기차/자동차"], ["F", "포드", "전기차/자동차"],
  ["GM", "GM", "전기차/자동차"], ["RIVN", "리비안", "전기차/자동차"],
  ["LCID", "루시드", "전기차/자동차"], ["NIO", "니오", "전기차/자동차"],
  // 소비재/유통
  ["WMT", "월마트", "소비재/유통"], ["COST", "코스트코", "소비재/유통"],
  ["TGT", "타겟", "소비재/유통"], ["HD", "홈디포", "소비재/유통"],
  ["NKE", "나이키", "소비재/유통"], ["GME", "게임스탑", "소비재/유통"],
  // 식음료
  ["SBUX", "스타벅스", "식음료"], ["MCD", "맥도날드", "식음료"],
  ["KO", "코카콜라", "식음료"], ["PEP", "펩시", "식음료"],
  // 헬스케어/제약
  ["JNJ", "존슨앤존슨", "헬스케어/제약"], ["PFE", "화이자", "헬스케어/제약"],
  ["MRNA", "모더나", "헬스케어/제약"], ["LLY", "일라이릴리", "헬스케어/제약"],
  ["UNH", "유나이티드헬스", "헬스케어/제약"], ["ABBV", "애브비", "헬스케어/제약"],
  // 금융
  ["JPM", "JP모건", "금융"], ["BAC", "뱅크오브아메리카", "금융"],
  ["GS", "골드만삭스", "금융"], ["MS", "모건스탠리", "금융"],
  ["BRK-B", "버크셔해서웨이", "금융"],
  // 에너지
  ["XOM", "엑손모빌", "에너지"], ["CVX", "셰브론", "에너지"],
  ["OXY", "옥시덴탈", "에너지"],
  // 산업재
  ["BA", "보잉", "산업재"], ["CAT", "캐터필러", "산업재"],
  ["DE", "존디어", "산업재"], ["GE", "GE", "산업재"],
  // 여행/항공
  ["CCL", "카니발크루즈", "여행/항공"], ["AAL", "아메리칸항공", "여행/항공"],
  ["DAL", "델타항공", "여행/항공"], ["MAR", "메리어트", "여행/항공"],
  // 미디어/통신
  ["DIS", "디즈니", "미디어/통신"], ["AMC", "AMC", "미디어/통신"],
  ["T", "AT&T", "미디어/통신"], ["VZ", "버라이즌", "미디어/통신"],
  ["TMUS", "T모바일", "미디어/통신"],
];

async function fetchDaily(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?range=10y&interval=1d&events=div%2Csplit`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const r = json?.chart?.result?.[0];
  if (!r) throw new Error("empty result");
  const ts = r.timestamp || [];
  const q = r.indicators?.quote?.[0] || {};
  const adj = r.indicators?.adjclose?.[0]?.adjclose;

  const d = [], o = [], h = [], l = [], c = [];
  const rd = (v) => (v < 10 ? Math.round(v * 1000) / 1000 : Math.round(v * 100) / 100);
  for (let i = 0; i < ts.length; i++) {
    const co = q.close?.[i], op = q.open?.[i], hi = q.high?.[i], lo = q.low?.[i];
    if ([co, op, hi, lo].some((v) => v == null || !isFinite(v) || v <= 0)) continue;
    // 액면분할/배당 반영: adjclose 비율로 OHLC 전체 스케일
    const scale = adj && adj[i] != null && adj[i] > 0 ? adj[i] / co : 1;
    const dt = new Date(ts[i] * 1000);
    d.push(dt.getUTCFullYear() * 10000 + (dt.getUTCMonth() + 1) * 100 + dt.getUTCDate());
    o.push(rd(op * scale)); h.push(rd(hi * scale)); l.push(rd(lo * scale)); c.push(rd(co * scale));
  }
  return { d, o, h, l, c };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dest = join(ROOT, "public", "data");
mkdirSync(dest, { recursive: true });

const manifest = [];
let idx = 0;

for (const [symbol, name, sector] of STOCKS) {
  process.stdout.write(`${name} (${symbol}) ... `);
  try {
    const bars = await fetchDaily(symbol);
    if (bars.d.length < 500) throw new Error(`봉 부족 (${bars.d.length})`);
    writeFileSync(
      join(dest, `${idx}.json`),
      JSON.stringify({ t: symbol, name, sector, ...bars })
    );
    manifest.push({ i: idx, sector, bars: bars.d.length });
    console.log(`OK -> ${idx}.json (${bars.d.length}봉, ${bars.d[0]} ~ ${bars.d[bars.d.length - 1]})`);
    idx++;
  } catch (e) {
    console.log(`실패: ${e.message}`);
  }
  await sleep(350);
}

writeFileSync(
  join(dest, "manifest.json"),
  JSON.stringify({ updated: new Date().toISOString().slice(0, 10), stocks: manifest })
);
console.log(`\nmanifest.json 저장 (종목 ${manifest.length}개)`);
