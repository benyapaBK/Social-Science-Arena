# Social-Science Arena — Jigsaw Puzzle

เกมตอบคำถามความรู้ทางสังคมศาสตร์ผ่านภาพจิ๊กซอว์ 10 ภาพ โดยผู้เล่นในห้องเดียวกันมีความคืบหน้าและคะแนนรายบุคคล

## สิ่งที่อยู่ใน ZIP นี้

- หน้า Lobby พร้อมโลโก้ UI, วิดีโอ `social-science-lobby.mp4` และพื้นหลัง `Lobby.png`
- หน้าเข้าห้องด้วยรหัสและ Google Sign-In
- เข้าสู่ระบบ Host ด้วยรหัส Host โดยไม่ต้องใช้ Google Sign-In
- Host Dashboard, QR Code, ตัวแก้ไขคำถาม, หน้าเกม, จิ๊กซอว์ SVG, Knowledge Modal และ Leaderboard
- ข้อมูลคำถามภาษาไทย 10 ข้อและ Assets ต้นฉบับ
- Firebase config ของโปรเจกต์ `game-puzzle-6767`
- `firestore.rules`, `database.rules.json` และ `firebase.json` สำหรับ Firebase Spark

## สถานะที่ต้องทราบก่อนใช้งานจริง

**ยังไม่ถือว่าเป็นระบบ Production และยังไม่ได้ทดสอบกับ Firebase Emulator หรือบัญชีจริงใน ZIP นี้**

Host เข้าระบบด้วยรหัส `host123` และ Firebase Anonymous Authentication; ผู้เล่นยังเข้าสู่ระบบด้วย Google ได้ ระบบไม่ใช้ Custom Claims หรือ Cloud Functions และ Firestore Rules จำกัดการสร้าง/แก้ห้องไว้กับ UID ของ Anonymous Auth ที่เป็นเจ้าของห้อง อย่างไรก็ตาม รหัส Host อยู่ใน JavaScript ฝั่งเว็บและสามารถตรวจพบหรือข้าม UI ได้ จึงไม่ใช่การยืนยันตัวตนที่ปลอดภัย

ห้องและความคืบหน้าเกมเขียนจาก Client โดยตรงตาม Firestore Rules จึงไม่ต้องใช้แผน Blaze หรือ Cloud Functions สำหรับสิทธิ์ Host อย่างไรก็ตาม คะแนนและข้อมูลผู้เล่นยังเป็นข้อมูลที่ Client ส่งมา ไม่ควรใช้เป็นผลการแข่งขันที่ป้องกันการโกงได้ และชุดคำถาม/เฉลยที่ฝังในแอปไม่ใช่ข้อมูลลับ

การตรวจคำตอบและคำนวณคะแนนที่ UI เรียกอยู่ในขณะนี้เป็น logic ฝั่ง Client สำหรับพัฒนา UI เท่านั้น **ห้ามใช้ผลคะแนนนี้เป็นผลการแข่งขันที่เชื่อถือได้** จนกว่าจะย้ายไปตรวจสอบและคำนวณฝั่ง Server

## เทคโนโลยีที่มีอยู่ในโครงการ

ZIP ต้นฉบับใช้ Vite + React + TypeScript + Tailwind CSS ไม่ใช่ Vanilla JavaScript ตาม Master Prompt เดิม การปรับรอบนี้รักษาโครงสร้างโครงการเดิมเพื่อให้ใช้ components ที่มีอยู่ได้ ไม่ได้แปลงทั้งระบบเป็น Vanilla JS

## ติดตั้งและเปิดในเครื่อง

ต้องติดตั้ง Node.js รุ่นที่ Vite รองรับ และ npm

```bash
npm install
npm run dev
```

เปิด URL ที่ Vite แสดงใน Terminal. หากติดตั้ง dependencies ไม่สำเร็จ ให้ตรวจ Node/npm และเครือข่ายก่อน

ตรวจ TypeScript:

```bash
npm run lint
```

สร้าง production bundle:

```bash
npm run build
```

## Firebase Setup

