const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType
} = require("discord.js");

const fs = require("fs");
const http = require("http");

// ═══════════════════════════════════════
// ♟️🃏 CONFIGURACIÓN
// ═══════════════════════════════════════

const PREFIX = "b!";
const DATA_FILE = "./welcome-config.json";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences
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
      welcomeChannel: null,
      autoRole: null,
      logsChannel: null,
      autoReplies: {},
      autoReactions: {},
      warnings: {},
      maintenance: false
    };

    saveData();
  }

  return data[guildId];
}

// ═══════════════════════════════════════
// 👑 SOLO ADMINISTRADORES
// ═══════════════════════════════════════

function isAdmin(message) {
  return Boolean(
    message.member?.permissions.has(PermissionFlagsBits.Administrator)
  );
}

function adminOnly(message) {
  if (!isAdmin(message)) {
    message.reply({
      content: "🚫 Solo los administradores pueden usar los comandos del bot."
    }).catch(() => {});
    return false;
  }

  return true;
}

function getUserFromMention(message) {
  return message.mentions.members.first();
}

function getRoleFromMention(message) {
  return message.mentions.roles.first();
}

function getChannelFromMention(message) {
  return message.mentions.channels.first();
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return `${days}d ${hours}h ${minutes}m`;
}

// ═══════════════════════════════════════
// 💌 MD DE BIENVENIDA
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
// 📝 LOGS
// ═══════════════════════════════════════

async function sendLog(guild, title, description) {
  const guildData = getGuildData(guild.id);

  if (!guildData.logsChannel) return;

  const channel = guild.channels.cache.get(guildData.logsChannel);

  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();

  await channel.send({
    embeds: [embed]
  }).catch(() => {});
}

// ═══════════════════════════════════════
// 🚀 BOT LISTO
// ═══════════════════════════════════════

client.once("ready", () => {
  console.log("════════════════════════════════════");
  console.log(`♟️🃏 Fusake conectado como ${client.user.tag}`);
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

  // 📢 Bienvenida en canal
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

  // 🎭 Auto rol
  if (guildData.autoRole) {
    const role = member.guild.roles.cache.get(guildData.autoRole);

    if (role && role.editable) {
      await member.roles.add(role).catch(() => {});
    }
  }

  // 💌 MD EXACTO
  try {
    await member.send(getFirstDMMessage(member));
  } catch {
    console.log(
      `⚠️ No se pudo enviar el MD a ${member.user.tag}`
    );
  }
});

