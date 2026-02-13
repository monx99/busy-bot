const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// التوكن الجديد هنا
const token = "MTQ3MTYzOTI0MzM1MTY1NDQyMQ.G3Ahs2.yFwmcsv1e828oXwBeiXKrrr16kN2h12kS8ZVok";

const GUILD_ID = "950021591901822997";
const BUSY_CHANNEL_ID = "1162412320945885234";

// لتخزين الأشخاص اللي عليهم ميوت مؤقت
const mutedIntervals = new Map();

client.once('ready', () => {
  console.log(`بوت جاهز! Logged in as ${client.user.tag}`);
});

client.on('voiceStateUpdate', (oldState, newState) => {
  const memberId = newState.id;

  // إذا الشخص صار ميوت
  if ((newState.selfMute || newState.serverMute) && newState.channel?.id !== BUSY_CHANNEL_ID) {
    
    // منع إنشاء أكثر من interval لنفس الشخص
    if (mutedIntervals.has(memberId)) return;

    // إنشاء interval كل 3 دقائق (180000 مللي ثانية)
    const interval = setInterval(async () => {
      try {
        const currentState = newState.guild.members.cache.get(memberId).voice;
        if (currentState && (currentState.selfMute || currentState.serverMute) && currentState.channel?.id !== BUSY_CHANNEL_ID) {
          const busyChannel = newState.guild.channels.cache.get(BUSY_CHANNEL_ID);
          if (!busyChannel) return console.log("لم أتمكن من العثور على قناة busy.");

          await currentState.setChannel(busyChannel);
          console.log(`${newState.member.user.tag} تم نقله إلى قناة busy بسبب الميوت`);
        }
      } catch (error) {
        console.error("خطأ عند محاولة نقل الشخص:", error);
      }
    }, 3 * 60 * 1000); // 3 دقائق

    mutedIntervals.set(memberId, interval);

  } else {
    // إذا رفع الميوت، نلغي interval
    if (mutedIntervals.has(memberId)) {
      clearInterval(mutedIntervals.get(memberId));
      mutedIntervals.delete(memberId);
      console.log(`${newState.member.user.tag} رفع الميوت وتم إيقاف المراقبة`);
    }
  }
});

client.login(token);