1. ใช้ Firebase Project ID `game-puzzle-6767` ที่ระบุใน `src/firebase.ts`
2. Firebase Console → Authentication → Sign-in method: เปิด Google (ผู้เล่น) และ Anonymous (Host) ในโปรเจกต์ `game-puzzle-6767`
3. Authentication → Settings → Authorized domains: เพิ่ม `localhost` สำหรับทดสอบในเครื่อง และเพิ่มโดเมน Hosting/custom domain ที่ใช้จริง
4. สร้าง Firestore Database และ deploy `firestore.rules`
5. เปิด Realtime Database และ deploy `database.rules.json` เพื่อใช้เฉพาะ Presence
6. ติดตั้ง Firebase CLI แล้วล็อกอินด้วยบัญชีผู้พัฒนาที่ได้รับอนุญาต
7. จาก root ของโครงการ รัน `firebase deploy --only firestore:rules,database,hosting`
8. อย่าเปิด Public Read/Write Rules เพื่อแก้ปัญหา permission denied

### การเข้าสู่ระบบ Host

กรอกรหัส Host `host123` เพื่อเริ่ม Firebase Anonymous Authentication และสร้างห้องได้ ระบบแสดงข้อความเข้าสู่ระบบสำเร็จพร้อมเครื่องหมายถูก ผู้เล่นยังใช้ Google Sign-In ตามเดิม ส่วน Google account ไม่ได้รับสิทธิ์ Host ในหน้าเว็บ

Firestore Rules ตรวจว่า Host ใช้ Anonymous Authentication และตรวจ UID เจ้าของห้องทุกครั้งที่แก้ไข จึงไม่สามารถเปลี่ยน `hostUid` ของห้องที่มีอยู่ได้ แต่ Firebase Rules ไม่สามารถตรวจว่าผู้ใช้ผ่านช่องกรอกรหัสบนเว็บหรือไม่: ผู้ที่รู้ Firebase project config สามารถเรียก Anonymous Authentication โดยตรงและสร้างห้องของตนได้ ดังนั้นกลไกนี้เป็นเพียงด่านหน้า/ควบคุม UX ไม่ใช่การจำกัด Host ให้มีคนเดียวหรือระบบป้องกันการยกระดับสิทธิ์ที่แข็งแรง หากต้องการรักษาความปลอดภัยจริง ต้องใช้ผู้ให้บริการยืนยันตัวตนที่ Rules เชื่อถือได้หรือ trusted backend ซึ่งเกินเงื่อนไข Spark-only แบบไม่ใช้ Functions

Anonymous Host UID ผูกกับข้อมูลการเข้าสู่ระบบของเบราว์เซอร์นั้น หากล้างข้อมูลเว็บไซต์หรือออกจากระบบ อาจสูญเสียสิทธิ์แก้ไขห้องเก่าที่สร้างไว้ ควรใช้เบราว์เซอร์/อุปกรณ์เดิมและอย่าล้าง site data สำหรับการใช้งาน Host

การอ่านเอกสารห้องที่ล็อกอินแล้วทำได้เพื่อให้ผู้เล่นเข้าห้องด้วยรหัสได้ ข้อมูลคำถามและเฉลยในเอกสาร/Bundle ไม่ได้ถูกปกปิดจากผู้เล่น การป้องกันการโกงคะแนนหรือการซ่อนเฉลยต้องออกแบบแยกต่างหาก และอยู่นอกขอบเขต Spark-only แบบไม่มี trusted server

รหัส Host `host123` เป็นรหัสตัวอย่างที่ฝังในเว็บ ห้ามใช้เป็นรหัสลับหรือรหัสผ่านจริง หากเปิด Anonymous provider แล้ว ผู้ใช้สามารถข้ามด่านนี้ด้วย Firebase SDK ได้ การแจ้งสำเร็จในแอปยืนยันเพียงว่าการสร้าง Anonymous Auth session สำเร็จ

หาก Host แสดง `auth/admin-restricted-operation` หรือ `auth/operation-not-allowed` ให้เปิด Firebase Console ของโปรเจกต์ `game-puzzle-6767` → Authentication → Sign-in method → Anonymous → Enable แล้วบันทึก จากนั้นลองเข้าสู่ระบบใหม่ ไม่ต้อง deploy เว็บหรือ Firestore Rules ซ้ำสำหรับการเปลี่ยน provider หากเปิดแล้วแต่ยังพบ error ให้ตรวจว่าเลือกโปรเจกต์/tenant ถูกต้อง และตรวจ Firebase Authentication/Identity Platform ว่าไม่ได้ปิดกั้น Anonymous sign-in ด้วยนโยบายผู้ดูแลระบบ

