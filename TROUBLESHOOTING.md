# Troubleshooting Guide

## JSON Parse Error

### Error: "Failed to parse AI response as JSON"

**원인:**
- OpenAI가 JSON 대신 일반 텍스트로 응답
- `response_format: { type: "json_object" }` 가 작동하지 않음
- 잘못된 모델 사용

**해결 방법:**

1. **개발 서버 콘솔 확인**
   - 터미널에서 "Raw AI Response:" 로그 확인
   - AI가 실제로 어떤 응답을 보냈는지 확인

2. **OpenAI API 키 확인**
   ```bash
   # .env.local 파일이 있는지 확인
   ls -la .env.local
   
   # 파일 내용 확인 (API 키는 노출하지 않도록 주의)
   cat .env.local
   ```

3. **올바른 형식:**
   ```bash
   # .env.local
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
   ```

4. **서버 재시작**
   ```bash
   # 개발 서버 중지 (Ctrl+C)
   # 다시 시작
   npm run dev
   ```

5. **브라우저 콘솔 확인**
   - F12 → Console 탭
   - "Raw AI Response" 로그 확인
   - 에러 메시지 확인

## 탭 구분 안 되는 문제

### 문제: Upload File(AI)와 Manual Input 탭 구분이 안됨

**해결 완료:**
- 조건부 클래스명 적용으로 해결
- 선택된 탭: 파란색 배경 + 흰색 텍스트
- 비선택 탭: 투명 배경 + 회색 텍스트

**확인 방법:**
1. 페이지 새로고침
2. "Upload File (AI)" 탭이 파란색으로 표시되는지 확인
3. "Manual Input" 클릭 시 색상 전환 확인

## OpenAI API 에러

### Error: "OpenAI API key is not configured"

**체크리스트:**
- [ ] `.env.local` 파일이 프로젝트 루트에 있는가?
- [ ] 파일명이 정확히 `.env.local` 인가? (`.env` 아님)
- [ ] API 키가 `sk-` 로 시작하는가?
- [ ] 개발 서버를 재시작했는가?

**올바른 디렉토리 구조:**
```
mathComm_project/
├── .env.local          ← 여기에 있어야 함
├── src/
├── package.json
└── ...
```

### Error: "Rate limit exceeded"

**원인:** OpenAI API 사용량 초과

**해결 방법:**
1. OpenAI 대시보드에서 사용량 확인
2. 크레딧 충전
3. 사용량 제한 설정

### Error: "Invalid API key"

**해결 방법:**
1. OpenAI Platform에서 새 API 키 생성
2. `.env.local` 업데이트
3. 서버 재시작

## 이미지 분석 실패

### 이미지가 너무 큰 경우

**해결 방법:**
- 이미지 크기를 줄이기 (권장: 2048x2048 이하)
- PDF를 이미지로 변환 후 업로드

### 이미지에 텍스트가 없는 경우

**해결 방법:**
- 수학 문제가 포함된 이미지인지 확인
- 이미지 해상도가 충분한지 확인
- 손글씨보다는 인쇄된 텍스트가 더 잘 인식됨

## 로그 확인 방법

### 서버 사이드 로그 (터미널)
```bash
# 개발 서버 실행 시 터미널에 표시됨
npm run dev

# 확인할 내용:
# - OpenAI API Key configured: sk-...
# - Raw AI Response: {...}
# - JSON Parse Error (있다면)
```

### 클라이언트 사이드 로그 (브라우저)
```javascript
// F12 → Console 탭에서 확인
// - API Error: {...}
// - Raw AI Response: {...}
// - AI analysis error: {...}
```

## 자주 묻는 질문 (FAQ)

### Q: 분석이 너무 느려요
**A:** GPT-4 Vision은 5-15초 정도 소요됩니다. 정상입니다.

### Q: 한글 문제도 인식되나요?
**A:** 네, GPT-4는 다국어를 지원합니다. 한글 수학 문제도 인식 가능합니다.

### Q: PDF는 어떻게 처리되나요?
**A:** 현재는 PDF를 이미지로 변환한 후 업로드해야 합니다. 향후 직접 PDF 처리 기능 추가 예정입니다.

### Q: KaTeX 문법이 잘못 생성돼요
**A:** AI 응답을 검토하고 수정하세요. "Generate with AI"는 초안을 제공하는 것이며, 관리자가 검토해야 합니다.

### Q: 비용이 얼마나 나오나요?
**A:** 
- 이미지 분석: 약 $0.01-0.03/건
- Solution 생성: 약 $0.01-0.02/건
- 관련 문제 생성: 약 $0.02-0.05/건

OpenAI 대시보드에서 실시간 사용량을 확인할 수 있습니다.

## 추가 도움이 필요한 경우

1. **GitHub Issues:** 프로젝트 저장소에 이슈 생성
2. **OpenAI 문서:** https://platform.openai.com/docs
3. **Next.js 문서:** https://nextjs.org/docs

## 디버그 모드 활성화

문제가 지속되면 더 자세한 로그를 확인하세요:

```typescript
// src/app/api/analyze-problem/route.ts
// 이미 console.log가 추가되어 있습니다:
console.log('OpenAI API Key configured:', ...);
console.log('Raw AI Response:', aiResponse);
```

브라우저와 터미널 모두에서 로그를 확인하면 문제를 파악할 수 있습니다.

