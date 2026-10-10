# v0.7.5 RC 후보 검증 상태 (2026-10-10)

이번 변경 범위: 릴리스 ZIP Git SHA 식별(직접 소스는 미확인), Node 단위검사·CI 검증 경로, 장기 3프로젝트 인터페이스 설계 검토. 저장소/배치/백업 포맷 변경 없음.

- **자동·브라우저 테스트의 v0.7.5 실행 결과는 반드시 해당 GitHub Actions run 및 커밋에서 별도 확인해야 한다.** 아래의 68개 자동·26개 Chromium 검사는 과거 v0.7.4 보고로서 v0.7.5 통과 근거가 아니다.
- 실제 Android Chrome·iPhone Safari·Windows Chrome에서 파일 선택/다운로드/한글 조합/재실행/백업 복원/다중 탭 및 실물 A4: 미검증.
- 비공개 Sites에 v0.7.5 배포하지 않았으며 실행 중인 파일·원본 SHA 비교는 미검증.
- 검증 기준 및 기록표: `docs/DEVICE_ACCEPTANCE_v0.7.5.md`.

---

# v0.7.4 검증 보고서

검사일: 2026-10-09. 판정: **RC — 코드·자동·통합·브라우저 검증 통과, 실제 기기와 운영 자료 미확인**.
기준: pchjesus/micu-fire-evacuation main d2f818e4193fa1de1368d33b9cca51a05020ccf8 (v0.7.3). 과거 보고서는 docs/TEST_REPORT_v0.7.3.md에 보존했다.

## 실제 수행 결과

| 검증 단계 | 결과 | 환경·근거 |
| --- | --- | --- |
| 변경 전 | 62개 통과 | Node 24.19.0, fake-indexeddb 6.2.4 |
| 앱 문법 | 14개 통과 | npm run check |
| 변경 후 자동 | 68개 통과, 실패·건너뜀 0 | npm test 및 Node 24 --test-isolation=none 검사 |
| 브라우저 통합 | 26개 시나리오 통과 | Playwright 1.62.1, Linux headless Chromium, Asia/Seoul |
| PC 조작 | 복원→편집→저장→리로드, Escape 통과 | 1280×900 데스크톱 설정 |
| 모바일 조작 | 파일 검토·등록·편집·모달·저장·복원 통과 | 390×844, isMobile/hasTouch, Playwright 조작 |
| 화면 | 320/390/768/1280px 가로 넘침 없음 | artifacts/v0.7.4/view-*.png; 390/1280 시각 확인 |
| 재시작 | 같은 프로필의 프로세스 재실행 후 IndexedDB 유지 | Chromium persistent context |
| 인쇄 | 세 반의 print 화면 유지 | artifacts/v0.7.4/print.png; 실물 A4 미검증 |

기본 npm test도 테스트 실행에 필요한 프로세스 권한을 허용한 환경에서 실제 68개 케이스를 모두 실행해 통과했다. Node 24의 --test-isolation=none 실행도 68개를 통과했다. Node 18 등에는 이 선택적 옵션을 적용하지 않고 기본 명령을 사용한다.

기계 판독 결과는 docs/browser-results-v0.7.4.json에 보존한다. 가상 Excel과 독립 임시 프로필만 사용했다. 과거의 제공 자료·실제 기기 검사를 이번 결과에 합산하지 않는다.

## 발견·수정·재검증

| ID / 상태 | 재현 조건과 영향 | 최소 수정 / 근거 |
| --- | --- | --- |
| BUG-0.7.4-001 / Confirmed Bug / VERIFIED | 교체·삭제 확인 이후 다른 탭 저장이 새 인원·배치까지 지울 수 있음 | 원본+revision을 같은 쓰기 트랜잭션에서 비교. 원본에서 경합 3개 실패, 수정 후 경합 3개와 정상 1개 통과 |
| BUG-0.7.4-002 / Confirmed Bug / VERIFIED | 다른 탭의 전체 복원 후 툴바 새로고침으로 최신 자료가 보여도 이후 저장 차단 | refreshToNow에서 AppStorage.initialize 호출. 브라우저 restore→다른 탭 refresh→save 실패 재현 후 통과; 호출 순서 자동검사 통과 |
| UI 상태 연결 / Potential Risk | 모델·저장 단위 검사만으로 연속 UI 결과는 보장할 수 없음 | 연속 시나리오를 UI와 실제 IndexedDB에서 검사 |
| 이력 정보량 / Improvement Suggestion | 저장 성공과 실제 변경 기록이 많아질 수 있음 | A 보류, 기존 데이터·필터·Excel·pending 정책 유지 |

## 보호한 계약

- 여러 월의 저장과 현재 사용 근무표는 분리. 사용 버튼·날짜 이동은 명시적으로 적용.
- 날짜 헤더 앞의 참고 3칸 파싱 제외, NC=N, 기존 야간 기준일·시각 경계 유지.
- 자동 선임 배치와 사람 ID 유지. 선임 변경 시 override가 해당 사람을 따라 재연결.
- 인원관리의 이름 수정은 기존 정책대로 그 사람의 수동 표시 이름도 갱신. 이후 새 수동 배치 이름은 저장·복원 후 유지.
- 의사 추가·추가 인원 삭제·원본 제외/복구는 날짜·듀티 범위. 이름·직종·그룹 프로필은 기존 근무표 범위.
- 역할 초기화는 다른 반 수정 유지. 미저장 입력 취소는 저장 상태 유지.
- 쓰기 오류 시 초안·편집 가능 상태 유지와 재시도. 탭 충돌은 승자 데이터와 실패 탭 초안 보호.
- 리로드·새 인스턴스·프로세스 재시작, 전체 백업→새 프로필 복원 후 인원·배치·이력 연결.
- 손상 백업 차단, 복원 전 백업·확인·epoch 방어 유지.
- 이력 필터·그룹·Excel·pending/실패/재시도는 기존 자동검사 유지; 화면 전체 Excel 다운로드 실행.
- DB v2/v3→v4 이전, 규칙 스냅샷 불변, 기존 배치 90개 컨텍스트 일치 검사 통과.

## 재실행

```sh
npm ci --ignore-scripts
npm run check
npm test
```

브라우저 검사만 추가 실행할 때 Playwright를 선택적으로 준비한다. 앱 런타임 필수 의존성으로 추가하지 않았다.

```sh
npm install --no-save --package-lock=false --ignore-scripts playwright@1.62.1
npx playwright install chromium
npm run test:browser
```

기존 Chromium은 MICU_QA_CHROMIUM에 실행 파일 경로를 지정한다. MICU_QA_DIR로 출력 경로를 바꿀 수 있다. Windows는 해당 셸의 환경변수 설정 방식을 사용한다. 테스트 서버는 임시 포트, 출력은 기본 artifacts/v0.7.4/이다. 백업 JSON·브라우저 프로필은 Git/ZIP에 포함하지 않고, 결과 JSON만 문서에 보존한다. 패키지 스크립트는 화면 증거만 허용 목록으로 포함한다.

## 미확인 및 외부 상태

실제 Android/iPhone, iOS Safari, Windows Chrome, 실제 기기의 파일 선택·다운로드·IME·저장 정리·장기 재시작, 공식 근무표·병원 배치 규칙, 실물 A4. 모바일 화면 설정은 실제 기기 검증을 대체하지 않는다. 이전 Android ANR 원인은 미확정이다.

서버·계정·동기화·DB/백업 형식 변경은 없다. GitHub 공개 전환·Pages 배포를 하지 않는다. 앞서 만든 Sites 미리보기는 별개이며 이번 작업에서 재배포하지 않는다.

