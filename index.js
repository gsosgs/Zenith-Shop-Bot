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
const PROBOT_ID = "282859044593598464"; // أيدي البروبوت الثابت

client.on('ready', () => {
    console.log(`✅ البوت جاهز للبيع!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith("!")) return;
    
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // أمر الإضافة (فقط لك)
    if (command === 'additem') {
        if (message.author.id !== "1025694968137912322") return;
        // الاستخدام: !additem [الاسم] [السعر] [الرابط]
        await db.set(`item_${args[0]}`, { name: args[0], price: args[1], link: args.slice(2).join(" ") });
        message.reply(`✅ تم حفظ المنتج: ${args[0]}`);
    }

    // أمر الشراء
    if (command === 'buy') {
        const item = await db.get(`item_${args[0]}`);
        if (!item) return message.reply("❌ هذا المنتج غير موجود.");
        
        const buyMsg = await message.reply(`💳 لشراء **${item.name}**، قم بتحويل **${item.price}** كريدت لـ <@1025694968137912322>\nثم أرسل كلمة **"تم"** هنا.`);
        
        const filter = m => m.author.id === message.author.id && m.content.toLowerCase() === "تم";
        const collector = message.channel.createMessageCollector({ filter, time: 600000 });
        
        collector.on('collect', async () => {
            const msgs = await message.channel.messages.fetch({ limit: 50 });
            
            // تحقق بسيط: هل توجد رسالة من البروبوت أحدث من رسالة الشراء؟
            const foundPayment = msgs.find(m => m.author.id === PROBOT_ID && m.createdTimestamp > buyMsg.createdTimestamp);
            
            if (!foundPayment) return message.reply("❌ لم أجد رسالة تحويل! تأكد من التحويل أولاً.");
            
            try {
                await message.author.send(`📦 طلبك لـ **${item.name}** هو:\n${item.link}`);
                message.reply("✅ تم إرسال الرابط لك في الخاص!");
            } catch {
                message.reply("⚠️ الخاص مغلق! افتحه لاستلام الرابط.");
            }
            collector.stop();
        });
    }
});

client.login(process.env.TOKEN);
