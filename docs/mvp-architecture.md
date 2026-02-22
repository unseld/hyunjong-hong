# PH Meta Ads Performance Dashboard - MVP Architecture

## 1) MVP 아키텍처 추천 (Looker Studio 우선)

### 왜 이 구조가 최단인가
- **시각화는 Looker Studio**로 즉시 구성(개발 최소화)
- **수집/진단/알림은 파이썬 스크립트**로 분리(일별 배치 최적)
- **Goal별 로직을 config/goals.json에 외부화**해서 Goal 추가 시 코드 변경 최소화

### 데이터 흐름 (MVP)
1. Scheduler(Cloud Run Jobs / GitHub Actions cron / local cron) 일 1회 실행
2. `meta_insights_collector.py`가 Meta Marketing API Insights 수집
3. Raw CSV(`data/insights_latest.csv`) 저장
4. `diagnostic_engine.py`가 goal 설정을 로드해 KPI/진단/액션 계산
5. `alert_runner.py`가 규칙 기반 알림 생성 후 채널 전송(stdout/slack/email)
6. Looker Studio가 CSV/BigQuery/Google Sheets를 소스로 연결해 대시보드 렌더

### 커넥터 vs API 수집
- **MVP 권장: API 수집 + 파일/시트 적재**
  - 장점: Goal/규칙/파생지표를 팀이 통제 가능
  - 단점: 배치 운영 필요
- **초단기 대안: 커넥터 직결**
  - 장점: 구축 속도 빠름
  - 단점: 진단/알림 자동화 로직 구현 제약

## 2) 테이블 스키마 (MVP 최소)
- 차원: `date_start, campaign_name, adset_name, ad_name, platform_position, age, gender, region`
- 기본지표: `spend, reach, impressions, clicks, ctr, cpc, frequency`
- 전환지표: `landing_page_views, signups, purchases, purchase_value, profile_visits, follows`
- 파생지표(계산): `cvr, cpa_signup, cpa_purchase, roas, aov`

## 3) 대시보드 탭/차트 정의
- **탭1 Executive Daily**
  - Scorecard: 어제/7일/30일 Spend, Reach, Impressions, CPM, CTR, CPC
  - Goal KPI scorecard(파라미터 기반)
  - Top/Bottom 10 테이블: campaign/adset/ad
  - Alert summary 테이블
- **탭2 Goal Selector + Diagnostic**
  - Goal 파라미터(Follow/Signup/Purchase)
  - Goal별 KPI 매핑 테이블
  - 진단 결과(원인/조치) 테이블
- **탭3 Placement/Audience Breakdown**
  - Feed vs Reels 비교(bar + table)
  - age/gender/region heatmap 또는 pivot
- **탭4 Creative Lab**
  - creative별 CTR/CPC/CVR/CPA/ROAS
  - 자동요약 텍스트(룩커 계산필드 또는 외부 생성 텍스트 컬럼)

## 4) 운영 확장 원칙
- Goal 추가: `config/goals.json`에 goal 객체 추가
- KPI/임계치 변경: config 수정 후 배치 재실행
- 채널 확장: `src/alerts/alert_runner.py`에 sender 함수 추가
