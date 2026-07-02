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
const OWNER_ID = "ضع_الايدي_الخاص_بك_هنا"; // <--- ضع الأيدي الخاص بك هنا بدقة
const TARGET_ACCOUNT = "1025694968137912322"; 
const PROBOT_ID = "282859044593598464";

client.on('ready', () => {
    console.log(`✅ البوت يعمل باسم: ${client.user.tag}`);
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
            .setDescription(items.map(i => `**
