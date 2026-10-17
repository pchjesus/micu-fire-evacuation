# v0.7.5 RC — Git 원본 식별 및 자동 회귀검사 준비

2026-10-10. v0.7.4의 모든 업무 기능 보호.

## Added
- 도움말에 소스 커밋 식별 영역. Git 직접 실행에서는 미확인으로 표기.
- Git clean checkout에서만 검토용 ZIP 빌드; ZIP 내부 build-info.js에 전체 커밋 SHA 삽입, 체크섬 검증.
- 원본 식별 Node 테스트와 GitHub Actions의 JavaScript 문법/회귀/Chromium/패키징 검사.
- 3프로젝트 연동에 대비한 *검토 문서만* 추가.

## Unchanged
- IndexedDB `fireEvacuationRosterDB_v0617` DB v4, backup formatVersion 1, D/E/N·NC=N·야간 경계, 원본 인원 ID와 역할 배치, 수동 override, revision·storage epoch, 이력·복원.

## Remaining
- 실제 기기·A4·비공개 Sites 접근권한/파일해시 비교 미완료. GitHub에서 CI 확인 전 자동테스트 PASS 주장 금지.
- 병원 공식 근무표/규칙 검증 전 기능 확대 금지. FINAL 보류.

## Hotfix: 2026-10-17 / legacy Pages + DB v4 충돌

- 현상: 구형 Pages(v0.7.2)의 IndexedDB v3 열기 요청이 저장된 DB v4에 대해 `VersionError` 발생.
- 조치: 현 v0.7.5 DB v4 소스를 변경 없이 사용하고, 로딩 자산 캐시 키 추가 및 미래 VersionError 시 무삭제 안내. 구형 배포 미러는 GitHub `main`에서 생성한 검증 정적 파일만 반영.
- 회귀: DB v4 기존 데이터 보존 / 신규 앱 재실행 및 v5 거절 시 기존 데이터 보존 테스트 추가.
- 데이터베이스 이름·버전·스키마·수동 배치·저장·복원 형식 불변. 단말 검증과 GitHub Pages 실제 전파는 별도 기록.
