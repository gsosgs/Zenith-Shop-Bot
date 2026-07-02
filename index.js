const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ] 
});

const db = new QuickDB();
const PREFIX = "!";
const OWNER_ID = "1025694968137912322"; 
const TARGET_ACCOUNT = "1025694968137912322"; 

client.on('ready', () => {
    console.log(`✅ البوت يعمل بكامل طاقته: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // أمر الإضافة
    if (command === 'additem') {
        if (message.author.id !== OWNER_ID) return message.reply("❌ أنت لست المالك!");
        const name = args[0];
        const price = args[1];
        const content = args.slice(2).join(" ");
        if (!name || !price || !content) return message.reply("❌ استخدم: `!additem [الاسم] [السعر] [المحتوى]`");
        await db.set(`item_${name}`, { name, price, content });
        message.reply(`✅ تم إضافة **${name}** للمتجر.`);
    }

    // أمر المتجر
    if (command === 'shop') {
        const allItems = await db.all();
        const items = allItems.filter(i => i.id.startsWith("item_"));
        if (items.length === 0) return message.reply("🛒 المتجر فارغ.");
        const embed = new EmbedBuilder()
            .setTitle("🛒 متجر Zenith Shop")
            .setDescription(items.map(i => `**${i.value.name}** - السعر: ${i.value.price} كريدت`).join("\n"))
            .setColor(0x0099FF);
        message.channel.send({ embeds: [embed] });
    }

    // أمر الشراء - التوصيل التلقائي الخاص
    if (command === 'buy') {
        const itemName = args[0];
        const item = await db.get(`item_${itemName}`);
        if (!item) return message.reply("❌ المنتج غير موجود.");

        const msg = await message.reply(`💳 لشراء **${item.name}**، قم بتحويل **${item.price}** كريدت لـ ${TARGET_ACCOUNT}\nثم أرسل كلمة **"تم"** هنا وسأرسل لك الطلب في الخاص فوراً.`);
        
        const filter = m => m.author.id === message.author.id && m.content.toLowerCase() === "تم";
        const collector = message.channel.createMessageCollector({ filter, time: 600000 }); 

        collector.on('collect', async (m) => {
            message.channel.send(`✅ تم التأكيد! جاري إرسال المنتج لـ ${message.author} في الخاص 📦.`);
            try {
                await message.author.send(`📦 طلبك لـ **${item.name}** هو:\n${item.content}`);
            } catch (e) {
                message.channel.send("⚠️ يا بطل، الخاص عندك مغلق! افتحه لأستطيع إرسال المنتج.");
            }
            collector.stop();
        });
    }
});

client.login(process.env.TOKEN);
