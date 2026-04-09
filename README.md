# 📋 클립보드 매니저

클립보드 히스토리 관리 + 자주쓰는 문구 저장 + 구글 검색을 하나로 합친 모바일 웹앱

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-badge-id/deploy-status)](https://app.netlify.com)

## 📱 주요 기능

### 📋 클립보드
- **클립보드 불러오기** — 현재 복사된 텍스트를 한 탭에 저장
- 최대 **500개** 자동 보관 (초과 시 오래된 것부터 삭제)
- URL / 이메일 / 전화번호 자동 분류
- 길게 누르면 → 복사, 문구 저장, 구글 검색, 삭제
- 긴 텍스트 카드 내 **스크롤** 지원

### ⭐ 자주쓰는 문구
- 그룹별 문구 관리 (추가 / 수정 / 삭제)
- 그룹 커스텀 (이름 + 아이콘 18종)
- **URL 링크** 연결 — 문구에 URL 첨부하면 바로 열기
- 탭 → 복사 / 오른쪽 › → 수정 바로가기
- 클립보드에서 길게 눌러 **문구로 바로 저장** (그룹 선택)

### 🔍 검색
- **구글 검색** — 입력 후 새 탭에서 검색
- 클립보드 / 문구로 **빠른 검색**
- 검색 히스토리 30개 저장

### 💾 데이터 영구 저장
- 모든 데이터 **localStorage** 저장
- 새로고침 / 앱 종료 후에도 유지
- 서버 전송 없음, 100% 로컬

## 🛠 기술 스택

- **React** + **Vite**
- **PWA** 지원 (홈 화면 추가 가능)
- **Netlify** 배포 (GitHub 연동 자동 배포)

## 🚀 로컬 실행

```bash
git clone https://github.com/your-username/clipboard-manager.git
cd clipboard-manager
npm install
npm run dev
```

## 📦 배포

```bash
npm run build
# dist/ 폴더가 생성됨 → Netlify에 자동 배포
```

GitHub에 push하면 Netlify에서 자동 빌드 & 배포됩니다.

## 📁 프로젝트 구조

```
clipboard-manager/
├── public/
│   ├── manifest.json    # PWA 설정
│   ├── icon-192.png     # 앱 아이콘
│   ├── icon-512.png
│   ├── _headers         # Netlify 캐시 설정
│   └── _redirects       # SPA 라우팅
├── src/
│   ├── main.jsx         # 엔트리 포인트
│   └── App.jsx          # 메인 앱 (전체 로직)
├── index.html
├── vite.config.js
└── package.json
```

## 📱 모바일 설치 (PWA)

**iPhone Safari**
1. 사이트 접속
2. 하단 공유 버튼 (↑) 탭
3. "홈 화면에 추가" 선택
4. 네이티브 앱처럼 사용 가능

**Android Chrome**
1. 사이트 접속
2. 메뉴 (⋮) → "홈 화면에 추가"

## 📄 라이선스

MIT License
