const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const fs = require("fs");
const http = require("http");

// ═══════════════════════════════════════
// ♟️🃏 CONFIGURACIÓN DEL BOT 🃏♟️
// ═══════════════════════════════════════

const PREFIX = "b!";
const DATA_FILE = "./welcome-config.json";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ═══════════════════════════════════════
// 💾 BASE DE DATOS
// ═══════════════════════════════════════

let data = {};

if (fs.existsSync(DATA_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    data = {};
  }
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getGuildData(guildId) {
  if (!data[guildId]) {
    data[guildId] = {
      welcomeChannel: null
    };

    saveData();
  }

  return data[guildId];
}

// ═══════════════════════════════════════
// 👑 COMPROBAR ADMINISTRADOR
// ═══════════════════════════════════════

function isAdmin(message) {
  return message.member?.permissions.has(
    PermissionFlagsBits.Administrator
  );
}

// ═══════════════════════════════════════
// 💌 MENSAJE PRIVADO DE BIENVENIDA
// ═══════════════════════════════════════

function getFirstDMMessage(member) {
  return {
    content:
      `# Bienvenido/a a Redkings\n\n` +
      `> 🎉 **¡Bienvenido/a a Redkings!** 🃏\n` +
      `> Nos alegra mucho tenerte aquí. ✨\n\n` +
      `> 📌 Explora el servidor, conoce a la comunidad y disfruta de todas las funciones que tenemos preparadas para ti.\n` +
      `> 🤝 Respeta a los demás, sigue las reglas y, sobre todo, ¡diviértete!\n\n` +
      `> 💎 **¡Tu aventura en Redkings comienza ahora!**\n` +
      `> Esperamos verte formar parte de nuestra comunidad. 🖤\n\n` +
      `🔗 **Links de nuestra network:**\n` +
      `https://discord.gg/M8kCgt8JJ\n` +
      `https://discord.gg/DaUJ4a3eg\n` +
      `https://discord.gg/cGc9QQqPnX`
  };
}

// ═══════════════════════════════════════
// 🚀 BOT LISTO
// ═══════════════════════════════════════

client.once("ready", () => {
  console.log("════════════════════════════════════");
  console.log(`♟️🃏 Bot conectado como ${client.user.tag}`);
  console.log(`🌐 Servidores: ${client.guilds.cache.size}`);
  console.log(`⚡ Prefijo: ${PREFIX}`);
  console.log("════════════════════════════════════");

  client.user.setPresence({
    activities: [
      {
        name: "♟️ Ajedrez + 🃏 Póker",
        type: 0
      }
    ],
    status: "online"
  });
});

// ═══════════════════════════════════════
// 👋 NUEVO MIEMBRO
// ═══════════════════════════════════════

client.on("guildMemberAdd", async (member) => {
  const guildData = getGuildData(member.guild.id);

  // ─────────────────────────────────────
  // 📢 BIENVENIDA EN EL CANAL
  // ─────────────────────────────────────

  if (guildData.welcomeChannel) {
    const channel = member.guild.channels.cache.get(
      guildData.welcomeChannel
    );

    if (channel) {
      const welcomeEmbed = new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle("♟️🃏 ¡NUEVO JUGADOR EN LA MESA! 🃏♟️")
        .setDescription(
          `¡Bienvenido ${member}! 👋\n\n` +
          `Has entrado a **${member.guild.name}**.\n\n` +
          `♟️ Mueve tus piezas con estrategia.\n` +
          `🃏 Juega tus cartas con inteligencia.\n\n` +
          `¡Esperamos que disfrutes de la comunidad! 🎉`
        )
        .setThumbnail(member.user.displayAvatarURL())
        .setFooter({
          text: "♟️ Tu próximo movimiento puede cambiar la partida 🃏"
        })
        .setTimestamp();

      await channel.send({
        embeds: [welcomeEmbed]
      }).catch(() => {});
    }
  }

  // ─────────────────────────────────────
  // 💌 MD DE BIENVENIDA
  // ─────────────────────────────────────

  try {
    await member.send(getFirstDMMessage(member));
  } catch {
    console.log(
      `⚠️ No se pudo enviar el MD a ${member.user.tag}`
    );
  }
});

// ═══════════════════════════════════════
// 💬 COMANDOS
// ═══════════════════════════════════════

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content
    .slice(PREFIX.length)
    .trim()
    .split(/\s+/);

  const command = args.shift()?.toLowerCase();

  // ═══════════════════════════════════════
  // 👋 BIENVENIDA
  // ═══════════════════════════════════════

  if (command === "bienvenida") {

    // 🔐 SOLO ADMINISTRADORES
    if (!isAdmin(message)) {
      return message.reply({
        content: "🚫 Solo los administradores pueden usar este comando."
      });
    }

    // ─────────────────────────────────────
    // ❌ DESACTIVAR
    // ─────────────────────────────────────

    if (args[0]?.toLowerCase() === "off") {

      const guildData = getGuildData(message.guild.id);

      guildData.welcomeChannel = null;
      saveData();

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xe74c3c)
            .setTitle("♟️🃏 Bienvenidas desactivadas")
            .setDescription(
              "Las bienvenidas en el servidor han sido desactivadas."
            )
        ]
      });
    }

    // ─────────────────────────────────────
    // 📢 CONFIGURAR CANAL
    // ─────────────────────────────────────

    const channel = message.mentions.channels.first();

    if (!channel) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xe67e22)
            .setTitle("♟️🃏 Configurar bienvenidas")
            .setDescription(
              `Usa **${PREFIX}bienvenida #canal** para elegir dónde aparecerán.\n\n` +
              `Para desactivarlas usa **${PREFIX}bienvenida off**.`
            )
        ]
      });
    }

    const guildData = getGuildData(message.guild.id);

    guildData.welcomeChannel = channel.id;

    saveData();

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle("♟️🃏 ¡Canal configurado!")
          .setDescription(
            `Las nuevas bienvenidas aparecerán en ${channel}.\n\n` +
            `💌 Además, los nuevos miembros recibirán el mensaje por MD.`
          )
          .setFooter({
            text: "Configuración guardada automáticamente"
          })
      ]
    });
  }

  // ═══════════════════════════════════════
  // 📖 AYUDA
  // ═══════════════════════════════════════

  if (command === "help" || command === "ayuda") {

    if (!isAdmin(message)) {
      return message.reply({
        content: "🚫 Solo los administradores pueden usar los comandos del bot."
      });
    }

    const helpEmbed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle("♟️🃏 Comandos del bot")
      .setDescription(
        `**Prefijo:** ${PREFIX}\n\n` +
        `👑 **Administración**\n` +
        `**${PREFIX}bienvenida #canal**\n` +
        `**${PREFIX}bienvenida off**\n\n` +
        `💌 **Sistema automático**\n` +
        `Los nuevos miembros reciben automáticamente:\n` +
        `• Un mensaje de bienvenida en el canal configurado.\n` +
        `• Un mensaje de bienvenida por MD.`
      )
      .setFooter({
        text: "♟️🃏 Ajedrez + Póker"
      });

    return message.reply({
      embeds: [helpEmbed]
    });
  }

  // ═══════════════════════════════════════
  // 🏓 PING
  // ═══════════════════════════════════════

  if (command === "ping") {

    if (!isAdmin(message)) {
      return message.reply({
        content: "🚫 Solo los administradores pueden usar este comando."
      });
    }

    return message.reply({
      content: `🏓 Pong! **${client.ws.ping}ms**`
    });
  }

  // ═══════════════════════════════════════
  // ⚙️ CONFIGURACIÓN ACTUAL
  // ═══════════════════════════════════════

  if (command === "config") {

    if (!isAdmin(message)) {
      return message.reply({
        content: "🚫 Solo los administradores pueden usar este comando."
      });
    }

    const guildData = getGuildData(message.guild.id);

    const channel = guildData.welcomeChannel
      ? `<#${guildData.welcomeChannel}>`
      : "Desactivado";

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle("⚙️ Configuración")
          .addFields({
            name: "👋 Canal de bienvenida",
            value: channel
          })
          .setFooter({
            text: "♟️🃏 Panel de configuración"
          })
      ]
    });
  }
});

// ═══════════════════════════════════════
// 🌐 SERVIDOR PARA RENDER
// ═══════════════════════════════════════

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain"
  });

  res.end("♟️🃏 Fusake online");
}).listen(PORT, () => {
  console.log(`🌐 Servidor web activo en el puerto ${PORT}`);
});

// ═══════════════════════════════════════
// 🔐 INICIAR BOT
// ═══════════════════════════════════════

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.error("❌ Falta la variable DISCORD_TOKEN.");
  process.exit(1);
}

client.login(TOKEN);