// ═══════════════════════════════════════
// 💬 MENSAJES
// ═══════════════════════════════════════

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const guildData = getGuildData(message.guild.id);

  // 🤖 RESPUESTAS AUTOMÁTICAS
  const lower = message.content.toLowerCase();

  if (guildData.autoReplies?.[lower]) {
    await message.channel.send({
      content: guildData.autoReplies[lower],
      allowedMentions: { parse: [] }
    }).catch(() => {});
  }

  // 👍 REACCIONES AUTOMÁTICAS
  if (guildData.autoReactions?.[lower]) {
    await message.react(guildData.autoReactions[lower]).catch(() => {});
  }

  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content
    .slice(PREFIX.length)
    .trim()
    .split(/\s+/);

  const command = args.shift()?.toLowerCase();

  if (!command) return;

  // 🔐 TODOS LOS COMANDOS SON SOLO ADMIN
  if (!adminOnly(message)) return;

  // ═══════════════════════════════════════
  // 👋 BIENVENIDA
  // ═══════════════════════════════════════

  if (command === "bienvenida") {
    if (args[0]?.toLowerCase() === "off") {
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

    const channel = getChannelFromMention(message);

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
      ]
    });
  }

  // ═══════════════════════════════════════
  // 📖 HELP
  // ═══════════════════════════════════════

  if (command === "help" || command === "ayuda") {
    const menu = new StringSelectMenuBuilder()
      .setCustomId("fusake_help")
      .setPlaceholder("Selecciona una categoría")
      .addOptions([
        {
          label: "Moderación",
          description: "Comandos para moderar el servidor",
          value: "moderacion",
          emoji: "🛡️"
        },
        {
          label: "Configuración",
          description: "Configura los sistemas del bot",
          value: "configuracion",
          emoji: "⚙️"
        },
        {
          label: "Servidor",
          description: "Información y administración del servidor",
          value: "servidor",
          emoji: "🏠"
        },
        {
          label: "Herramientas de Staff",
          description: "Herramientas útiles para el staff",
          value: "staff",
          emoji: "🧰"
        },
        {
          label: "Bot",
          description: "Información y herramientas del bot",
          value: "bot",
          emoji: "🤖"
        }
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle("♟️🃏 Panel de Fusake")
      .setDescription(
        `**Prefijo:** ${PREFIX}\n\n` +
        `👑 **Acceso exclusivo para administradores**\n\n` +
        `Selecciona una categoría para ver sus comandos.`
      )
      .setFooter({
        text: "♟️🃏 Ajedrez + Póker"
      });

    return message.reply({
      embeds: [embed],
      components: [row]
    });
  }

  // ═══════════════════════════════════════
  // 🛡️ MODERACIÓN
  // ═══════════════════════════════════════

  if (command === "ban") {
    const member = getUserFromMention(message);

    if (!member) {
      return message.reply("❌ Usa **b!ban @usuario [razón]**");
    }

    if (!member.bannable) {
      return message.reply("❌ No puedo expulsar a este usuario.");
    }

    const reason = args.slice(1).join(" ") || "Sin razón especificada";

    await member.ban({ reason }).catch(() => {});

    await message.reply(
      `🔨 **Usuario baneado:** ${member.user.tag}\n📝 **Razón:** ${reason}`
    );

    return sendLog(
      message.guild,
      "🔨 Usuario baneado",
      `**Usuario:** ${member.user.tag}\n**Por:** ${message.author.tag}\n**Razón:** ${reason}`
    );
  }

  if (command === "unban") {
    const id = args[0];

    if (!id) {
      return message.reply("❌ Usa **b!unban ID**");
    }

    try {
      const user = await client.users.fetch(id);
      await message.guild.members.unban(id);

      return message.reply(
        `✅ **${user.tag}** ha sido desbaneado.`
      );
    } catch {
      return message.reply(
        "❌ No se pudo desbanear a ese usuario."
      );
    }
  }

  if (command === "kick") {
    const member = getUserFromMention(message);

    if (!member) {
      return message.reply("❌ Usa **b!kick @usuario [razón]**");
    }

    if (!member.kickable) {
      return message.reply("❌ No puedo expulsar a este usuario.");
    }

    const reason = args.slice(1).join(" ") || "Sin razón especificada";

    await member.kick(reason).catch(() => {});

    return message.reply(
      `👢 **Usuario expulsado:** ${member.user.tag}\n📝 **Razón:** ${reason}`
    );
  }

  if (command === "timeout") {
    const member = getUserFromMention(message);
    const minutes = Number(args[1]);

    if (!member || !minutes || minutes <= 0) {
      return message.reply(
        "❌ Usa **b!timeout @usuario minutos**"
      );
    }

    if (minutes > 40320) {
      return message.reply(
        "❌ El máximo permitido es de 28 días."
      );
    }

    await member.timeout(
      minutes * 60 * 1000,
      "Timeout aplicado por un administrador"
    ).catch(() => {});

    return message.reply(
      `⏳ **${member.user.tag}** ha recibido un timeout de **${minutes} minutos**.`
    );
  }

  if (command === "untimeout") {
    const member = getUserFromMention(message);

    if (!member) {
      return message.reply("❌ Usa **b!untimeout @usuario**");
    }

    await member.timeout(null).catch(() => {});

    return message.reply(
      `✅ Timeout retirado a **${member.user.tag}**.`
    );
  }

  if (command === "warn") {
    const member = getUserFromMention(message);

    if (!member) {
      return message.reply("❌ Usa **b!warn @usuario [razón]**");
    }

    const reason = args.slice(1).join(" ") || "Sin razón especificada";

    if (!guildData.warnings[member.id]) {
      guildData.warnings[member.id] = [];
    }

    guildData.warnings[member.id].push({
      reason,
      moderator: message.author.tag,
      date: new Date().toISOString()
    });

    saveData();

    return message.reply(
      `⚠️ **${member.user.tag}** recibió una advertencia.\n📝 **Razón:** ${reason}`
    );
  }

  if (command === "warnings") {
    const member = getUserFromMention(message);

    if (!member) {
      return message.reply("❌ Usa **b!warnings @usuario**");
    }

    const warnings = guildData.warnings[member.id] || [];

    if (!warnings.length) {
      return message.reply(
        `✅ **${member.user.tag}** no tiene advertencias.`
      );
    }

    const text = warnings
      .map(
        (w, i) =>
          `**${i + 1}.** ${w.reason} — ${w.moderator}`
      )
      .join("\n");

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf1c40f)
          .setTitle(`⚠️ Advertencias de ${member.user.tag}`)
          .setDescription(text)
      ]
    });
  }

  if (command === "clearwarnings") {
    const member = getUserFromMention(message);

    if (!member) {
      return message.reply("❌ Usa **b!clearwarnings @usuario**");
    }

    delete guildData.warnings[member.id];
    saveData();

    return message.reply(
      `🧹 Advertencias eliminadas de **${member.user.tag}**.`
    );
  }

  if (command === "purge" || command === "clear") {
    const amount = Number(args[0]);

    if (!amount || amount < 1 || amount > 100) {
      return message.reply(
        "❌ Usa una cantidad entre **1 y 100**."
      );
    }

    const deleted = await message.channel.bulkDelete(
      amount,
      true
    ).catch(() => null);

    if (!deleted) {
      return message.reply(
        "❌ No pude eliminar los mensajes."
      );
    }

    const msg = await message.channel.send(
      `🧹 Se eliminaron **${deleted.size} mensajes**.`
    );

    setTimeout(() => {
      msg.delete().catch(() => {});
    }, 3000);

    return;
  }

  if (command === "slowmode") {
    const seconds = Number(args[0]);

    if (Number.isNaN(seconds) || seconds < 0 || seconds > 21600) {
      return message.reply(
        "❌ Usa un valor entre **0 y 21600 segundos**."
      );
    }

    await message.channel.setRateLimitPerUser(seconds);

    return message.reply(
      `🐌 Slowmode establecido en **${seconds} segundos**.`
    );
  }

  if (command === "lock") {
    await message.channel.permissionOverwrites.edit(
      message.guild.roles.everyone,
      { SendMessages: false }
    );

    return message.reply("🔒 Canal bloqueado.");
  }

  if (command === "unlock") {
    await message.channel.permissionOverwrites.edit(
      message.guild.roles.everyone,
      { SendMessages: null }
    );

    return message.reply("🔓 Canal desbloqueado.");
  }

  if (command === "lockall") {
    let count = 0;

    for (const channel of message.guild.channels.cache.values()) {
      if (
        channel.type === ChannelType.GuildText ||
        channel.type === ChannelType.GuildAnnouncement
      ) {
        await channel.permissionOverwrites.edit(
          message.guild.roles.everyone,
          { SendMessages: false }
        ).catch(() => {});

        count++;
      }
    }

    return message.reply(
      `🔒 Se bloquearon **${count} canales**.`
    );
  }

  if (command === "unlockall") {
    let count = 0;

    for (const channel of message.guild.channels.cache.values()) {
      if (
        channel.type === ChannelType.GuildText ||
        channel.type === ChannelType.GuildAnnouncement
      ) {
        await channel.permissionOverwrites.edit(
          message.guild.roles.everyone,
          { SendMessages: null }
        ).catch(() => {});

        count++;
      }
    }

    return message.reply(
      `🔓 Se desbloquearon **${count} canales**.`
    );
  }

  if (command === "nick") {
    const member = getUserFromMention(message);
    const nickname = args.slice(1).join(" ");

    if (!member || !nickname) {
      return message.reply(
        "❌ Usa **b!nick @usuario nuevo nombre**"
      );
    }

    await member.setNickname(nickname).catch(() => {});

    return message.reply(
      `✏️ Nuevo nombre de **${member.user.tag}**: **${nickname}**`
    );
  }

  // ═══════════════════════════════════════
  // ⚙️ CONFIGURACIÓN
  // ═══════════════════════════════════════

  if (command === "autoroles") {
    if (args[0]?.toLowerCase() === "off") {
      guildData.autoRole = null;
      saveData();

      return message.reply("🎭 Auto rol desactivado.");
    }

    const role = getRoleFromMention(message);

    if (!role) {
      return message.reply(
        "❌ Usa **b!autoroles @rol** o **b!autoroles off**"
      );
    }

    guildData.autoRole = role.id;
    saveData();

    return message.reply(
      `🎭 Auto rol configurado: ${role}`
    );
  }

  if (command === "autorespuestas") {
    const trigger = args[0]?.toLowerCase();
    const response = args.slice(1).join(" ");

    if (!trigger || !response) {
      return message.reply(
        "❌ Usa **b!autorespuestas palabra respuesta**"
      );
    }

    guildData.autoReplies[trigger] = response;
    saveData();

    return message.reply(
      `🤖 Respuesta automática configurada para **${trigger}**.`
    );
  }

  if (command === "autoreacciones") {
    const trigger = args[0]?.toLowerCase();
    const emoji = args[1];

    if (!trigger || !emoji) {
      return message.reply(
        "❌ Usa **b!autoreacciones palabra emoji**"
      );
    }

    guildData.autoReactions[trigger] = emoji;
    saveData();

    return message.reply(
      `👍 Reacción automática configurada para **${trigger}**.`
    );
  }

  if (command === "logs") {
    if (args[0]?.toLowerCase() === "off") {
      guildData.logsChannel = null;
      saveData();

      return message.reply("📋 Logs desactivados.");
    }

    const channel = getChannelFromMention(message);

    if (!channel) {
      return message.reply(
        "❌ Usa **b!logs #canal** o **b!logs off**"
      );
    }

    guildData.logsChannel = channel.id;
    saveData();

    return message.reply(
      `📋 Canal de logs configurado: ${channel}`
    );
  }

  if (command === "setlog") {
    const channel = getChannelFromMention(message);

    if (!channel) {
      return message.reply(
        "❌ Usa **b!setlog #canal**"
      );
    }

    guildData.logsChannel = channel.id;
    saveData();

    return message.reply(
      `📋 Los registros se enviarán a ${channel}.`
    );
  }

  if (command === "maintenance") {
    guildData.maintenance = !guildData.maintenance;
    saveData();

    return message.reply(
      `🔧 Modo mantenimiento: **${guildData.maintenance ? "ACTIVADO" : "DESACTIVADO"}**`
    );
  }

  if (command === "config") {
    const welcome = guildData.welcomeChannel
      ? `<#${guildData.welcomeChannel}>`
      : "Desactivado";

    const autoRole = guildData.autoRole
      ? `<@&${guildData.autoRole}>`
      : "Desactivado";

    const logs = guildData.logsChannel
      ? `<#${guildData.logsChannel}>`
      : "Desactivados";

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle("⚙️ Configuración de Fusake")
          .addFields(
            {
              name: "👋 Bienvenida",
              value: welcome,
              inline: true
            },
            {
              name: "🎭 Auto rol",
              value: autoRole,
              inline: true
            },
            {
              name: "📋 Logs",
              value: logs,
              inline: true
            },
            {
              name: "🔧 Mantenimiento",
              value: guildData.maintenance
                ? "Activado"
                : "Desactivado",
              inline: true
            }
          )
      ]
    });
  }

  if (command === "resetconfig") {
    data[message.guild.id] = {
      welcomeChannel: null,
      autoRole: null,
      logsChannel: null,
      autoReplies: {},
      autoReactions: {},
      warnings: {},
      maintenance: false
    };

    saveData();

    return message.reply(
      "♻️ Configuración reiniciada."
    );
  }

  // ═══════════════════════════════════════
  // 🏠 SERVIDOR
  // ═══════════════════════════════════════

  if (command === "serverinfo") {
    const guild = message.guild;

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle(`🏠 ${guild.name}`)
          .setThumbnail(guild.iconURL())
          .addFields(
            {
              name: "👑 Dueño",
              value: `<@${guild.ownerId}>`,
              inline: true
            },
            {
              name: "👥 Miembros",
              value: `${guild.memberCount}`,
              inline: true
            },
            {
              name: "💬 Canales",
              value: `${guild.channels.cache.size}`,
              inline: true
            },
            {
              name: "🎭 Roles",
              value: `${guild.roles.cache.size}`,
              inline: true
            },
            {
              name: "😀 Emojis",
              value: `${guild.emojis.cache.size}`,
              inline: true
            },
            {
              name: "🚀 Boosts",
              value: `${guild.premiumSubscriptionCount || 0}`,
              inline: true
            }
          )
          .setTimestamp()
      ]
    });
  }

  if (command === "userinfo") {
    const member = getUserFromMention(message) || message.member;

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x9b59b6)
          .setTitle(`👤 ${member.user.tag}`)
          .setThumbnail(member.user.displayAvatarURL())
          .addFields(
            {
              name: "🆔 ID",
              value: member.id,
              inline: true
            },
            {
              name: "📅 Cuenta creada",
              value: `<t:${Math.floor(
                member.user.createdTimestamp / 1000
              )}:F>`,
              inline: true
            },
            {
              name: "📥 Entró al servidor",
              value: member.joinedTimestamp
                ? `<t:${Math.floor(
                    member.joinedTimestamp / 1000
                  )}:F>`
                : "Desconocido",
              inline: true
            },
            {
              name: "🎭 Roles",
              value:
                member.roles.cache
                  .filter(r => r.id !== message.guild.id)
                  .map(r => r.toString())
                  .join(", ") || "Ninguno"
            }
          )
      ]
    });
  }

  if (command === "roleinfo") {
    const role = getRoleFromMention(message);

    if (!role) {
      return message.reply(
        "❌ Usa **b!roleinfo @rol**"
      );
    }

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(role.color || 0x3498db)
          .setTitle(`🎭 ${role.name}`)
          .addFields(
            {
              name: "🆔 ID",
              value: role.id,
              inline: true
            },
            {
              name: "👥 Miembros",
              value: `${role.members.size}`,
              inline: true
            },
            {
              name: "📌 Posición",
              value: `${role.position}`,
              inline: true
            }
          )
      ]
    });
  }

  if (command === "channelinfo") {
    const channel = getChannelFromMention(message) || message.channel;

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle(`💬 ${channel.name}`)
          .addFields(
            {
              name: "🆔 ID",
              value: channel.id,
              inline: true
            },
            {
              name: "📂 Tipo",
              value: `${channel.type}`,
              inline: true
            }
          )
      ]
    });
  }

  if (command === "roles") {
    const roles = message.guild.roles.cache
      .filter(r => r.id !== message.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(r => r.toString())
      .join("\n");

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x9b59b6)
          .setTitle("🎭 Roles del servidor")
          .setDescription(
            roles || "No hay roles."
          )
      ]
    });
  }

  if (command === "members") {
    return message.reply(
      `👥 El servidor tiene **${message.guild.memberCount} miembros**.`
    );
  }

  if (command === "bots") {
    const bots = message.guild.members.cache.filter(
      member => member.user.bot
    ).size;

    return message.reply(
      `🤖 Hay **${bots} bots** en el servidor.`
    );
  }

  if (command === "emojis") {
    return message.reply(
      `😀 El servidor tiene **${message.guild.emojis.cache.size} emojis**.`
    );
  }

  if (command === "boosts") {
    return message.reply(
      `🚀 El servidor tiene **${message.guild.premiumSubscriptionCount || 0} boosts**.`
    );
  }

  if (command === "staff") {
    const admins = message.guild.members.cache.filter(
      member =>
        member.permissions.has(PermissionFlagsBits.Administrator)
    );

    const list = admins
      .map(member => `👑 ${member}`)
      .join("\n");

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf1c40f)
          .setTitle("👑 Staff")
          .setDescription(list || "No se encontraron administradores.")
      ]
    });
  }

  if (command === "permissions") {
    const member = getUserFromMention(message) || message.member;

    const permissions = member.permissions.toArray()
      .map(p => `• ${p}`)
      .join("\n");

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle(`🔐 Permisos de ${member.user.tag}`)
          .setDescription(
            permissions || "Sin permisos."
          )
      ]
    });
  }

  if (command === "avatar") {
    const member = getUserFromMention(message) || message.member;

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x9b59b6)
          .setTitle(`🖼️ Avatar de ${member.user.tag}`)
          .setImage(member.user.displayAvatarURL({ size: 1024 }))
      ]
    });
  }

  if (command === "servericon") {
    const icon = message.guild.iconURL({ size: 1024 });

    if (!icon) {
      return message.reply("❌ El servidor no tiene icono.");
    }

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle("🏠 Icono del servidor")
          .setImage(icon)
      ]
    });
  }

  if (command === "serverbanner") {
    const banner = message.guild.bannerURL({ size: 1024 });

    if (!banner) {
      return message.reply("❌ El servidor no tiene banner.");
    }

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle("🖼️ Banner del servidor")
          .setImage(banner)
      ]
    });
  }

  // ═══════════════════════════════════════
  // 🧰 HERRAMIENTAS STAFF
  // ═══════════════════════════════════════

  if (command === "say") {
    const text = args.join(" ");

    if (!text) {
      return message.reply("❌ Usa **b!say mensaje**");
    }

    await message.delete().catch(() => {});

    return message.channel.send({
      content: text,
      allowedMentions: { parse: [] }
    });
  }

  if (command === "announce") {
    const text = args.join(" ");

    if (!text) {
      return message.reply("❌ Usa **b!announce mensaje**");
    }

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf1c40f)
          .setTitle("📢 ANUNCIO")
          .setDescription(text)
          .setFooter({
            text: "♟️🃏 Fusake"
          })
          .setTimestamp()
      ]
    });
  }

  if (command === "embed") {
    const text = args.join(" ");

    if (!text) {
      return message.reply("❌ Usa **b!embed mensaje**");
    }

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x3498db)
          .setDescription(text)
      ]
    });
  }

  if (command === "poll") {
    const question = args.join(" ");

    if (!question) {
      return message.reply("❌ Usa **b!poll pregunta**");
    }

    const pollMessage = await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x9b59b6)
          .setTitle("📊 Encuesta")
          .setDescription(question)
          .setFooter({
            text: "👍 Sí • 👎 No"
          })
      ]
    });

    await pollMessage.react("👍").catch(() => {});
    await pollMessage.react("👎").catch(() => {});

    return;
  }

  if (command === "move") {
    const member = getUserFromMention(message);
    const channel = getChannelFromMention(message);

    if (!member || !channel) {
      return message.reply(
        "❌ Usa **b!move @usuario #canal-voz**"
      );
    }

    if (channel.type !== ChannelType.GuildVoice) {
      return message.reply(
        "❌ El canal mencionado debe ser un canal de voz."
      );
    }

    if (!member.voice.channel) {
      return message.reply(
        "❌ Ese usuario no está conectado a un canal de voz."
      );
    }

    await member.voice.setChannel(channel).catch(() => {});

    return message.reply(
      `🔊 **${member.user.tag}** fue movido a ${channel}.`
    );
  }

  if (command === "disconnect") {
    const member = getUserFromMention(message);

    if (!member) {
      return message.reply(
        "❌ Usa **b!disconnect @usuario**"
      );
    }

    if (!member.voice.channel) {
      return message.reply(
        "❌ Ese usuario no está en un canal de voz."
      );
    }

    await member.voice.disconnect().catch(() => {});

    return message.reply(
      `🔇 **${member.user.tag}** fue desconectado del canal de voz.`
    );
  }

  if (command === "role") {
    const action = args[0]?.toLowerCase();
    const member = getUserFromMention(message);
    const role = getRoleFromMention(message);

    if (!["add", "remove"].includes(action) || !member || !role) {
      return message.reply(
        "❌ Usa **b!role add @usuario @rol** o **b!role remove @usuario @rol**"
      );
    }

    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply(
        "❌ No puedo modificar ese rol porque está por encima de mi rol."
      );
    }

    if (action === "add") {
      await member.roles.add(role).catch(() => {});
      return message.reply(
        `🎭 Rol ${role} añadido a **${member.user.tag}**.`
      );
    }

    await member.roles.remove(role).catch(() => {});

    return message.reply(
      `🎭 Rol ${role} retirado de **${member.user.tag}**.`
    );
  }

  if (command === "addrole") {
    const member = getUserFromMention(message);
    const role = getRoleFromMention(message);

    if (!member || !role) {
      return message.reply(
        "❌ Usa **b!addrole @usuario @rol**"
      );
    }

    await member.roles.add(role).catch(() => {});

    return message.reply(
      `➕ Rol ${role} añadido a **${member.user.tag}**.`
    );
  }

  if (command === "removerole") {
    const member = getUserFromMention(message);
    const role = getRoleFromMention(message);

    if (!member || !role) {
      return message.reply(
        "❌ Usa **b!removerole @usuario @rol**"
      );
    }

    await member.roles.remove(role).catch(() => {});

    return message.reply(
      `➖ Rol ${role} retirado de **${member.user.tag}**.`
    );
  }

  if (command === "setstatus") {
    const status = args.join(" ");

    if (!status) {
      return message.reply(
        "❌ Usa **b!setstatus texto**"
      );
    }

    client.user.setPresence({
      activities: [
        {
          name: status,
          type: 0
        }
      ],
      status: "online"
    });

    return message.reply(
      `🤖 Estado cambiado a **${status}**.`
    );
  }

  if (command === "botinfo") {
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf1c40f)
          .setTitle("🤖 Información de Fusake")
          .setThumbnail(client.user.displayAvatarURL())
          .addFields(
            {
              name: "👑 Nombre",
              value: client.user.tag,
              inline: true
            },
            {
              name: "🌐 Servidores",
              value: `${client.guilds.cache.size}`,
              inline: true
            },
            {
              name: "📡 Ping",
              value: `${client.ws.ping}ms`,
              inline: true
            },
            {
              name: "⚡ Prefijo",
              value: PREFIX,
              inline: true
            },
            {
              name: "📦 Discord.js",
              value: "14.x",
              inline: true
            }
          )
      ]
    });
  }

  if (command === "uptime") {
    return message.reply(
      `⏱️ Fusake lleva encendido **${formatDuration(client.uptime)}**.`
    );
  }

  if (command === "ping") {
    return message.reply(
      `🏓 Pong! **${client.ws.ping}ms**`
    );
  }

  if (command === "membercount") {
    return message.reply(
      `👥 Miembros: **${message.guild.memberCount}**`
    );
  }

  if (command === "created") {
    return message.reply(
      `📅 El servidor fue creado <t:${Math.floor(
        message.guild.createdTimestamp / 1000
      )}:F>.`
    );
  }

  // ═══════════════════════════════════════
  // 🧹 LIMPIAR RESPUESTAS / REACCIONES
  // ═══════════════════════════════════════

  if (command === "delreply") {
    const trigger = args[0]?.toLowerCase();

    if (!trigger) {
      return message.reply(
        "❌ Usa **b!delreply palabra**"
      );
    }

    delete guildData.autoReplies[trigger];
    saveData();

    return message.reply(
      `🗑️ Respuesta automática **${trigger}** eliminada.`
    );
  }

  if (command === "delreaction") {
    const trigger = args[0]?.toLowerCase();

    if (!trigger) {
      return message.reply(
        "❌ Usa **b!delreaction palabra**"
      );
    }

    delete guildData.autoReactions[trigger];
    saveData();

    return message.reply(
      `🗑️ Reacción automática **${trigger}** eliminada.`
    );
  }

  // ═══════════════════════════════════════
  // ❓ COMANDO DESCONOCIDO
  // ═══════════════════════════════════════

  return message.reply(
    `❓ Comando desconocido. Usa **${PREFIX}help** para ver el menú.`
  );
});

