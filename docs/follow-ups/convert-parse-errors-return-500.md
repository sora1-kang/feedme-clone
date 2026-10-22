# 변환 중 파싱 예외가 500으로 새어 나감

- 증상: `features/url-to-markdown/convert.ts`의 `new JSDOM(...)`과 `Defuddle(...)`이 던지는 예외는 `ConvertError`로 감싸지지 않아, `POST /api/convert`가 JSON이 아닌 500을 돌려준다. 화면에는 "서버에 연결하지 못했습니다"라는 잘못된 원인이 나온다.
- 근거: 코드 리뷰(low)의 지적. 실제 재현은 하지 않았다(재현하는 입력을 아직 찾지 못함).
- 추정 원인: 파싱 단계에 try/catch가 없다.
- 제안: 파싱 예외를 `no-content` 오류로 바꿔 던진다.
