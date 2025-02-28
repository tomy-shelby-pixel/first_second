import "dotenv/config";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Api } from "telegram/tl/index.js";
import input from "input";
import fs from "fs";
import { Bot } from "grammy";
const API_ID = Number(process.env.API_ID);
const API_HASH = process.env.API_HASH;
const SESSION_STRING = process.env.SESSION_STRING;
const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_USERNAME = process.env.BOT_USERNAME;
const bot = new Bot(BOT_TOKEN);
const DB_FILE = "db.json";

const CHANNEL_IDS = ["1237513492", "1548971130", "2392013995", "2138557992"];
const GROUP_IDS = ["1155277602", "2262163920","2080180118","2291547071","1990510779","2048404999"];
const client = new TelegramClient(new StringSession(SESSION_STRING), API_ID, API_HASH, { connectionRetries: 5 });
function updateStats(success = true, blocked = false) {
  let stats = { total_requests: 0, last_check: new Date().toISOString(), blocked: false };
  try {
    if (fs.existsSync(DB_FILE)) {
      const fileContent = fs.readFileSync(DB_FILE, "utf8");
      if (fileContent) {
        try {
          stats = JSON.parse(fileContent);
        } catch (error) {
          console.error("-");
        }
      }
    }
  } catch (err) {
    console.error("Error reading file:", err);
  }
  stats.total_requests++;
  if (blocked) stats.blocked = true;  
  if (!success) stats.blocked = true; 
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(stats, null, 2));
  } catch (err) {
    console.error("Error writing stats to file:", err);
  }
}
async function getLastMessage(entityId, isChannel = true) {
  try {
    const peer = isChannel ? Number("-100" + entityId) : Number(entityId); // If it's a channel, prepend -100
    const entity = await client.getEntity(peer); // Get the correct entity (channel/group)
    const history = await client.invoke(new Api.messages.GetHistory({ peer: entity, limit: 1 }));
    return history.messages.length ? history.messages[0] : null;
  } catch (err) {
    console.error("Error getting message:", err);
    return null;
  }
}
async function forwardMessageToBot(message) {
  try {
    if (message.message) {
      await client.invoke(
        new Api.messages.SendMessage({
          peer: BOT_USERNAME,
          message: message.message,
        })
      );
    }
    if (message.media) {
      if (message.media._ == "MessageMediaPhoto") {
        await client.invoke(
          new Api.messages.SendMedia({
            peer: BOT_USERNAME,
            media: {
              _: "InputMediaPhoto",
              id: message.media.id,
              accessHash: message.media.accessHash,
              fileReference: message.media.fileReference,
            },
          })
        );
      } else if (message.media._ == "MessageMediaVideo") {
        await client.invoke(
          new Api.messages.SendMedia({
            peer: BOT_USERNAME,
            media: {
              _: "InputMediaVideo",
              id: message.media.id,
              accessHash: message.media.accessHash,
              fileReference: message.media.fileReference,
            },
          })
        );
      } else if (message.media._ == "MessageMediaDocument") {
        await client.invoke(
          new Api.messages.SendMedia({
            peer: BOT_USERNAME,
            media: {
              _: "InputMediaDocument",
              id: message.media.id,
              accessHash: message.media.accessHash,
              fileReference: message.media.fileReference,
            },
          })
        );
      }
    }
    updateStats(true);
  } catch (err) {
    console.error("Error sending message:", err);
    updateStats(false, true);  
  }
}
async function main() {
  await client.start({
    phoneNumber: async () => await input.text("Telefon raqamingizni kiriting: "),
    password: async () => await input.text("2FA parolni kiriting: "),
    phoneCode: async () => await input.text("SMS kodini kiriting: "),
    onError: (err) => console.log("-"),
  });
  console.log("+");
  let isChannelTurn = true; 
  setInterval(async () => {
    if (isChannelTurn) {
      const randomChannelId = CHANNEL_IDS[Math.floor(Math.random() * CHANNEL_IDS.length)];
      const lastChannelMessage = await getLastMessage(randomChannelId);
      if (lastChannelMessage) await forwardMessageToBot(lastChannelMessage);
    } else {
      const randomGroupId = GROUP_IDS[Math.floor(Math.random() * GROUP_IDS.length)];
      const lastGroupMessage = await getLastMessage(randomGroupId);
      if (lastGroupMessage) await forwardMessageToBot(lastGroupMessage);
    }
    isChannelTurn = !isChannelTurn;
    //TIME
  }, 2000); 
}
bot.command("get_info", async (ctx) => {
  let stats = { total_requests: 0, last_check: "Noma'lum", blocked: false };
  if (fs.existsSync(DB_FILE)) {
    stats = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  }
  await ctx.reply(
    `📊 Bot statistikasi:
    
    🔄 Umumiy so'rovlar: ${stats.total_requests}
    🕒 Oxirgi tekshirish: ${stats.last_check}
    🚫 Bot bloklangan: ${stats.blocked ? "Ha" : "Yo'q"}`
  );
});
bot.start();
client.connect().then(main).catch(console.error);
