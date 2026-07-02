const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
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
const OWNER_ID = "ضع_الأيدي_الخاص_بك_هنا"; // <--- ضع الأيدي الخاص بك هنا
const TARGET_ACCOUNT = "1025694968137912322"; 
const PROBOT_ID = "282859044593598464";

client.on('ready', () => {
    console.log(`✅ البوت يعمل باسم: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // أمر الإضافة: !additem [الاسم] [السعر] [المحتوى]
    if (command === 'additem') {
        if (message.author.id !== OWNER_ID) return message.reply("❌ أنت لست المالك!");
        
        const name = args[0];
        const price = args[1];
        const itemContent = args.slice(2).join(" ");

        if (!name || !price || !itemContent) return message.reply("❌ الاستخدام: `!additem [الاسم] [السعر] [الرابط/المحتوى]`");

        await db.set(`item_${name}`, { name, price, content: itemContent });
        message.reply(`✅ تم إضافة **${name}** للمتجر بنجاح.`);
    }

    // أمر المتجر
    if (command === 'shop') {
        const allItems = await db.all();
        const items = allItems.filter(i => i.id.startsWith("item_"));
        
        if (items.length === 0) return message.reply("🛒 المتجر فارغ حالياً.");

        const embed = new EmbedBuilder()
            .setTitle("🛒 متجر Zenith Shop")
            .setDescription(items.map(i => `**${i.value.name}** - السعر: ${i.value.price} كريدت`).join("\n"))
            .setColor(0x0099FF);

        message.channel.send({ embeds: [embed] });
    }

    // أمر الشراء: !buy [اسم_المنتج]
    if (command === 'buy') {
        const itemName = args[0];
        const item = await db.get(`item_${itemName}`);
        if (!item) return message.reply("❌ هذا المنتج غير موجود.");

        const embed = new EmbedBuilder()
            .setTitle("💳 عملية شراء جديدة")
            .setDescription(`لشراء **${item.name}**، قم بتحويل **${item.price}** كريدت للحساب:\n\`${TARGET_ACCOUNT}\`\n\nأمامك 3 دقائق.`);
        
        message.reply({ embeds: [embed] });

        const filter = m => m.author.id === PROBOT_ID && m.content.includes(TARGET_ACCOUNT) && m.content.includes(message.author.id) && m.content.includes(item.price);
        const collector = message.channel.createMessageCollector({ filter, time: 180000, max: 1 });

        collector.on('collect', async (m) => {
            message.channel.send(`✅ تم التأكد من التحويل! تم إرسال المنتج لـ ${message.author} في الخاص.`);
            try {
                await message.author.send(`📦 منتجك هو: ${item.content}`);
            } catch (e) {
                message.channel.send("⚠️ الخاص عندك مغلق، افتحه لاستلام المنتج!");
            }
        });
    }
});

client.login(process.env.TOKEN);
