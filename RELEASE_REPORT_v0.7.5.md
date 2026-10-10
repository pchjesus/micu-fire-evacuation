# MICU v0.7.5 RC — 후보 출시 보고

작성 2026-10-10. **RC 후보이며 FINAL 또는 실제 Sites 배포 완료가 아니다.**

이번 변경은 도움말의 Git 소스 커밋 식별, clean Git checkout에서 안전하게 생성한 ZIP 내부 버전 스탬프, 테스트 및 CI 연결이다. 규칙/파서/화재 역할/자동·수동 배치/DB v4/백업 1/감사이력의 저장 계약을 변경하지 않았다.

## 빌드와 원본 표시
- 소스 그대로 웹에서 실행하면 커밋을 추정하지 않고 `커밋 미확인`을 표시한다.
- Git clean tree에서 `python3 scripts/package-release.py` 실행 시 HEAD의 40자 SHA를 ZIP 내부 `build-info.js`에 주입해 체크섬으로 검증한다. dirty tree면 실패한다.
- 실제 Sites 배포는 별도 절차이므로 생성된 ZIP, 접근 제한, 실행 파일 목록과 배포 시각을 비교해야 한다. SHA 표시는 배포 일치를 보증하지 않는다.

## 검증 게이트
- 자동 검사 증거는 GitHub Actions의 실제 해당 SHA 실행 상태로 확인, 과거 v0.7.4 통과 기록 사용 금지.
- 실제 Android/iPhone/Windows, 한국어 IME, 파일 선택·다운로드, 백업 복원 재실행, A4 인쇄는 미확인. `docs/DEVICE_ACCEPTANCE_v0.7.5.md` 참조.
- 중대 데이터 손실 0건 및 실기기 승인 전 FINAL 전환 금지.

## 롤백과 범위 밖
v0.7.4 기준 커밋 `2b113d203693467f75fe8b752f018b15135e4a0b` 및 공식 로드맵 `9930534cdbc4f6632d0aeeecac14ae22b85ad317`를 원본 이력으로 보존. DB v4 코드와 현재 데이터는 별개이며 운영 데이터 복구에는 별도 JSON 전체 백업 필요. Sites 재배포·GitHub 공개·Pages 공개·서버·인증·환자 데이터 구현 없음.
