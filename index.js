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
const PREFIX = "!";
const OWNER_ID = "1025694968137912322"; 
const TARGET_ACCOUNT = "1025694968137912322"; // أيدي حسابك بدون <>
const PROBOT_ID = "282859044593598464"; // الأيدي الرسمي لـ ProBot

client.on('ready', () => {
    console.log(`✅ البوت يعمل الآن: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // أمر إضافة منتج: !additem [الاسم] [السعر] [الرابط]
    if (command === 'additem') {
        if (message.author.id !== OWNER_ID) return;
        const name = args[0];
        const price = args[1];
        const link = args.slice(2).join(" ");
        if (!name || !price || !link) return message.reply("❌ الاستخدام: `!additem [الاسم] [السعر] [الرابط]`");
        
        await db.set(`item_${name}`, { name, price, link });
        message.reply(`✅ تم حفظ **${name}** بالسعر **${price}**.`);
    }

    // أمر الشراء: !buy [الاسم]
    if (command === 'buy') {
        const name = args[0];
        const item = await db.get(`item_${name}`);
        if (!item) return message.reply("❌ هذا المنتج غير موجود.");

        message.reply(`💳 لشراء **${item.name}**، قم بتحويل **${item.price}** لـ <@${TARGET_ACCOUNT}>\nثم أرسل كلمة **"تم"** هنا.`);

        const filter = m => m.author.id === message.author.id && m.content.toLowerCase() === "تم";
        const collector = message.channel.createMessageCollector({ filter, time: 600000 });

        collector.on('collect', async (m) => {
            // البحث عن رسالة من ProBot في آخر 50 رسالة
            const messages = await message.channel.messages.fetch({ limit: 50 });
            const proBotConfirmation = messages.find(msg => 
                msg.author.id === PROBOT_ID && 
                msg.content.includes(TARGET_ACCOUNT) && 
                msg.content.includes(message.author.id)
            );

            if (!proBotConfirmation) {
                return message.reply("❌ لم أجد رسالة تحويل من ProBot باسمك! تأكد من التحويل أولاً.");
            }

            // إذا وجد التحويل، يتم التسليم
            message.channel.send(`✅ تم التأكيد! تم إرسال الرابط لك في الخاص.`);
            try {
                await message.author.send(`📦 طلبك **${item.name}**:\n${item.link}`);
            } catch (e) {
                message.channel.send("⚠️ يا بطل، الخاص عندك مغلق، افتحه لاستلام الرابط.");
            }
            collector.stop();
        });
    }
});

client.login(process.env.TOKEN);
