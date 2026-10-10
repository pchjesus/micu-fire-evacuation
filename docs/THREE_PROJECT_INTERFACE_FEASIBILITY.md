# MICU·PRN·간호처방 3프로젝트 통합 가능성 — MICU 검토서

작성: 2026-10-10 · 범위: **설계 평가만 수행**. 코드·DB·백업·UI·외부 데이터 교환 구현 없음.

## 근거로 확인한 원본

- MICU `pchjesus/micu-fire-evacuation` v0.7.4 RC 도메인 `domain/roster-model.js`, `storage.js`, `domain/backup-format.js`. 이 검토는 v0.7.5 패치와 독립적이며 기존 저장 동작을 변경하지 않는다.
- PRN `pchjesus/prn-order-viewer` `docs/THREE-PROJECT-CONVERGENCE-v0.3.md`, `roster-bridge.js`, `tests/roster-bridge.test.cjs`, `data/staff_shifts.json`. PRN v0.3에서 가상 의사 처방은 탭 메모리에만 저장되는 데모다.
- 간호처방 `pchjesus/nursing-order-ux-research` `docs/INTEGRATION_FEASIBILITY.md`, `app/domain.js`. 모의 근무조/PIN 로그인은 MICU 근무표 인증이 아니다.

이 문서의 예시와 판단은 *설계 제안*이며 병원 공식 직원 ID·근무·권한·환자 체계와 일치한다고 보증하지 않는다.

## 현재 MICU 구조가 공유에 적합한 부분

| MICU 실제 책임 | 자료 형태/동작 | 연계 시 의미 |
| --- | --- | --- |
| 근무표 보관 | `roster.id='YYYY-MM'`, `year`, `month`, `all`, `shifts[day]`, `ruleSnapshot` | 파일 단위의 **근무 기간** 식별. 다른 월의 직원을 동일인으로 보증하지 않음 |
| 날짜·듀티 계산 | `getOnDuty(date,duty,roster,personnel)`, D/E/N, NC→N | 선택한 **근무일 기준일**과 근무조의 계산 결과 제공 가능; 자정 넘는 N 날짜를 별도 명시 |
| 원본 인원 ID | `source:${roster.id}:${index}` | 해당 근무표의 행 기반 참조 ID일 뿐 장기 직원 ID 아님 |
| 추가 인원 ID | `added:...` 및 `personnel.contexts[contextId]` | 컨텍스트별 추가·제외/수정 상태를 반영해야 함 |
| 프로필 수정 | `personnel.profiles[personId]` | 이름·직종·선임 그룹 변경도 결과에 포함해야 함 |
| 역할·수동 수정 | `automaticGroups`, `overrides` 별도 | 화재대피 역할을 PRN 간호업무 권한·로그인 정보로 재사용하지 않음 |
| 저장·충돌 방어 | IndexedDB `fireEvacuationRosterDB_v0617`, v4, `revision:{rosterId}`, `storageEpoch` | MICU가 원본 상태의 유일한 소유자. 외부 쓰기·DB 병합 금지 |
| 전체 백업 | `micu-full-backup` / `formatVersion:1` / SHA-256 | 이력·활성 근무표·수정·백업용 메타 포함. **외부 공유 최소 규격이 아님** |

PRN 현행 `roster-bridge.js`는 전체 백업을 사용자가 선택하면 체크섬을 확인하고 가상 간호사 당직 목록만 **읽기 전용 프리뷰**한다. `loginVerified:false`이며 원본을 수정하지 않는다. 다만 백업 전체를 앱에 반입하므로 최소 정보 공유와는 다르다. 현행 PRN 시범 연동을 MICU 정식 내보내기 구현으로 오인하지 않는다.

간호처방 프로젝트의 `localStorage` 가상 세션과 PRN의 `SIM-RN-...`/의사 `SIM-MD-...` ID를 MICU `source:...` ID와 동일시하지 않는다. PRN의 가상 N 근무 시간과 MICU N 기준 시간도 서로 다를 수 있다.

## 최소 JSON 교환 계약 초안 (미구현)

