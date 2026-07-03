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

client.on('ready', () => {
    console.log(`✅ البوت شغال يا باطو!`);
});

client.on('messageCreate', async (message) => {
    // تجاهل البوتات
    if (message.author.bot) return;

    // رد مباشر للتجربة
    if (message.content === '!ping') {
        return message.reply('البوت شغال 100% يا باطو!');
    }

    // أمر إضافة: !add [اسم] [سعر]
    if (message.content.startsWith('!add ')) {
        const args = message.content.split(' ');
        if (message.author.id !== "1025694968137912322") return;
        await db.set(`item_${args[1]}`, { name: args[1], price: args[2] });
        return message.reply(`✅ تم حفظ ${args[1]}`);
    }

    // أمر الشراء: !buy [اسم]
    if (message.content.startsWith('!buy ')) {
        const args = message.content.split(' ');
        const item = await db.get(`item_${args[1]}`);
        if (!item) return message.reply("❌ غير موجود.");
        
        await message.reply(`💳 حول ${item.price} كريدت ثم أرسل "تم"`);
        
        const filter = m => m.author.id === message.author.id && m.content === "تم";
        const collector = message.channel.createMessageCollector({ filter, time: 60000 });
        
        collector.on('collect', () => {
            message.reply("✅ تم التأكيد! تم إرسال طلبك.");
            collector.stop();
        });
    }
});

client.login(process.env.TOKEN);
