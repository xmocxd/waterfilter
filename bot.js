const fs = require('node:fs');
const path = require('node:path');
const eris = require('eris');

// A real environment variable beats the file, so systemd can supply the token
// on a host that has no .env.
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

if (!process.env.DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN is not set');
  process.exit(1);
}

// messageContent is privileged: without it Discord blanks msg.content and no
// command ever matches. Enable it on the bot's page in the developer portal.
const bot = new eris.Client(process.env.DISCORD_TOKEN, {
  intents: ['guilds', 'guildMessages', 'messageContent']
});

// configure actions
const actions = {
  'announce': {
    enabledChannels : '959300604545597480'
  },
  'command-hog': {
    enabledChannels : '*'
  },
  'command-show-channel-id': {
    enabledChannels : '*'
  }
};

// every text channel the bot can post in, as the gateway reports them
function channels() {
  const found = [];
  bot.guilds.forEach(guild => {
    guild.channels.forEach(channel => {
      if (channel.type !== 0) {
        return;
      }
      const perms = channel.permissionsOf(bot.user.id);
      if (perms.has('viewChannel') && perms.has('sendMessages')) {
        found.push(channel);
      }
    });
  });
  return found;
}

let announced = false;

bot.on('ready', async () => {
  console.log('my body is ready');

  const found = channels();
  console.log('in ' + found.length + ' channels:');
  found.forEach(channel => {
    console.log('  ' + channel.guild.name + ' #' + channel.name + ' (' + channel.id + ')');
  });

  // 'ready' fires again after every reconnect -- only announce if restarted on server
  if (announced) {
    return;
  }
  announced = true;

  for (const channel of found) {
    if (enabled('announce', channel.id)) {
      try {
        await channel.createMessage('my body is ready');
      } catch (err) {
        console.warn('announce failed in channel ' + channel.id);
        console.warn(err);
      }
    }
  }
});

function listed(list, channelID) {
  if (list === '*' || list.indexOf(channelID) !== -1) {
    return true;
  } else {
    return false;
  }
}

function enabled(action, channelID) {
  return listed(actions[action].enabledChannels, channelID);
}

function sendHog(msg) {
  const hog = `
░░░░░░░░░░░░░░░░░░░░░░░░████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░░░░░░░░░░██████░░██████░░░░░░░░░░░░██████░░░░██████░░░░░░░░░░░░░░░░░░░░
░░░░░░░░██░░░░████░░░░░░░░░░░░░░░░░░░░░░░░████░░░░░░████░░░░░░░░░░░░░░░░
░░░░░░██░░░░██▒▒▒▒░░░░░░░░░░░░░░░░░░░░░░░░▒▒▒▒██░░░░░░▒▒██░░░░░░░░░░░░░░
░░░░░░██░░██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██░░░░░░░░██░░░░░░░░░░░░
░░░░██░░░░██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██░░░░░░░░████████████░░
░░░░██░░██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██░░░░░░██░░░░░░░░▒▒██
░░░░██░░██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██░░░░░░██░░░░░░░░░░░░
░░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██░░░░░░██░░░░░░░░░░░░
░░░░░░██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██▓▓████▒▒░░░░░░░░░░░░
░░░░██░░░░██░░░░░░░░░░░░░░░░░░░░░░░░██░░░░░░░░░░░░░░░░░░██░░░░░░░░░░░░░░
░░██░░░░░░██░░░░██████░░░░░░░░░░░░░░██░░░░░░░░░░░░░░░░░░██░░░░░░░░░░░░░░
░░██░░░░░░▓▓████░░░░░░████░░░░░░░░░░▓▓░░░░░░░░░░░░░░░░░░██░░░░░░░░░░░░░░
░░██░░░░░░██░░░░░░░░░░░░░░██░░░░░░░░░░░░░░░░░░░░░░░░░░░░██░░░░░░░░░░░░░░
██░░░░░░██░░░░░░░░░░░░░░░░░░██░░░░░░░░░░░░░░░░░░░░░░░░░░██░░░░░░░░░░░░░░
██░░░░░░██░░░░██░░░░░░██░░░░██░░░░░░░░░░░░░░░░░░░░░░░░░░▓▓░░░░░░░░░░░░░░
██░░░░░░██░░░░██░░░░░░██░░░░██░░░░░░░░░░░░░░░░░░░░░░░░░░▒▒░░░░░░░░░░░░░░
██░░░░░░██░░░░░░░░░░░░░░░░░░██░░████░░░░░░░░░░░░░░░░░░██░░░░░░░░░░░░░░░░
██░░░░░░▒▒████░░░░░░░░░░████░░░░██▒▒██░░░░░░░░░░░░░░░░██░░░░░░░░░░░░░░░░
░░██░░░░░░▒▒▒▒██▓▓▓▓▓▓▓▓██████▓▓▓▓▓▓██░░░░░░░░░░░░░░░░██░░░░░░░░░░░░░░░░
░░██░░░░░░░░░░░░░░░░██▓▓▓▓▓▓▓▓▓▓▓▓██░░░░░░░░░░░░░░░░██░░░░░░░░░░░░░░░░░░
░░░░██░░░░░░░░░░░░░░░░████████████░░░░░░░░░░░░░░░░░░██░░░░░░░░░░░░░░░░░░
  `;
  return msg.channel.createMessage(hog);
}

// fired when a message is created
bot.on('messageCreate', async (msg) => {

  // check if regular message
  if (!msg.channel.guild) {
    return;
  }

  // check if not own message
  if (msg.author.id === bot.user.id) {
    return;
  }

  try {
    if (msg.content.toLowerCase().startsWith('!hog') && enabled('command-hog', msg.channel.id)) {
      await sendHog(msg);
    } else if (msg.content.toLowerCase().startsWith('!id') && enabled('command-show-channel-id', msg.channel.id)) {
      await msg.channel.createMessage('channel: ' + msg.channel);
    }
  } catch (err) {
    console.warn('handle action failed');
    console.warn(err);
  }
});

bot.on('error', err => {
  console.warn(err);
});

bot.connect();

// https://discord.com/oauth2/authorize?client_id=INSERT_CLIENT_ID_HERE&scope=bot&permissions=0