```json
{
  "schema": "micu-on-duty",
  "schemaVersion": 1,
  "simulationOnly": true,
  "source": {
    "application": "micu-fire-evacuation",
    "rosterId": "2026-10",
    "rosterRevision": 2,
    "ruleProfileId": "micu-v1"
  },
  "generatedAt": "2026-10-10T09:00:00+09:00",
  "timezone": "Asia/Seoul",
  "shiftDate": "2026-10-10",
  "duty": "N",
  "staff": [
    {
      "sourcePersonId": "source:2026-10:0",
      "sharedStaffId": null,
      "displayName": "가상간호사",
      "kind": "nurse"
    }
  ]
}
```

정의: `shiftDate`는 **근무표 날짜 열**이며 N의 출근·퇴근 시각이 두 날짜에 걸칠 수 있다. `duty`는 정규화된 D/E/N 코드. `sourcePersonId`는 해당 roster에 한정된 참조. `sharedStaffId:null`은 다른 시스템과의 매핑이 **미확인**이라는 뜻. 직원명·근무 여부·화재 역할은 본인 인증이나 처방·기록 접근권한을 증명하지 않는다. `rosterRevision`과 생성시각은 stale 자료 감지에 도움을 주지만 실제 동기화가 아님.

최종 형식으로 승인되기 전에 필수 필드, 서명/해시 정책, 실명 포함 여부, 생성/만료 시각, 데이터 반출 권한, 규칙 스냅샷 식별과 revision 누락 시 동작을 결정해야 한다. 위 JSON은 합성 데이터의 **설계 예시**이지 현행 MICU의 작동하는 API가 아니다.

## 제안 검증 사례

1. D/E/N·NC=N·야간 기준일, 월말/월초, 없는 날짜 열과 해당 날짜 근무자 0명 구분.
2. 원본 직원 제외/복귀, 가상 의사·사원/간호사 추가, 이름/그룹 수정, 수동 override가 근무여부와 역할에 미치는 범위를 분리.
3. 두 근무표의 동일한 이름, 행 재정렬, 이름 변경, 원본 교체, 근무표별 수정본의 공통 ID 오매핑 방지.
4. 구버전/손상/과대 파일/중복 ID 거절, stale revision 경고, 불완전 근무표/근무표 미사용 상태를 구분.
5. 파일 가져오기 취소/재시작 시 원본 MICU DB 불변; 외부 사용자 로그인·처방 확인 기록 불변.
6. 승인되지 않은 실데이터 교환, 브라우저 간 IndexedDB 직접 접근, 전체 백업 무단 전달 차단.

## 향후 안전한 순서

1. v0.7.5 현행 자동검사·비공개 배포본 정합성·실기기 인수검사 완료. 규칙 확대는 공식 근무표 전까지 보류.
2. **가상 샘플 데이터만** 사용하는 순수 읽기 전용 projection 함수의 계약/검증 사례부터 별도 패치로 제안. 원본 `AppStorage`, DB 스키마, 백업 포맷은 변경하지 않음.
3. 일회성 JSON의 검증·미리보기·명시적 확인을 PRN/간호처방 측에서 독립 구현할지 사용자 승인. 현재 PRN의 전체 백업 프리뷰는 기존 상태로 보호.
4. 공통 `StaffMember` 장기 ID와 월별 수정본 정책을 수동 확인·중복 이름 반례 기반으로 별도 결정. 로그인 주체는 `AuthenticatedActor`로 명확히 분리.
5. **환자별 대피 계획은 현재 MICU 범위 밖.** 필요성이 확인될 때 별도 모듈에서 가상 `patient_id`를 참조하고 임상 평가·정보 최소화·접근권한·승인을 별도 검토. 현재 의사·간호처방 전체 복제나 처방을 근거로 대피 능력 자동 산정 금지.
6. 실제 다기기 공유·로그인·공통 서버·병원 연계는 기관 보안·개인정보·감사·동시 편집·운영 승인 조건이 갖추어진 후 **선택 분기**로 검토.

## 현재 구조 적정성 판정

**조건부 적합.** MICU의 `domain/` 계산 로직과 IndexedDB 경계는 일회성 합성 근무정보를 읽기 전용으로 제공할 출발점이 된다. 하지만 현재 직원 ID는 장기 식별자가 아니고 전체 백업에는 필요 이상의 정보가 포함된다. 정식 공유 인터페이스가 필요해지기 전까지 MICU 데이터 구조나 저장소를 바꿀 이유는 없다.

**이번 단계 결론: 문서 검토만 반영, 데이터 모델·내보내기·공통 서버·인증·환자 모듈·UI 변경 없음.**
