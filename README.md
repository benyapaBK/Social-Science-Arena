# Social-Science Arena — Jigsaw Puzzle

เกมตอบคำถามความรู้ทางสังคมศาสตร์ผ่านภาพจิ๊กซอว์ 10 ภาพ โดยผู้เล่นในห้องเดียวกันมีความคืบหน้าและคะแนนรายบุคคล

## สิ่งที่อยู่ใน ZIP นี้

- หน้า Lobby พร้อมโลโก้ UI, วิดีโอ `social-science-lobby.mp4` และพื้นหลัง `Lobby.png`
- หน้า Battle เข้าร่วมห้องด้วยรหัส ชื่อ และอีโมจิ โดยใช้ Anonymous Authentication
- เข้าสู่ระบบ Host ด้วย Firebase Email/Password
- Host Dashboard, QR Code, ตัวแก้ไขคำถาม, หน้าเกม, จิ๊กซอว์ SVG, Knowledge Modal และ Leaderboard
- ข้อมูลคำถามภาษาไทย 10 ข้อและ Assets ต้นฉบับ
- Firebase config ของโปรเจกต์ `game-puzzle-6767`
- `firestore.rules`, `database.rules.json` และ `firebase.json` สำหรับ Firebase

## สถานะที่ต้องทราบก่อนใช้งานจริง

Teamwork และ Solo Practice อ่านชุดเกมที่เผยแพร่จาก Firestore โดยตรง จึงไม่ต้องใช้ Cloud Functions หรืออัปเกรดเป็น Blaze สำหรับสองโหมดนี้ การใช้ Firestore ยังอยู่ภายใต้โควตาฟรีของ Firebase; หากใช้เกินโควตาหรือเปิด Billing อาจมีค่าใช้จ่าย

Host ใช้ Firebase Email/Password Authentication (`VITE_HOST_EMAIL` หรือค่าเริ่มต้นใน `HostAuthModal.tsx`); ผู้เล่นและผู้ควบคุม Teamwork ใช้ Firebase Anonymous Authentication โดยอัตโนมัติ ไม่ต้องกรอกรหัส Host เพื่อเริ่ม Teamwork

Solo Practice และ Teamwork เลือกได้เฉพาะชุดเกมที่ Host เผยแพร่และผ่านการตรวจความพร้อม ชุดที่เผยแพร่จะอ่านได้โดยผู้ใช้ที่ลงชื่อเข้าใช้ รวมถึงคำตอบและคำใบ้ เนื่องจาก Firestore Rules ไม่สามารถซ่อนบาง field จากเอกสารที่อนุญาตให้อ่านได้ Teamwork สร้างห้องและเก็บสถานะผ่าน Firestore โดยตรง ไม่ใช้ Cloud Functions

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
2. Firebase Console → Authentication → Sign-in method: เปิด Email/Password (Host) และ Anonymous (ผู้เล่นและ Teamwork controller)
3. Authentication → Settings → Authorized domains: เพิ่ม `localhost` สำหรับทดสอบในเครื่อง และเพิ่มโดเมน Hosting/custom domain ที่ใช้จริง
4. สร้าง Firestore Database และ deploy `firestore.rules`
5. เปิด Realtime Database และ deploy `database.rules.json` เพื่อใช้เฉพาะ Presence
6. ติดตั้ง Firebase CLI แล้วล็อกอินด้วยบัญชีผู้พัฒนาที่ได้รับอนุญาต
7. จาก root ของโครงการ Deploy Rules และเว็บด้วย `firebase deploy --only firestore:rules,database,hosting`
8. อย่าเปิด Public Read/Write Rules เพื่อแก้ปัญหา permission denied

### การเข้าสู่ระบบ Host และเผยแพร่ชุดเกม

สร้าง Host account ด้วย Email/Password ใน Firebase Authentication ให้ email ตรงกับ `VITE_HOST_EMAIL` และค่าใน `firestore.rules` จากนั้นเปิดเมนูผู้ควบคุมเพื่อจัดการชุดเกม สร้างชุดเกม บันทึก และเลือก “เผยแพร่ชุดเกมให้ผู้เล่นเลือก” ชุดที่เผยแพร่ต้องมีภาพ หัวข้อ และคำตอบที่ยอมรับอย่างน้อยหนึ่งคำในทุกข้อที่เปิดใช้งาน

รายการชุดเกมอ่านจาก `questionSets` ที่ `published == true` หลังผู้เล่นลงชื่อเข้าใช้แบบ Anonymous. การเริ่ม Teamwork สร้างห้องและเอกสารคำตอบใน Firestore transaction โดยตรง; Rules ตรวจว่าชุดต้นทางยังเผยแพร่อยู่ จำกัดการเขียนห้องให้ผู้ควบคุมที่สร้างห้อง และอนุญาตให้อ่าน/แก้ชุดเกมได้เฉพาะ Host เจ้าของชุด