// ═══════════════════════════════════════
// 📋 MENÚ INTERACTIVO
// ═══════════════════════════════════════

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId !== "fusake_help") return;

  if (
    !interaction.member?.permissions.has(
      PermissionFlagsBits.Administrator
    )
  ) {
    return interaction.reply({
      content: "🚫 Solo los administradores pueden usar este menú.",
      ephemeral: true
    });
  }

  const category = interaction.values[0];

  const commands = {
    moderacion: {
      title: "🛡️ Moderación",
      text:
        "**b!ban @usuario [razón]** — Banea a un usuario.\n" +
        "**b!unban ID** — Desbanea a un usuario.\n" +
        "**b!kick @usuario [razón]** — Expulsa a un usuario.\n" +
        "**b!timeout @usuario minutos** — Aplica timeout.\n" +
        "**b!untimeout @usuario** — Quita el timeout.\n" +
        "**b!warn @usuario [razón]** — Advierte a un usuario.\n" +
        "**b!warnings @usuario** — Mira sus advertencias.\n" +
        "**b!clearwarnings @usuario** — Borra advertencias.\n" +
        "**b!purge cantidad** — Elimina mensajes.\n" +
        "**b!clear cantidad** — Elimina mensajes.\n" +
        "**b!slowmode segundos** — Configura slowmode.\n" +
        "**b!lock** — Bloquea el canal.\n" +
        "**b!unlock** — Desbloquea el canal.\n" +
        "**b!lockall** — Bloquea los canales de texto.\n" +
        "**b!unlockall** — Desbloquea los canales de texto.\n" +
        "**b!nick @usuario nombre** — Cambia un apodo."
    },

    configuracion: {
      title: "⚙️ Configuración",
      text:
        "**b!bienvenida #canal** — Configura bienvenida.\n" +
        "**b!bienvenida off** — Desactiva bienvenida.\n" +
        "**b!autoroles @rol** — Configura auto rol.\n" +
        "**b!autorespuestas palabra respuesta** — Crea respuesta automática.\n" +
        "**b!autoreacciones palabra emoji** — Crea reacción automática.\n" +
        "**b!delreply palabra** — Elimina respuesta automática.\n" +
        "**b!delreaction palabra** — Elimina reacción automática.\n" +
        "**b!logs #canal** — Configura logs.\n" +
        "**b!setlog #canal** — Configura canal de logs.\n" +
        "**b!maintenance** — Activa/desactiva mantenimiento.\n" +
        "**b!config** — Muestra configuración.\n" +
        "**b!resetconfig** — Reinicia configuración."
    },

    servidor: {
      title: "🏠 Servidor",
      text:
        "**b!serverinfo** — Información del servidor.\n" +
        "**b!userinfo @usuario** — Información de usuario.\n" +
        "**b!roleinfo @rol** — Información de un rol.\n" +
        "**b!channelinfo #canal** — Información del canal.\n" +
        "**b!roles** — Lista los roles.\n" +
        "**b!members** — Cantidad de miembros.\n" +
        "**b!membercount** — Cuenta de miembros.\n" +
        "**b!bots** — Cantidad de bots.\n" +
        "**b!emojis** — Cantidad de emojis.\n" +
        "**b!boosts** — Cantidad de boosts.\n" +
        "**b!staff** — Lista administradores.\n" +
        "**b!permissions @usuario** — Mira permisos.\n" +
        "**b!avatar @usuario** — Muestra avatar.\n" +
        "**b!servericon** — Muestra icono.\n" +
        "**b!serverbanner** — Muestra banner.\n" +
        "**b!created** — Fecha de creación."
    },

    staff: {
      title: "🧰 Herramientas de Staff",
      text:
        "**b!say mensaje** — Envía un mensaje sin mostrar al autor.\n" +
        "**b!announce mensaje** — Crea un anuncio.\n" +
        "**b!embed mensaje** — Envía un embed.\n" +
        "**b!poll pregunta** — Crea una encuesta.\n" +
        "**b!move @usuario #voz** — Mueve a un usuario.\n" +
        "**b!disconnect @usuario** — Desconecta de voz.\n" +
        "**b!role add @usuario @rol** — Añade un rol.\n" +
        "**b!role remove @usuario @rol** — Quita un rol.\n" +
        "**b!addrole @usuario @rol** — Añade un rol.\n" +
        "**b!removerole @usuario @rol** — Quita un rol.\n" +
        "**b!setstatus texto** — Cambia el estado del bot."
    },

    bot: {
      title: "🤖 Bot",
      text:
        "**b!help** — Abre este menú.\n" +
        "**b!ayuda** — Abre este menú.\n" +
        "**b!ping** — Comprueba la latencia.\n" +
        "**b!uptime** — Muestra el tiempo encendido.\n" +
        "**b!botinfo** — Información de Fusake.\n" +
        "**b!config** — Configuración actual.\n\n" +
        "👑 **Todos estos comandos son exclusivos para administradores.**"
    }
  };

  const selected = commands[category];

  if (!selected) {
    return interaction.reply({
      content: "❌ Categoría no encontrada.",
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle(selected.title)
    .setDescription(selected.text)
    .setFooter({
      text: "👑 Solo administradores"
    });

  return interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
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
  console.log(
    `🌐 Servidor web activo en el puerto ${PORT}`
  );
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
