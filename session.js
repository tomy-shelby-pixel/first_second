import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js"; 
import input from "input";
import "dotenv/config";

const API_ID = parseInt(process.env.API_ID);
const API_HASH = process.env.API_HASH;

const client = new TelegramClient(new StringSession(""), API_ID, API_HASH, { connectionRetries: 5 });

(async () => {
  console.log("Telefon raqamingizni kiriting:");
  await client.start({
    phoneNumber: async () => await input.text("Telefon raqam (+998xxxxxxxxx): "),
    password: async () => await input.text("Telegram parol (agar mavjud bo‘lsa): "),
    phoneCode: async () => await input.text("Telegram SMS kodini kiriting: "),
    onError: (err) => console.log(err),
  });

  console.log("Sessiya muvaffaqiyatli yaratildi!");
  console.log("Quyidagi SESSION_STRING ni .env fayliga qo‘shing:");
  console.log(client.session.save());

  await client.disconnect();
})();
