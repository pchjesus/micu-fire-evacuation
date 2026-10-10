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
