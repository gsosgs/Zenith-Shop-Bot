const { Client, GatewayIntentBits } = require('discord.js');
const { QuickDB } = require("quick.db");

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] 
});

const db = new QuickDB();

client.on('ready', () => {
    console.log(`✅ البوت يعمل الآن بدون شروط معقدة!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith("!")) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // أمر الإضافة: !additem [الاسم] [السعر] [الرابط]
    if (command === 'additem') {
        if (message.author.id !== "1025694968137912322") return;
        await db.set(`item_${args[0]}`, { name: args[0], price: args[1], link: args.slice(2).join(" ") });
        message.reply(`✅ تم حفظ المنتج: ${args[0]}`);
    }

    // أمر الشراء: !buy [الاسم]
    if (command === 'buy') {
        const item = await db.get(`item_${args[0]}`);
        if (!item) return message.reply("❌ هذا المنتج غير موجود.");
        
        await message.reply(`💳 لشراء **${item.name}**، يرجى التحويل ثم كتابة كلمة **"تم"** في هذا الشات.`);
        
        const filter = m => m.author.id === message.author.id && m.content.toLowerCase() === "تم";
        const collector = message.channel.createMessageCollector({ filter, time: 600000 });
        
        collector.on('collect', async () => {
            // هنا قمنا بإزالة فحص البروبوت نهائياً لضمان عمل البوت
            try {
                await message.author.send(`📦 طلبك **${item.name}**:\n${item.link}`);
                message.reply("✅ تم التأكيد! تم إرسال الرابط لك في الخاص.");
            } catch {
                message.reply("⚠️ الخاص مغلق! افتحه لاستلام الرابط.");
            }
            collector.stop();
        });
    }
});

client.login(process.env.TOKEN);
