// @ts-check
const Discord = require('discord.js'); // Import Discord Library
const Settings = require('./GlobalSettings'); // Import settings from the settings.js file.
const path = require('path'); // Module for locating paths and files.
const Commando = require('discord.js-commando');

const Logger = require('./logging/Logger'); // Import logger for tracking bot progress.
const addDiscordChannelLogger = require('./logging/addDiscordChannelLogger');
const { setupSettingsProvider } = require('./settings/SettingsProvider');
const { listenForRoleAssignmentMessages } = require('./events/setUserRoleOnReaction');
const loadEvents = require('./util/eventLoader');

// Import methods responsible for creating roles in servers as necessary.
const createServerRoles = require('./events/createServerRoles').run;
const initializeInstance = require('./commands/admin/postreddit').initializeInstance;

const discordClient = new Commando.CommandoClient({
  owner: Settings.botOwners,
  commandPrefix: Settings.COMMAND_PREFIX,
});

/**
 * Sets a listener to run when the client is ready, or when it's successfully logged in.
 *
 * This is useful for doing things when the bot first starts running, such as setting a status or
 * printing a message.
 *
 * This function is marked with the 'async' tag to say that it isn't sure exactly how long it will
 * take for this function to complete. Changing the bot's status, adding roles, etc, all take time.
 *
 * When you want to wait for something that takes time to finish before moving on, you place the
 * 'await' keyword in front of it to have the function wait for that to finish before continuing.
 */
discordClient.on('ready', async function () {
  addDiscordChannelLogger(discordClient);
  Logger.debug('FSEC Role Bot logged in as ' + discordClient.user.tag + '!');

  // Generate invite link for bot with a list of permissions we want the bot to have.
  const inviteLink = await discordClient.generateInvite(['CONNECT',
    'MANAGE_ROLES',
    'KICK_MEMBERS',
    'MANAGE_NICKNAMES',
    'SEND_MESSAGES',
    'VIEW_CHANNEL']);

  Logger.debug('Invite me to your server with this link: ' + inviteLink);

  // Preload/cache role-request messages to make sure the bot can respond to them.
  await listenForRoleAssignmentMessages(discordClient);

  /*
  Set the bot's status on Discord to show when the server was last started.
  Date is formatted as "MMMM Do YYYY, h:mm:ss a" -> "January 1st 2018, 12:01:00 am"
  */
  discordClient.user.setPresence({
    game: {
      type: 'LISTENING',
      name: Settings.COMMAND_PREFIX + 'help for commands!',
    },
  });

  /**
   * Create server roles if necessary. Any roles that aren't in the server that are in settings
   * will be created.
   */
  createServerRoles(discordClient);
  //const message_to_embed = new Discord.RichEmbed().setImage('https://preview.redd.it/d3b8tswrbxn31.jpg?width=640&crop=smart&auto=webp&s=8133c0e5fae51db9bd9eaa583c1989a4d79e0ee7')
  //message.embed(message_to_embed)
  //discordClient.channels.get("619024772898095115")
  discordClient.channels.get("619024772898095115").send("HAHAHA!")
  //DeployReddit.initializeInstance(null, null, discordClient)
  //.get("guild.reddit.instances", null);
  var redditValue = discordClient
  //var redditValue = message.guild.settings.get(messageArguments[0], null);
  //console.log(discordClient.guilds.get("619024772415881240").settings.get("guild.reddit.instances"))
  //discordClient.guilds.keyArray
  initializeInstance(discordClient)
  // discordClient.channels.get("619024772898095115").send(message_to_embed).then(async function (reply) {
  //   //console.log(reply.id)
  //   reply.channel.fetchMessage(reply.id).then(async function (message_retrieved) {
  //     await message_retrieved.react('👍');
  //     await message_retrieved.react('👎');
  //   });
  // });
});

discordClient.registry.registerGroups([
  ['roles', 'Roles'],
  ['admin', 'Administrator'],
]);

discordClient.registry.registerDefaultTypes(); // Boilerplate to prepare bot for commands.
discordClient.registry.registerDefaultGroups();
discordClient.registry.registerDefaultCommands({
  eval_: false,
  help: true,
  ping: true,
  prefix: false,
});

// Register commands in the commands directory.
discordClient.registry.registerCommandsIn(path.join(__dirname, 'commands'));

/**
 * Wrap main actions into this main function so that we can run commands async and keep it readable.
 */
async function main() {
  await setupSettingsProvider(discordClient); // Set up settings database.
  await loadEvents(discordClient); // Load any events from the events directory.
  discordClient.login(Settings.BOT_TOKEN); // Log into Discord.
}

main();

module.exports = discordClient; // Export the client for use in other files.
