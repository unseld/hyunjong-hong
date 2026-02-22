# PH Meta Ads Performance Dashboard (Goal-based Optimization) - MVP

## 1) MVP 아키텍처 추천
- **UI 우선순위:** Looker Studio
- **백엔드 MVP:** Python 배치 스크립트(수집/진단/알림)
- **핵심 원칙:** Goal별 KPI/임계치/진단/액션은 `config/goals.json`에서 관리

### 추천 아키텍처(최단)
1. Meta Insights API 일별 수집 (`src/collector/meta_insights_collector.py`)
2. 진단 엔진 실행 (`src/diagnostics/diagnostic_engine.py`)
3. 알림 엔진 실행 (`src/alerts/alert_runner.py`)
4. 결과를 Looker Studio 데이터 소스(시트/빅쿼리)로 연결

> 상세 설계는 `docs/mvp-architecture.md` 참고

## 2) 태스크 체크리스트 (실행 순서)
- [ ] Meta 앱/토큰/광고계정 권한 준비 (`ads_read`)
- [ ] 환경변수 설정 (`META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`)
- [ ] `config/goals.json`에서 KPI/임계치/규칙 검토
- [ ] 일별 수집 실행 및 샘플 데이터 검증
- [ ] 진단/알림 결과 JSON 생성 확인
- [ ] Looker Studio 데이터소스 연결
- [ ] 탭1~탭4 기본 템플릿 구성
- [ ] 스케줄러(cron or GitHub Actions) 등록

### 태스크별 코드/설정 예시
```bash
# 1) 의존성 설치
pip install -r requirements.txt

# 2) 샘플 데이터로 MVP end-to-end 실행
python -m src.pipeline.run_daily --goal purchase --input-csv data/sample_insights.csv --channel stdout

# 3) 실제 API로 수집 (환경변수 필요)
python -m src.collector.meta_insights_collector --date-preset yesterday --output data/insights_latest.csv

# 4) Goal 변경 테스트
python -m src.alerts.alert_runner --goal signup --input data/insights_latest.csv --channel stdout
```

## 3) 리포 구조/초기 파일
```text
.
├── config/
│   └── goals.json
├── data/
│   └── sample_insights.csv
├── docs/
│   ├── looker-studio-template-guide.md
│   └── mvp-architecture.md
├── src/
│   ├── alerts/alert_runner.py
│   ├── collector/meta_insights_collector.py
│   ├── diagnostics/diagnostic_engine.py
│   └── pipeline/run_daily.py
├── requirements.txt
└── README.md
```

## 4) 핵심 코드 설명 (데이터 수집/진단/알림)
- **수집기(`meta_insights_collector.py`)**
  - Meta Insights API 호출
  - breakdown(placement/age/gender/region) 수집
  - 액션 배열을 평탄화해 signups/purchases/profile_visits 등 컬럼 생성
  - API 실패 시 `--input-csv` fallback 지원

- **진단 엔진(`diagnostic_engine.py`)**
  - `goals.json` 로딩
  - rolling 7일 기준 컨텍스트 구성
  - Goal별 파생지표 계산(cpa/cvr/roas 등)
  - Goal별 diagnostic rule + global alert rule 평가

- **알림 엔진(`alert_runner.py`)**
  - 진단 결과를 JSON으로 저장
  - 채널별 sender 라우팅(stdout/slack/email placeholder)

- **오케스트레이터(`run_daily.py`)**
  - 수집 → 진단/알림 순서 실행
  - 단일 명령으로 일별 파이프라인 실행

## 운영 가이드: Goal 추가/변경
1. `config/goals.json`의 `goals`에 새 Goal 키 추가(예: `lead`)
2. `primary_kpis`, `derived_metrics`, `thresholds`, `diagnostic_rules` 정의
3. 배치 재실행
4. Looker Studio Goal 파라미터 옵션에 Goal 추가

## 빠른 시작
```bash
pip install -r requirements.txt
python -m src.pipeline.run_daily --goal purchase --input-csv data/sample_insights.csv --channel stdout
```
