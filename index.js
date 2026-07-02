const { Client, GatewayIntentBits } = require('discord.js');
const { QuickDB } = require("quick.db");

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ] 
});

const db = new QuickDB();
const PREFIX = "!";
const OWNER_ID = "1025694968137912322"; 
const TARGET_ACCOUNT = "1025694968137912322"; // أيدي حسابك
const PROBOT_ID = "282859044593598464"; 

client.on('ready', () => {
    console.log(`✅ البوت جاهز للعمل يا باطو!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // أمر إضافة منتج
    if (command === 'additem') {
        if (message.author.id !== OWNER_ID) return;
        const name = args[0], price = parseInt(args[1]), link = args.slice(2).join(" ");
        if (!name || isNaN(price) || !link) return message.reply("❌ الاستخدام: `!additem [الاسم] [السعر] [الرابط]`");
        await db.set(`item_${name}`, { name, price, link });
        message.reply(`✅ تم حفظ **${name}** بالسعر **${price}**.`);
    }

    // أمر الشراء
    if (command === 'buy') {
        const targetName = args[0];
        const item = await db.get(`item_${targetName}`);
        if (!item) return message.reply("❌ هذا المنتج غير موجود.");

        message.reply(`💳 لشراء **${item.name}**، قم بتحويل **${item.price}** كريدت لـ <@${TARGET_ACCOUNT}>\nثم أرسل كلمة **"تم"** هنا.`);

        const filter = m => m.author.id === message.author.id && m.content.toLowerCase() === "تم";
        const collector = message.channel.createMessageCollector({ filter, time: 600000 });

        collector.on('collect', async () => {
            const messages = await message.channel.messages.fetch({ limit: 50 });
            
            // تم تعديل الشرط: البحث عن رسالة من البروبوت تحتوي على أيدي حسابك فقط
            const proBotConfirmation = messages.find(msg => 
                msg.author.id === PROBOT_ID && 
                msg.content.includes(TARGET_ACCOUNT)
            );

            if (!proBotConfirmation) {
                return message.reply("❌ لم أجد رسالة تحويل من البروبوت! تأكد من التحويل أولاً.");
            }

            message.channel.send(`✅ تم التأكيد! جاري تسليم الطلب...`);
            
            try {
                await message.author.send(`📦 طلبك لـ **${item.name}** هو:\n${item.link}`);
                message.channel.send(`✅ تم إرسال الرابط لك في الخاص يا ${message.author.username}!`);
            } catch (e) {
                message.channel.send("⚠️ الخاص عندك مغلق! افتحه لاستلام الرابط.");
            }
            collector.stop();
        });
    }
});

client.login(process.env.TOKEN);
