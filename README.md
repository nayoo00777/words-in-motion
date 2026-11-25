# 소리의 활자 — Words in Motion

밝은 종이 위의 검은 세리프 활자가 소리에 반응하며 흐르는 인터랙티브 타이포그래피입니다.
소리가 커지면 글자들이 각기 다른 방향으로 화면 전체에 흩어지며 회전하고 크기가 달라집니다.
흩어질 때는 빠르게 반응하고, 조용해지면 각 글자가 원래 줄과 위치로 부드럽게 돌아옵니다. 소리가 없을 때는 작은 흐름만 유지합니다.
문구에는 GIFT, 교육, 상상력에 관한 영어·프랑스어 문장을 사용했습니다.

## 실행

```sh
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 3001
```

http://127.0.0.1:3001/ 에서 마이크 켜기를 누르고 권한을 허용하세요.
소리 감도, 움직임 속도, 글자 농도를 조절할 수 있습니다. 설정 숨기기로 작품을 넓게 볼 수 있습니다.
마이크 음성은 브라우저 안에서 분석하며 녹음하거나 전송하지 않습니다.

## 검증

```sh
node node_modules/typescript/bin/tsc --noEmit
node --experimental-strip-types --test src/frequency.test.ts
node node_modules/vite/bin/vite.js build
```

현재 화면은 src/App.tsx와 src/TypeField.tsx입니다.
이전 리본과 해파리 구현은 src/AsciiGift.tsx와 src/AsciiJellyfish.tsx에 보관되어 있습니다.

