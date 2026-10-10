# v0.7.5 배포·실기기 인수검사 실행표 (준비본)

- 기준: 2026-10-09, GitHub `main` `9930534cdbc4f6632d0aeeecac14ae22b85ad317` (v0.7.4 RC 및 공식 로드맵).
- **현재 상태: v0.7.5 자동 회귀검사는 GitHub Actions에서 확인 완료, 실제 기기·Sites 배포 비교는 미검증. FINAL이 아니다.**
- 근거: [개발 로드맵](DEVELOPMENT_ROADMAP.md), [회귀 기준](REGRESSION_BASELINE.md), [기존 실기기 확인표](MOBILE_ACCEPTANCE_v0.7.3.md), [현행 검사 기록](../TEST_REPORT.md).

## 안전 및 실행 전 확인

1. 오직 가상 근무표·가상 인원으로 시험한다. 실제 환자정보, 실제 운영 Excel·백업, 직원 개인정보 포함 증거를 저장소·배포물에 포함하지 않는다.
2. 시험 전 사용 중인 실제 환경과 **분리된 테스트 URL(origin)·브라우저 프로필**을 준비한다. 운영 데이터가 있는 사이트에서 삭제·복원 테스트를 하지 않는다.
3. GitHub 전체 커밋 SHA, 테스트한 ZIP의 파일 해시, 비공개 Sites의 접근 URL·공유 범위·실제 업로드된 파일을 별개로 확인한다. 비공개 배포는 별도 승인 전 실행하지 않는다.
4. 최신 가상 데이터 백업이 실제 다운로드 폴더에 있는지 확인한다. 기기 간·브라우저 간·주소 변경 시 IndexedDB가 동기화된다고 가정하지 않는다.
5. 실행자가 직접 확인하지 않은 항목은 `NOT RUN`으로 유지한다. 실패는 `FAIL`, 환경 제약으로 못 하면 `BLOCKED`, 실제 합격만 `PASS`로 기록한다.

## A. 원본·배포 검수

| ID | 수행·기대 결과 | 상태 | 증거 / 이유 |
| --- | --- | --- | --- |
| A01 | GitHub `main` 전체 SHA와 Private 상태를 확인 | NOT RUN | |
| A02 | 시험 ZIP/Sites 배포 파일을 main과 파일별 해시·변경 목록으로 대조; 허용된 빌드 산출물만 차이가 남음 | NOT RUN | |
| A03 | 화면 앱 버전 및 **실제 배포 원본 커밋**을 대조. 소스 직접 실행은 커밋 미확인, 검증 ZIP에는 Git HEAD 스탬프. Sites 실제 파일 대조 필요 | BLOCKED | 검증 ZIP 통과, Sites 미검증 |
| A04 | Sites 공개 접근 차단 및 승인된 사용자만 접근 가능한지 확인 | NOT RUN | |
| A05 | 앱 변경 전후 가상 데이터 백업·복원 및 origin 차이를 확인 | NOT RUN | |

## B. 기기 정보 기록

| 항목 | Android Chrome | iPhone Safari | Windows Chrome |
| --- | --- | --- | --- |
| 검사자·날짜 | | | |
| 기기·OS / 브라우저 버전 | | | |
| 접속한 정확한 URL(origin) | | | |
| 앱 버전 및 GitHub 소스 SHA | | | |
| 시험 프로필 및 초기 저장 상태 | | | |
| 검사 최종 결과 | NOT RUN | NOT RUN | NOT RUN |

각 기기에서 아래 시나리오를 직접 순서대로 실행한다. `PASS / FAIL / BLOCKED / NOT RUN`을 기록하고, 실패 시 재현 단계·입력·오류 문구·새로 접속한 후 상태를 남긴다.

