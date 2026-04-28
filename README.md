# 클립보드 매니저

클립보드 히스토리 관리, 자주 쓰는 문구 저장, Google 검색을 하나로 합친 모바일 우선 PWA입니다.

## 주요 기능

### 클립보드
- 현재 복사된 텍스트를 한 번에 저장
- 최대 500개 자동 보관
- 중복 클립 저장 방지 설정
- URL, 이메일, 전화번호 자동 분류
- 길게 누르면 복사, 문구 저장, Google 검색, 삭제 메뉴 표시
- 브라우저 클립보드 읽기가 막히는 환경을 위한 직접 붙여넣기 폴백

### 자주 쓰는 문구
- 그룹별 문구 추가, 수정, 삭제
- 그룹 이름과 아이콘 커스텀
- 문구별 http/https 링크 저장
- 클립보드 항목을 문구로 바로 저장

### 검색
- Google 검색
- 클립보드/문구 항목으로 빠른 검색
- 최근 검색어 30개 저장

### 저장과 개인정보
- 모든 데이터는 브라우저 `localStorage`에 저장됩니다.
- 서버로 데이터를 전송하지 않습니다.
- 클립보드 접근은 브라우저 권한 정책에 따라 동작합니다.

## 기술 스택

- React
- Vite
- PWA manifest + service worker
- Netlify 배포 설정

## 로컬 실행

```bash
git clone https://github.com/wwhunter14-wwhunter/clipboard-manager.git
cd clipboard-manager/clipboard-manager-github
npm install
npm run dev
```

## 빌드

```bash
cd clipboard-manager-github
npm run build
```

빌드 결과는 `clipboard-manager-github/dist`에 생성됩니다.

## Netlify 배포

저장소 루트의 `netlify.toml`에 배포 설정이 포함되어 있습니다.

```toml
[build]
  base = "clipboard-manager-github"
  command = "npm run build"
  publish = "dist"
```

GitHub 저장소를 Netlify에 연결하면 위 설정으로 빌드됩니다.

## 프로젝트 구조

```text
clipboard-manager/
├── netlify.toml
├── LICENSE
├── README.md
└── clipboard-manager-github/
    ├── public/
    │   ├── manifest.json
    │   ├── sw.js
    │   ├── icon-192.png
    │   ├── icon-512.png
    │   ├── _headers
    │   └── _redirects
    ├── src/
    │   ├── components/
    │   ├── hooks/
    │   ├── lib/
    │   ├── App.jsx
    │   ├── constants.js
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 모바일 설치

### iPhone Safari
1. 사이트 접속
2. 공유 버튼 선택
3. "홈 화면에 추가" 선택

### Android Chrome
1. 사이트 접속
2. 메뉴에서 "홈 화면에 추가" 선택

## 라이선스

MIT
