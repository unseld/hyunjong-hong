# Looker Studio Template Guide (MVP)

## 데이터 연결
1. 소스 선택
   - 빠른 시작: Google Sheets(배치가 csv를 시트로 업로드)
   - 운영형: BigQuery 테이블(추천)
2. 필드 타입 확인
   - 날짜: `date_start`
   - 숫자: spend/impressions/clicks/purchases/purchase_value 등
3. 계산필드 추가
   - `CPM = spend / impressions * 1000`
   - `CVR = purchases / link_clicks`
   - `CPA Purchase = spend / purchases`
   - `ROAS = purchase_value / spend`

## Goal Selector 구현
- 매개변수(Parameter): `p_goal` (값: follow/signup/purchase)
- CASE 필드로 Goal별 KPI 표시명 전환
- 필터 컨트롤: date range + campaign

## 알림/진단 출력 연결
- `data/alerts_latest.json` 결과를 시트/BigQuery에 적재
- 진단 테이블: `goal, rule_id, root_cause, action`
- 경고 테이블: `id, severity, message`

## 최소 시각화 세트
- Scorecard 8개 (Spend/Reach/Impressions/CPM/CTR/CPC/Goal KPI1/Goal KPI2)
- 비교 차트 2개 (Feed vs Reels CTR/CPA)
- Breakdown pivot 1개 (age x gender)
- 진단 결과 테이블 1개
