# แพ็กเกจย้าย MindPay เข้า repo ของกลุ่ม

แบ่งโค้ด MindPay (commit `646b485` ของ [2550expo-tech/Socrates-and-Skeletons-](https://github.com/2550expo-tech/Socrates-and-Skeletons-)) เป็น 5 ชุดตาม FR
ให้สมาชิกแต่ละคน commit ครั้งเดียวแล้ว push เข้า `main` จาก VS Code ผลัดกันตามลำดับ 1 → 2 → 3 → 4 → 5
ทุกไฟล์อยู่ในชุดเดียว ไม่มีไฟล์ซ้ำ จึงไม่เกิด conflict

| ไฟล์ | งาน |
|---|---|
| `MindPay-part1-FR1-FR2.zip` | FR-1 จดรายการ + FR-2 ภาพรวม |
| `MindPay-part2-FR3.zip` | FR-3 พูดจด + ระบบบัญชีผู้ใช้ + Design System |
| `MindPay-part3-FR4.zip` | FR-4 สแกนสลิป + ชุดทดสอบในเบราว์เซอร์ |
| `MindPay-part4-FR5.zip` | FR-5 โค้ชน้องกล้า + สกิน ภารกิจ ฮาโลวีน |
| `MindPay-part5-FR6.zip` | FR-6 Money Runway + โครงแอป ตั้งค่าโปรเจกต์ CI (รวมเป็นชุดสุดท้าย) |
| `TEAM-PLAN.pdf` | ภาพรวมทั้งทีม และขั้นตอนของเจ้าของ repo |
| `VSCODE-GUIDE.pdf` | คู่มือ VS Code ทีละขั้น พร้อมคำสั่ง (ใช้ได้ทุกชุด ทั้ง Windows และ Mac) |

ในแต่ละ zip มี `HOW-TO-partN.pdf` (ขั้นตอนใน VS Code), `COMMIT-MESSAGE.txt` และโฟลเดอร์ `files` ที่คัดลอกเข้า repo ได้ทั้งก้อน

ตรวจแล้ว: รวม 5 ชุดได้แอปครบตรงกับ repo เดิม, typecheck ผ่าน, เทสต์ 157/157 ผ่าน, ทดสอบในเบราว์เซอร์ 145/145 ผ่านเมื่อ repo ใช้ชื่ออื่น,
จำลอง 5 คน push เข้า main ทีละคน (รวมกรณี push ชนกัน): ไม่มี conflict ไม่มี merge commit และได้คนละ 1 commit

`tools/` คือสคริปต์ที่ใช้แบ่งไฟล์และสร้างเอกสาร: `python3 build.py && python3 docs2.py` แล้ว `node render.mjs <โฟลเดอร์ out2/docs>`
(แก้ค่า `REPO` ใน `plan.py` และ `FONTS` ใน `docs.py` ให้ชี้เครื่องตัวเองก่อน)
