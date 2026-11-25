# 소리의 활자 — Words in Motion

화면 전체를 채운 검은 세리프 활자가 소리에 반응해 원형 파동과 큰 물결로 움직이는 작품입니다.
소리가 커지면 화면 중심에서 퍼지는 파동과 대각선 물결의 진폭이 커지고, 조용해지면 잔잔해집니다.
오른쪽 위에서 마이크 켜기와 전체 화면을 누르세요. Esc로 전체 화면을 종료합니다. 설정은 기본적으로 접혀 있습니다.
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


