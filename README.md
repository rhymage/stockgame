# 단타 적성검사

종목명을 숨긴 실제 미국 주식 일봉 차트로 1년간 모의 매매하고,
바이앤홀드 대비 성적으로 단타 적성 등급을 받는 정적 웹 게임입니다.

## 주요 기능

- 랜덤 미국 주식과 랜덤 252거래일 구간
- 플레이 중 종목명과 날짜 비공개, 섹터만 힌트로 제공
- 분할 매수·매도와 풀 매수·매도
- 자동 재생, 속도 조절, 일시정지, 하루씩 진행
- 종료 후 종목 공개와 바이앤홀드 수익률 비교
- `S`부터 `F`까지 초과수익 기반 등급
- 동일 종목·동일 구간으로 대결하는 도전장 링크
- 결과 카드 이미지 저장과 브라우저 내 플레이 기록

## 구조

```text
.
├── .github/workflows/       # GitHub Pages 자동 배포
├── docs/                    # 배포 및 운영 문서
├── public/                  # 배포되는 정적 웹사이트
│   ├── data/                # 종목별 과거 시세 JSON
│   ├── app.js
│   ├── index.html
│   └── style.css
└── scripts/
    └── fetch-daily.mjs      # Yahoo Finance 데이터 갱신
```

## 로컬 실행

브라우저 보안 정책상 HTML 파일을 직접 여는 대신 정적 서버를 사용합니다.

```powershell
python -m http.server 8000 --directory public
```

그다음 `http://localhost:8000`에 접속합니다.

## 데이터 갱신

```powershell
node scripts/fetch-daily.mjs
```

Yahoo Finance의 최근 10년 일봉을 가져와 조정 종가 비율로 OHLC를
분할·배당 조정합니다. 데이터 갱신 시 종목 인덱스가 바뀌면 기존 도전장
링크가 다른 종목을 가리킬 수 있습니다.

## 배포

`main` 브랜치에 푸시하면 GitHub Actions가 `public/` 폴더를 GitHub Pages에
배포합니다.

- 기본 URL: `https://rhymage.github.io/stockgame/`
- 예정 커스텀 도메인: `https://stockgame.rhymage.com`
- 상세 안내: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- AdSense 준비: [docs/ADSENSE.md](docs/ADSENSE.md)

## 주의사항

- 종목명은 게임 UI에서만 숨겨집니다. 공개 저장소의 데이터 JSON에는
  티커와 종목명이 포함되어 있습니다.
- 도전장 점수는 URL 파라미터 기반이므로 경쟁 서비스용 보안 점수가 아닙니다.
- Yahoo Finance 데이터의 이용 및 재배포 조건은 운영자가 확인해야 합니다.

## 면책

과거 시세 기반 모의 게임이며 수수료, 세금, 슬리피지를 반영하지 않습니다.
투자 권유가 아니며 게임 성적은 실제 투자 실력을 보장하지 않습니다.

## License

Copyright (c) 2026 rhymage. All rights reserved.
No license is granted for reuse, redistribution, or commercial use.

