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
// 💌 MENSAJES PRIVADOS
// ═══════════════════════════════════════

// 📝 PRIMER MENSAJE POR MD
// Puedes modificar este mensaje cuando quieras.

function getFirstDMMessage(member) {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle("♟️🃏 ¡Bienvenido!")
        .setDescription(
          `¡Hola **${member.user.username}**! 👋\n\n` +
          `Has entrado a nuestra comunidad de **Ajedrez ♟️ + Póker 🃏**.\n\n` +
          `Prepárate para partidas, estrategia y mucha diversión.`
        )
        .setFooter({
          text: "♟️ Cada movimiento cuenta • 🃏 Cada carta importa"
        })
    ]
  };
}

// 📝 SEGUNDO MENSAJE POR MD
// ╔══════════════════════════════════════╗
// ║ ✏️ MODIFICA ESTE MENSAJE COMO QUIERAS ║
// ╚══════════════════════════════════════╝

function getSecondDMMessage(member) {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle("📝 Mensaje personalizado")
        .setDescription(
          `¡Hola ${member}! 👋\n\n` +
          `AQUÍ PUEDES PONER TU PROPIO MENSAJE.\n\n` +
          `Puedes cambiar todo este texto desde index.js. ♟️🃏`
        )
        .setFooter({
          text: "♟️🃏 Tu mensaje personalizado"
        })
    ]
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
  // 💌 PRIMER MD
  // ─────────────────────────────────────

  try {
    await member.send(getFirstDMMessage(member));
  } catch {
    console.log(
      `⚠️ No se pudo enviar el primer MD a ${member.user.tag}`
    );
  }

  // ─────────────────────────────────────
  // 💌 SEGUNDO MD
  // ─────────────────────────────────────

  try {
    await member.send(getSecondDMMessage(member));
  } catch {
    console.log(
      `⚠️ No se pudo enviar el segundo MD a ${member.user.tag}`
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
            `💌 Además, los nuevos miembros recibirán los dos mensajes por MD.`
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
        `• Un primer mensaje por MD.\n` +
        `• Un segundo mensaje personalizado por MD.`
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

  res.end("♟️🃏 Bot online");
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
