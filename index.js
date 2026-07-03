const { Client, GatewayIntentBits } = require('discord.js');
const { QuickDB } = require("quick.db");

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

const db = new QuickDB();

client.on('ready', () => {
    console.log(`✅ البوت متصل ومستعد يا باطو!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith("!")) return;

    const parts = message.content.split(" ");
    const command = parts[0];

    // أمر الإضافة: !additem اسم سعر رابط
    if (command === '!additem') {
        if (message.author.id !== "1025694968137912322") return;
        
        const name = parts[1];
        const price = parts[2];
        const link = parts[3];

        if (!name || !price || !link) {
            return message.reply("❌ اكتب الأمر هكذا: `!additem اسم سعر رابط`");
        }

        await db.set(`item_${name}`, { name, price, link });
        return message.reply(`✅ تم حفظ المنتج: ${name} بالسعر ${price}`);
    }

    // أمر الشراء: !buy اسم
    if (command === '!buy') {
        const name = parts[1];
        const item = await db.get(`item_${name}`);
        if (!item) return message.reply("❌ المنتج غير موجود.");

        await message.reply(`💳 حول ${item.price} كريدت ثم أرسل "تم" في الشات.`);

        const filter = m => m.author.id === message.author.id && m.content === "تم";
        const collector = message.channel.createMessageCollector({ filter, time: 600000 });

        collector.on('collect', () => {
            message.reply(`✅ تم التأكيد! تم إرسال الرابط لك في الخاص: ${item.link}`);
            message.author.send(`📦 الرابط الخاص بك: ${item.link}`).catch(() => {
                message.reply("⚠️ الخاص مغلق! افتحه لاستلام الرابط.");
            });
            collector.stop();
        });
    }
});

client.login(process.env.TOKEN);
