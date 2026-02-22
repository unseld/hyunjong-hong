# 전자(세금)계산서 ↔ 법인통장 대사 MVP

## 구성
- `apps/web`: Next.js App Router + API Route Handlers
- `apps/worker`: BullMQ Worker (bankSync, invoiceStatusPoll, reconcileRematch, alertNotify)
- `packages/db`: Prisma schema/client + seed
- `packages/shared`: 매칭엔진/어댑터/유틸

## 실행
```bash
docker compose up -d
cp .env.example .env
pnpm install
pnpm --filter @acme/db generate
pnpm db:migrate
pnpm db:seed
pnpm --filter @acme/web dev
pnpm --filter @acme/worker dev
```

기본 계정: `admin@local / admin1234`

## 어댑터
- 세금계산서
  - 기본: `MockTaxProvider`
  - 실연동 골격: `RealTaxProviderSkeleton` (ENV + 요청/응답/에러흐름 + TODO)
- 은행
  - 기본: `MockBankAdapter`
  - 실연동 골격: `OpenBankingSkeleton` (`fintech_use_num`, `access_token` 기반)

## 매칭 로직
- 후보군: 인보이스 유형별 입출금 방향 필터 + base_date ± N일
- 점수식: 요구사항의 amount/date/name/memo/ambiguity penalty 공식 구현
- 자동확정: threshold + margin + amount exact 조건
- 상태: UNMATCHED / PARTIAL_MATCHED / FULL_MATCHED / HOLD / EXCEPTION
- reasons JSON 저장

## 주요 API
- 인증: `/api/auth/login|logout|me`
- 거래처: `/api/partners`
- 계좌: `/api/bank-accounts`, `/api/bank-accounts/:id/sync`
- 거래내역 조회: `/api/bank-transactions`
- 인보이스: `/api/invoices`, `/api/invoices/:id/issue`, `/api/invoices/:id/suggestions`
- 매칭: `/api/matches/confirm|partial|allocate|hold|exception|rematch`
- 리포트: `/api/reports/monthly?month=YYYY-MM&format=csv`
- 감사로그: `/api/audit-logs`

## 화면
`/login`, `/dashboard`, `/invoices/sales`, `/invoices/sales/new`, `/invoices/sales/[id]`, `/bank-accounts`, `/bank-accounts/[id]/transactions`, `/reconcile`, `/reports/monthly`, `/admin/users`, `/admin/rules`, `/admin/audit`

## 테스트
```bash
pnpm --filter @acme/shared test
```

## Phase4 skeleton
- 조합 매칭 자동추천: worker `reconcileRematch` TODO + 테스트 스텁 기반 확장
- 미수/미지급 알림: `alertNotify` Slack webhook 구현, 메일은 skeleton
