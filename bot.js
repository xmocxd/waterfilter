const eris = require('eris');
const bot = new eris.Client('KEY');

// channel to enable the bot in
// [0] => bot-test channel
const enabledChannels = ['959300604545597480', '958011311185358950'];

// configure actions
const actions = {
  'command-hog': {
    enabledChannels : '*'
  },
  'command-clear': {
    enabledChannels : ['959300604545597480']
  },
  'command-show-channel-id': {
    enabledChannels : '*'
  },
  'clean-messages': {
    enabledChannels : ['959300604545597480']
  }
};

bot.on('ready', () => {
  console.log('my body is ready');
});

function enabled(action, channelID) {
  if (actions[action].enabledChannels == '*' ||
      actions[action].enabledChannels.indexOf(channelID) !== -1) {
    return true;
  } else {
    return false;
  }
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

  // check if enabled in channel
  if (enabledChannels.indexOf(msg.channel.id) === -1) {
    return;
  }

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
    } else if (msg.content.toLowerCase().startsWith('!clear') && enabled('command-clear', msg.channel.id)) {
      await msg.channel.purge({'limit': -1});
    } else if (msg.content.toLowerCase().startsWith('!id') && enabled('command-show-channel-id', msg.channel.id)) {
      await msg.channel.createMessage('channel: ' + msg.channel);
    } else if (enabled('clean-messages', msg.channel.id)) {
      await msg.channel.createMessage(msg.member.nick + ': ' + msg.content);
      await msg.channel.deleteMessage(msg.id);
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