| ID | 시나리오 및 합격 기대 결과 | Android | iPhone | Windows |
| --- | --- | --- | --- | --- |
| B01 | 현재 날짜·D/E/N 선택과 야간 날짜 경계: 표시 인원·날짜 일치 | NOT RUN | NOT RUN | NOT RUN |
| B02 | 가상 XLSX 파일 선택·검토·한글 파일명: 저장 전 미리보기, 경고 확인 | NOT RUN | NOT RUN | NOT RUN |
| B03 | 날짜 행·이름 열·선임 그룹 변경: 미리보기 갱신, 기존 확인란 해제 | NOT RUN | NOT RUN | NOT RUN |
| B04 | 근무표 저장과 '사용' 구분, 여러 월 전환: 활성 근무표 혼동 없음 | NOT RUN | NOT RUN | NOT RUN |
| B05 | 한글 IME 조합 입력, 이름·직종·그룹 변경과 인원 추가·제외: 글자 유실 없음 | NOT RUN | NOT RUN | NOT RUN |
| B06 | 선임순 자동배치·수동 override·'수정됨'·반별 초기화: 다른 반 수정 보존 | NOT RUN | NOT RUN | NOT RUN |
| B07 | 미저장 초안으로 날짜/듀티 이동: 이탈 보호, 취소·저장 분리 | NOT RUN | NOT RUN | NOT RUN |
| B08 | 저장→새로고침→브라우저 종료 후 같은 origin 접속: 인원·배치·이력 보존 | NOT RUN | NOT RUN | NOT RUN |
| B09 | 기기 재시작 후 재접속: 저장 상태 보존, ANR·멈춤 없음 | NOT RUN | NOT RUN | NOT RUN |
| B10 | JSON 전체 백업과 Excel 이력 다운로드: 실제 파일 존재·내용 확인 | NOT RUN | NOT RUN | NOT RUN |
| B11 | 가상 데이터 변경→백업 복원→재실행: 인원·수동 배치·이력·활성 근무표 복구 | NOT RUN | NOT RUN | NOT RUN |
| B12 | 훼손된 가상 JSON 복원: 거절되고 원래 데이터 유지 | NOT RUN | NOT RUN | NOT RUN |
| B13 | 두 탭에서 오래된 revision 및 다른 탭 전체 복원: 오래된 쓰기 차단, 새로고침 후 저장 재개 | NOT RUN | NOT RUN | NOT RUN |
| B14 | 팝업·회전·터치·긴 도움말·스크롤: 중요한 조작 접근 가능, 화면 잘림 없음 | NOT RUN | NOT RUN | NOT RUN |
| B15 | 실물 A4 한 장 출력(가능한 기기): 세 반·날짜·듀티·이름 가독성, 인쇄 잘림 없음 | NOT RUN | NOT RUN | NOT RUN |

A4 출력은 가능한 프린터에서 최소 1회 실물로 검수하고 용지·방향·배율을 기록한다. 인쇄를 지원하지 않는 기기에서는 `BLOCKED` 사유를 남긴다. 과거 Android ANR 재현 여부도 별도 결함으로 추적한다.

## C. 개발 환경 및 릴리스 검사

| 검사 | 명령 / 조건 | 이번 실행 결과 |
| --- | --- | --- |
| 앱 JavaScript 문법 | `npm run check` | PASS — CI run 38023281036 |
| Domain·parser·저장·백업·회귀 | `npm test` | PASS — 71/71, CI run 38023281036 |
| 브라우저 UI 자동화 | `npm run test:browser` (선택적 Playwright 준비) | PASS — 26/26 Linux Chromium, CI run 38023281036 |
| 릴리스 ZIP 무결성 | `python3 scripts/package-release.py` (대상 버전 문서 준비 후) | PASS — Git SHA, SHA256, 66+ 파일, CI run 38023281036 |
| 원격 소스 vs 배포 파일 | commit SHA·파일 목록·체크섬 비교 | NOT RUN |

`TEST_REPORT.md`에 적힌 자동 68개·Chromium 26개 통과는 **v0.7.4 과거 검사 기록**이다. 이번 표의 통과 결과로 이월하지 않는다.

## D. 결함 및 증거 기록 양식

| 결함 ID | 기기·환경 | 재현 순서·입력 | 기대 결과 / 실제 결과 | 데이터·배치 영향 | 상태 | 증거 |
| --- | --- | --- | --- | --- | --- | --- |
| 발견 시 부여 | | | | | | |

실제 환자·직원정보가 들어 있는 파일/스크린샷은 GitHub·배포본·공유용 보고서에 업로드하지 않는다.

## E. 출시 게이트

`v0.7.5 FINAL`은 위 대상 기기 인수검사, 원본·배포본 추적, 백업 복원 실기 검증, 영향받는 자동검사, 실물 A4 확인 및 미해결 중대 데이터 손실 결함 0건을 충족할 때만 검토한다.

**현재는 v0.7.5 RC 후보이며 FINAL은 보류한다.** ZIP 내부에 실제 소스 SHA를 기록하는 패치를 구현·자동검증했지만 Sites 실제 배포본은 비교하지 않았다. 단순히 기존 SHA를 코드에 고정하지 않는다. 실제 기기 검증 전 서버화·규칙 확대·전면 리팩터링·공개 배포를 진행하지 않는다.
