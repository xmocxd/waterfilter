// const eris = require('eris');

// // Create a Client instance with our bot token.
// const bot = new eris.Client('OTU5Mjg5MzY0MDg3NzMwMjE3.YkZt1w.7dxzxOewEUZvYTQ6qCmjrB0fqRg');

// // When the bot is connected and ready, log to console.
// bot.on('ready', () => {
//   console.log('Connected and ready.');
// });

// // Every time a message is sent anywhere the bot is present,
// // this event will fire and we will check if the bot was mentioned.
// // If it was, the bot will attempt to respond with "Present".
// bot.on('messageCreate', async (msg) => {
//   const botWasMentioned = msg.mentions.find(
//     mentionedUser => mentionedUser.id === bot.user.id,
//   );

//   if (botWasMentioned) {
//     try {
//       await msg.channel.createMessage('Present');
//     } catch (err) {
//       console.warn('Failed to respond to mention.');
//       console.warn(err);
//     }
//   }
// });

// bot.on('error', err => {
//   console.warn(err);
// });

// bot.connect();