**ข้อควรทราบเรื่องการเผยแพร่:** ผู้ใช้ที่ลงชื่อเข้าใช้สามารถอ่านเอกสารชุดเกมที่เผยแพร่ได้ทั้งเอกสาร รวมถึงคำตอบและคำใบ้ ไม่ควรเผยแพร่เนื้อหาที่ต้องเก็บเป็นความลับ หากต้องซ่อนเฉลยจากผู้เล่น ต้องใช้ backend ที่เชื่อถือได้ เช่น Cloud Functions ซึ่งต้องเปิด Billing ตามข้อกำหนดของ Firebase

การอ่านเอกสารห้องเพื่อเข้าร่วม Battle ยังอาศัย Anonymous Authentication และการตรวจสถานะห้องใน Client/Rules; ข้อมูลเฉลย Battle ในโครงสร้างเดิมยังเป็นข้อจำกัดที่ควรย้ายการตรวจคำตอบไปฝั่ง Server ก่อนใช้แข่งขันที่ต้องป้องกันการโกง

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
- Host ใช้ Email/Password; Teamwork controller และผู้เล่นใช้ Anonymous Auth
- Public callable endpoints ส่งเฉพาะ metadata ของชุดเกม; เฉลย Teamwork อยู่ใน private room document
- คะแนนและข้อมูลผู้เล่นยังแก้ไขได้จาก Client ของผู้เล่นเอง; ห้ามใช้เป็นคะแนนแข่งขันที่เชื่อถือได้
- อย่าใช้ Local Storage เป็นแหล่งข้อมูลหลักของคะแนนหรือเวลาการแข่งขัน
- Firebase Web API key เป็นค่า config ฝั่งเว็บ ไม่ใช่ Service Account Secret; ความปลอดภัยต้องมาจาก Rules, Authentication และ Server-side authorization

## Acceptance Test Status

| กลุ่ม | สถานะ | เหตุผล |
|---|---|---|
| Assets / คำถาม 10 ข้อ | PARTIALLY IMPLEMENTED | ตรวจพบไฟล์ต้นฉบับใน ZIP และ DOCX อ่านได้; ยังไม่ได้ทดสอบใน Browser |
| UI / Responsive | IMPLEMENTED / NOT VERIFIED | มี UI แยก Teamwork, Solo Practice, Battle และ Host; ยังไม่ได้ทดสอบหลายขนาดหน้าจอ |
| Host Auth | IMPLEMENTED / NOT VERIFIED | Email/Password Auth ใช้ Host account; ต้องทดสอบกับบัญชีจริง |
| Teamwork no-login flow | IMPLEMENTED / LIVE READ VERIFIED | อ่านชุดเกมและสร้างห้องผ่าน Firestore โดยตรง; ยังต้องทดสอบการสร้างห้องจริง |
| Solo Practice published sets | IMPLEMENTED / LIVE READ VERIFIED | อ่านรายการและชุดเกมที่เผยแพร่ผ่าน Firestore โดยตรง |
| Battle room join | PARTIALLY IMPLEMENTED | ใช้ระบบรหัสห้อง/ชื่อ/อีโมจิเดิม; ยังต้องทดสอบ Rules และหลาย sessions |
| Multiplayer Real-Time | PARTIALLY IMPLEMENTED | การเขียนห้องและผู้เล่นใช้ Firestore Rules; ยังต้องทดสอบหลาย sessions และเพิ่ม validation ป้องกันการโกงคะแนน |
| Server timer / pause-resume | BLOCKED | ต้องใช้ Server-side state เป็นแหล่งความจริง |
| Server-side scoring / anti-cheat | BLOCKED | Client logic ยังมีอยู่; ห้ามถือเป็นคะแนนจริง |
| Firestore Rules | DEPLOYED / NOT EMULATOR-TESTED | Rules รองรับการอ่านชุดเผยแพร่และสร้าง Teamwork room แบบ client |
| Production deployment | PARTIAL | Direct Firestore flow ถูก Deploy แล้ว; Cloud Functions ไม่ได้ใช้งาน |

## ขั้นตอนถัดไปที่จำเป็น

1. ทดสอบ Firestore Rules โดยเฉพาะสิทธิ์ controller, Host และผู้เล่น Battle
2. ทดสอบการสร้างห้อง Teamwork จริง รวมถึงการปิดห้อง
3. ทดสอบ Host Auth, Solo Practice และ Battle ด้วยบัญชี/Browser sessions จริง
4. ย้ายการตรวจคำตอบและคำนวณคะแนน Battle ไป trusted server ก่อนใช้คะแนนเป็นผลการแข่งขันที่เชื่อถือได้
