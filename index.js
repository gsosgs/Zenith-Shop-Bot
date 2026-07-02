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
    console.log(`✅ البوت يعمل بكامل طاقته: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 1. إضافة منتج (رابط)
    if (command === 'additem') {
        if (message.author.id !== OWNER_ID) return;
        const name = args[0], price = parseInt(args[1]), link = args.slice(2).join(" ");
        if (!name || isNaN(price) || !link) return message.reply("❌ الاستخدام: `!additem [الاسم] [السعر] [الرابط]`");
        await db.set(`item_${name}`, { name, price, link });
        message.reply(`✅ تم تحديث **${name}**، السعر: **${price}**.`);
    }

    // 2. إضافة رتبة
    if (command === 'addrole') {
        if (message.author.id !== OWNER_ID) return;
        const name = args[0], price = parseInt(args[1]), roleId = args[2];
        if (!name || isNaN(price) || !roleId) return message.reply("❌ الاستخدام: `!addrole [الاسم] [السعر] [ايدي_الرتبة]`");
        await db.set(`role_${name}`, { name, price, roleId });
        message.reply(`✅ تم تحديث الرتبة **${name}**، السعر: **${price}**.`);
    }

    // 3. أمر الشراء (للروابط أو الرتب)
    if (command === 'buy') {
        const targetName = args[0];
        const item = await db.get(`item_${targetName}`) || await db.get(`role_${targetName}`);
        if (!item) return message.reply("❌ هذا المنتج غير موجود.");

        message.reply(`💳 لشراء **${item.name}**، قم بتحويل **${item.price}** كريدت لـ <@${TARGET_ACCOUNT}>\nثم أرسل كلمة **"تم"** هنا.`);

        const filter = m => m.author.id === message.author.id && m.content.toLowerCase() === "تم";
        const collector = message.channel.createMessageCollector({ filter, time: 600000 });

        collector.on('collect', async () => {
            const messages = await message.channel.messages.fetch({ limit: 50 });
            const proBotConfirmation = messages.find(msg => 
                msg.author.id === PROBOT_ID && msg.content.includes(TARGET_ACCOUNT) && msg.content.includes(message.author.id)
            );

            if (!proBotConfirmation) return message.reply("❌ لم أجد رسالة تحويل من البروبوت! تأكد من التحويل.");

            message.channel.send(`✅ تم التأكد! جاري التسليم...`);
            
            if (item.roleId) {
                const role = message.guild.roles.cache.get(item.roleId);
                if (role) await message.member.roles.add(role);
                message.author.send(`🎉 مبروك، حصلت على الرتبة: **${item.name}**`).catch(() => {});
            } else {
                message.author.send(`📦 طلبك لـ **${item.name}** هو:\n${item.link}`).catch(() => {
                    message.channel.send("⚠️ الخاص عندك مغلق! افتحه لاستلام الرابط.");
                });
            }
            collector.stop();
        });
    }
});

client.login(process.env.TOKEN);
