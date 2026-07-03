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
const PROBOT_ID = "282859044593598464"; 
const MY_ID = "1025694968137912322"; 

client.on('ready', () => {
    console.log(`✅ البوت يعمل الآن وبكامل الحماية!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith("!")) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // أمر الإضافة: !additem [الاسم] [السعر] [الرابط]
    if (command === 'additem') {
        if (message.author.id !== MY_ID) return;
        const name = args[0], price = args[1], link = args.slice(2).join(" ");
        if (!name || !price || !link) return message.reply("❌ اكتب: `!additem اسم سعر رابط`");
        await db.set(`item_${name}`, { name, price, link });
        message.reply(`✅ تم حفظ المنتج: ${name} بسعر ${price}`);
    }

    // أمر الشراء: !buy [الاسم]
    if (command === 'buy') {
        const item = await db.get(`item_${args[0]}`);
        if (!item) return message.reply("❌ المنتج غير موجود.");

        const buyMsg = await message.reply(`💳 لشراء **${item.name}**، حول **${item.price}** كريدت لـ <@${MY_ID}>\nثم أرسل كلمة **"تم"** هنا.`);

        const filter = m => m.author.id === message.author.id && m.content.toLowerCase() === "تم";
        const collector = message.channel.createMessageCollector({ filter, time: 600000 });

        collector.on('collect', async () => {
            const msgs = await message.channel.messages.fetch({ limit: 50 });
            
            // تحقق: هل هناك رسالة من البروبوت أحدث من رسالة الشراء؟
            // وهل تحتوي على السعر المطلوب؟
            const payment = msgs.find(m => 
                m.author.id === PROBOT_ID && 
                m.createdTimestamp > buyMsg.createdTimestamp &&
                m.content.includes(item.price) 
            );

            if (!payment) {
                return message.reply(`❌ لم أجد تحويلاً صحيحاً بقيمة **${item.price}**! تأكد من التحويل.`);
            }

            try {
                await message.author.send(`📦 طلبك لـ **${item.name}** هو:\n${item.link}`);
                message.reply("✅ تم التأكيد! تم إرسال الرابط لك في الخاص.");
            } catch {
                message.reply("⚠️ الخاص مغلق! افتحه لاستلام الرابط.");
            }
            collector.stop();
        });
    }
});

client.login(process.env.TOKEN);
