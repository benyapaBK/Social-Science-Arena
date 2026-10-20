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
