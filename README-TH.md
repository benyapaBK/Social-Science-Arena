# Social Science Arena — HUSO

เว็บเกมเปิดภาพจิ๊กซอว์ทายคำศัพท์/ประเด็นทางสังคมศาสตร์ สร้างด้วย HTML, CSS, Vanilla JavaScript และ Firebase Authentication + Cloud Firestore

## สิ่งที่ปรับปรุงในชุดนี้
- ปรับ UI ให้เป็นกึ่งทางการ โทนเขียวธรรมชาติ/ครีม/ทอง เหมาะกับสาขาสังคมศาสตร์ พร้อมการ์ดและระยะห่างที่สบายตา
- ปรับหน้าเข้าสู่ระบบ ล็อบบี้ ห้องแข่งขัน หน้าตอบคำถาม และหน้าสรุปคะแนนให้รองรับมือถือ
- แก้ syntax error จากข้อความ `[cite: ...]` ที่แทรกใน JavaScript
- แก้พาธรูปภาพให้ตรงกับไฟล์จริง `.png` แทน `.jpg`
- แก้ `id="p2-name"` ที่ซ้ำกัน
- แก้ listener ที่เรียกสร้างกระดานซ้ำทุกครั้งที่คะแนน/ข้อมูลห้องเปลี่ยน โดยให้สร้างกระดานเมื่อเปลี่ยนรอบเท่านั้น
- แก้การดึง `getDocs` ให้ import ตรงจาก Firebase SDK
- เพิ่มการตรวจรหัสห้อง, ชื่อเล่น, ข้อความผิดพลาด, Enter เพื่อส่งคำตอบ, ป้องกันแสดงชื่อผู้เล่นเป็น HTML และจัดอันดับโดยใช้คะแนน/จำนวนข้อถูก
- เพิ่ม `firebase.json` และ Firestore Rules เริ่มต้น

## วิธีเปิดใช้งาน
1. ติดตั้ง Firebase CLI: `npm install -g firebase-tools`
2. เข้าสู่ระบบ: `firebase login`
3. เปิดโปรเจกต์นี้ใน Terminal แล้วรัน `firebase use --add` เพื่อเลือก Firebase project ที่ตั้งค่าไว้
4. ใน Firebase Console เปิด Authentication > Sign-in method และเปิด Email/Password กับ Google
5. สร้าง Firestore Database แล้ว deploy rules: `firebase deploy --only firestore:rules`
6. Deploy เว็บ: `firebase deploy --only hosting`

สามารถเปิด `public/index.html` ผ่าน local server เพื่อทดสอบ UI ได้ แต่ระบบ Firebase จะต้องเปิด Authentication และ Firestore ก่อนจึงจะใช้งานจริงได้

## ข้อควรทราบด้านความปลอดภัย
- ในโค้ดตัวอย่างนี้ Host ถูกตรวจด้วยอีเมล `host123@gmail.com` เพื่อให้ตรงกับโครงสร้างเดิม เป็นเพียงวิธีสำหรับ prototype ไม่ใช่การยืนยันสิทธิ์ที่ปลอดภัยสำหรับ production ควรเปลี่ยนไปใช้ Firebase custom claims ที่กำหนดจาก Admin SDK/Cloud Functions
- คะแนนยังถูกคำนวณและเขียนจาก client เพื่อรักษาการทำงานของ prototype ดังนั้นผู้เล่นที่มีความรู้ด้านเว็บอาจแก้คะแนนได้ แม้ Firestore Rules จะจำกัดการแก้ไขบางส่วนแล้วก็ตาม สำหรับการแข่งขันจริงควรย้ายการตรวจคำตอบและการคำนวณคะแนนไป Cloud Functions และไม่ส่งคำตอบเฉลยให้ client ก่อนเวลา
- ไฟล์ `q11.png` ที่อยู่ในชุดต้นฉบับยังคงเก็บไว้ แต่เกมปัจจุบันใช้ 10 ข้อจาก `q1.png` ถึง `q10.png`

## ฟีเจอร์ UI เพิ่มเติม (Sidebar / Profile / History / Lobby Banner)

- เมนู Sidebar: หน้าล็อบบี้, โปรไฟล์ของฉัน, ประวัติการเล่น และปุ่มเข้าสู่ระบบ/ออกจากระบบ
- โปรไฟล์แสดงอีเมล/ชื่อบัญชี บทบาท และจำนวนเกม/คะแนนรวมจากประวัติที่บันทึกไว้
- ประวัติการเล่นบันทึกคะแนน จำนวนข้อที่ตอบถูก อันดับ และเวลาจบเกมใน `users/{uid}/gameHistory/{roomCode}`
- หน้า Lobby มี Banner ภาพตัวอย่างเกมพร้อมหัวข้อและคำอธิบาย
- บัญชี Host ที่โค้ดกำหนดไว้ (`host123@gmail.com`) จะเห็นตัวแก้ไข Banner สามารถเปลี่ยนหัวข้อ คำอธิบาย และ URL/พาธภาพ แล้วบันทึกไว้ใน Firestore `appSettings/lobbyBanner`
- ภาพแบนเนอร์รองรับ URL สาธารณะที่ขึ้นต้นด้วย `https://` หรือไฟล์ในเว็บ เช่น `assets/images/q1.png`

### หลังอัปเดตโค้ด

1. ตรวจสอบว่า `firebase use` ชี้ไปที่โปรเจกต์ `game-huso`
2. Deploy Hosting: `firebase deploy --only hosting`
3. กฎ Firestore ถูกแก้เพื่อรองรับ Banner และประวัติส่วนตัว หากต้องการใช้ฟีเจอร์เหล่านี้กับ Firebase จริง ให้ตรวจสอบกฎก่อนแล้ว deploy rules ด้วย `firebase deploy --only firestore:rules`
4. สิทธิ์ Host ในตัวอย่างนี้อิงอีเมล `host123@gmail.com` ตามโค้ดเดิม จึงต้องใช้บัญชีนั้น หรือเปลี่ยนการตรวจสิทธิ์ให้ตรงกับบัญชี Host ที่ตั้งใจใช้ทั้งใน `public/index.html` และ `firestore.rules`

> ข้อควรทราบ: คะแนนยังมีการอัปเดตจากฝั่ง Client ตามระบบ Prototype เดิม ไม่ควรใช้กับการแข่งขันที่ต้องการป้องกันการโกงโดยไม่มี Cloud Functions ตรวจคำตอบและคำนวณคะแนนฝั่ง Server
