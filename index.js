const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

const PREFIX = "!";
const OWNER_ID = "ضع_الايدي_الخاص_بإدارتك_هنا"; // الايدي الخاص بك لإدارة إضافة المنتجات
const TARGET_ACCOUNT = "1025694968137912322"; // حسابك الذي يستلم التحويلات
const PROBOT_ID = "282859044593598464"; // ايدي بوت البروبوت الرسمي

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // أمر إضافة منتج (للإدارة فقط): !additem [الاسم] [السعر] [المنتج_الذي_سيتم_تسليمه]
    if (command === 'additem' && message.author.id === OWNER_ID) {
        const name = args[0];
        const price = parseInt(args[1]);
        const itemContent = args.slice(2).join(" "); // الشيء الذي يستلمه المشتري (رابط، كود، رتبة إلخ)

        if (!name || !price || !itemContent) {
            return message.reply("❌ الاستخدام الصحيح: `!additem [الاسم] [السعر] [المحتوى]`");
        }

        await db.set(`item_${name}`, { name, price, content: itemContent });
        message.reply(`✅ تم إضافة **${name}** للمتجر بسعر **${price}** كريدت.`);
    }

    // أمر عرض المتجر: !shop
    if (command === 'shop') {
        const allItems = await db.all();
        const items = allItems.filter(i => i.id.startsWith("item_"));
        
        if (items.length === 0) {
            return message.reply("🛒 المتجر فارغ حالياً.");
        }

        const embed = new EmbedBuilder()
            .setTitle("🛒 متجر Zenith Shop")
            .setDescription("لشراء أي منتج اكتب: `!buy [اسم_المنتج]`")
            .setColor(0x0099FF)
            .setFooter({ text: "Zenith Shop - جميع الحقوق محفوظة" });

        items.forEach(i => {
            embed.addFields({ name: i.value.name, value: `السعر: ${i.value.price} كريدت`, inline: true });
        });

        message.channel.send({ embeds: [embed] });
    }

    // أمر الشراء: !buy [اسم_المنتج]
    if (command === 'buy') {
        const itemName = args[0];
        if (!itemName) return message.reply("❌ يرجى تحديد اسم المنتج. مثال: `!buy nitro`");

        const item = await db.get(`item_${itemName}`);
        if (!item) return message.reply("❌ هذا المنتج غير موجود في المتجر.");

        // حساب السعر النهائي مع ضريبة البروبوت (اختياري، هنا وضعنا السعر الصافي)
        const price = item.price; 

        const buyEmbed = new EmbedBuilder()
            .setTitle("بدء عملية الشراء 💳")
            .setDescription(`أنت تقوم الآن بشراء **${item.name}**\n\nللإتمام، يرجى نسخ الأمر أدناه وتحويل المبلغ خلال **3 دقائق**:\n\`\`\`c ${TARGET_ACCOUNT} ${price}\`\`\``)
            .setColor(0xFFFF00)
            .setFooter({ text: "Zenith Shop - بانتظار التحويل..." });

        await message.reply({ embeds: [buyEmbed] });

        // إنشاء جامع رسائل (Collector) لانتظار رسالة البروبوت في نفس الروم
        const filter = m => m.author.id === PROBOT_ID && m.content.includes(TARGET_ACCOUNT) && m.content.includes(message.author.id) && m.content.includes(price.toString());
        
        const collector = message.channel.createMessageCollector({ filter, time: 180000, max: 1 }); // 3 دقائق كحد أقصى

        collector.on('collect', async (m) => {
            // إذا تحققت الرسالة وتأكدنا من التحويل
            const successEmbed = new EmbedBuilder()
                .setTitle("✅ تم استلام المبلغ بنجاح!")
                .setDescription(`شكراً لتعاملك مع **Zenith Shop**.\nتم إرسال منتجك في الخاص بنجاح.`)
                .setColor(0x00FF00)
                .setFooter({ text: "Zenith Shop - تم البيع" });

            await message.channel.send({ content: `${message.author}`, embeds: [successEmbed] });

            // إرسال المنتج للشخص في الخاص (DM)
            try {
                await message.author.send(`📦 **إليك منتجك من Zenith Shop:**\n ${item.content}`);
            } catch (err) {
                message.channel.send(`⚠️ الخاص عندك مغلق! الرجاء فتحه لكي أستطيع إرسال المنتج لك.`);
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time' && collected.size === 0) {
                message.channel.send(`${message.author} ❌ انتهى وقت التحويل (3 دقائق). تم إلغاء العملية.`);
            }
        });
    }
});

client.login(process.env.TOKEN || 'ضع_التوكن_هنا_إذا_لم_تستخدم_Secrets');