หากเคยพบ `Unsupported field value: undefined` ตอนสร้างห้อง โค้ดปัจจุบันตั้ง Firestore ให้ละเว้น optional fields ที่ไม่มีค่า (เช่นอีเมลของ Anonymous Host) แล้ว ให้ deploy Hosting เวอร์ชันใหม่เพื่อรับการแก้ไขนี้

## Assets

เก็บไฟล์ต้นฉบับไว้ใน `public/assets/` ตามชื่อเดิม:

- `Lobby.png`
- `q1.png` ถึง `q10.png`
- `social-science-lobby.mp4`
- `ข้อมูลทรัพยากรภายในเกมเบื่องต้น.docx`

ข้อมูลคำถามใน `src/data/defaultQuestions.ts` อ้างอิงหัวข้อ คำใบ้ เฉลย และความรู้จาก DOCX ต้นฉบับ

## Security Notes

- ห้ามบันทึกรหัสผ่านลง Firestore
- ห้ามเชื่อคะแนน, UID, Role, Host UID หรือ Timestamp ที่ Client ส่งมา
- ห้ามเปิดเผยคำตอบก่อนผู้เล่นตอบถูกหรือหมดเวลา
- Firestore Rules เป็นแหล่งบังคับสิทธิ์ Host; สถานะ role ใน UI ไม่ได้รับความเชื่อถือ
- Anonymous Auth sessions ใช้สร้าง Host rooms ได้; Google Sign-In ใช้สำหรับผู้เล่น
- คะแนนและข้อมูลผู้เล่นยังแก้ไขได้จาก Client ของผู้เล่นเอง; ห้ามใช้เป็นคะแนนแข่งขันที่เชื่อถือได้
- อย่าใช้ Local Storage เป็นแหล่งข้อมูลหลักของคะแนนหรือเวลาการแข่งขัน
- Firebase Web API key เป็นค่า config ฝั่งเว็บ ไม่ใช่ Service Account Secret; ความปลอดภัยต้องมาจาก Rules, Authentication และ Server-side authorization

## Acceptance Test Status

| กลุ่ม | สถานะ | เหตุผล |
|---|---|---|
| Assets / คำถาม 10 ข้อ | PARTIALLY IMPLEMENTED | ตรวจพบไฟล์ต้นฉบับใน ZIP และ DOCX อ่านได้; ยังไม่ได้ทดสอบใน Browser |
| UI / Responsive | NOT VERIFIED | ยังไม่ได้รัน build หรือทดสอบหลายขนาดหน้าจอ |
| Google Sign-In / Host Auth | PARTIALLY IMPLEMENTED | ต้องเปิด Google + Anonymous providers, deploy Firestore Rules และทดสอบกับบัญชีจริง |
| QR / Room creation | PARTIALLY IMPLEMENTED | UI/โค้ดเดิมมีอยู่ แต่ต้องทดสอบ URL จริงและ Rules |
| Multiplayer Real-Time | PARTIALLY IMPLEMENTED | การเขียนห้องและผู้เล่นใช้ Firestore Rules; ยังต้องทดสอบหลาย sessions และเพิ่ม validation ป้องกันการโกงคะแนน |
| Server timer / pause-resume | BLOCKED | ต้องใช้ Server-side state เป็นแหล่งความจริง |
| Server-side scoring / anti-cheat | BLOCKED | Client logic ยังมีอยู่; ห้ามถือเป็นคะแนนจริง |
| Firestore Rules | NOT VERIFIED | สร้าง Rules แบบ least privilege แล้ว แต่ยังไม่ได้ทดสอบด้วย Emulator Suite |
| Production deployment | NOT DEPLOYED | ไม่ได้ deploy จากสภาพแวดล้อมนี้ |

## ขั้นตอนถัดไปที่จำเป็น

1. ติดตั้ง dependencies และแก้ข้อผิดพลาดจาก `npm run lint` / `npm run build`
2. ทดสอบ Host Auth และ Firestore Rules ด้วย Firebase Emulator Suite หรือบัญชีทดสอบ
3. ย้ายการสร้าง/เข้าห้อง, สถานะ Ready, เวลา, เปิดชิ้น, ขอคำใบ้, ส่งคำตอบ, คะแนน, pause/resume และผลลัพธ์ไป Server-side transactions
4. แยกข้อมูลคำถามสาธารณะออกจากเฉลยที่เก็บฝั่ง Server
5. เพิ่ม Emulator tests สำหรับ Rules และ Functions
6. ทดสอบด้วย 3 บัญชี/Browser sessions และตรวจ Acceptance Tests ก่อน  production
