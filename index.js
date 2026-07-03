const { Client, GatewayIntentBits } = require('discord.js');
const { QuickDB } = require("quick.db");

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] 
});

const db = new QuickDB();
const PROBOT_ID = "282859044593598464"; 
const MY_ID = "1025694968137912322"; // أيدي حسابك لاستقبال الكريدت

client.on('ready', () => {
    console.log(`✅ البوت جاهز ومحمي يا باطو!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith("!")) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // أمر الإضافة
    if (command === 'additem') {
        if (message.author.id !== MY_ID) return;
        await db.set(`item_${args[0]}`, { name: args[0], price: args[1], link: args.slice(2).join(" ") });
        message.reply(`✅ تم حفظ ${args[0]}`);
    }

    // أمر الشراء
    if (command === 'buy') {
        const item = await db.get(`item_${args[0]}`);
        if (!item) return message.reply("❌ غير موجود.");
        
        const buyMsg = await message.reply(`💳 حول ${item.price} لـ <@${MY_ID}> ثم اكتب "تم"`);
        
        const filter = m => m.author.id === message.author.id && m.content.toLowerCase() === "تم";
        const collector = message.channel.createMessageCollector({ filter, time: 600000 });
        
        collector.on('collect', async () => {
            const msgs = await message.channel.messages.fetch({ limit: 20 });
            
            // هنا الأمان: البوت يبحث عن رسالة من البروبوت تحتوي على رقم حسابك (أيدي)
            const payment = msgs.find(m => 
                m.author.id === PROBOT_ID && 
                m.content.includes(MY_ID) && 
                m.createdTimestamp > buyMsg.createdTimestamp
            );
            
            if (!payment) {
                return message.reply("❌ لم أجد تحويلاً مؤكداً لك! تأكد من التحويل.");
            }
            
            try {
                await message.author.send(`📦 طلبك: ${item.link}`);
                message.reply("✅ تم التسليم في الخاص.");
            } catch { message.reply("⚠️ الخاص مغلق!"); }
            collector.stop();
        });
    }
});

client.login(process.env.TOKEN);
