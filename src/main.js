const Discord = require('discord.js'); // Import Discord Library
const Settings = require('./settings'); // Import settings from the settings.js file.
const path = require('path'); // Module for locating paths and files.
const Commando = require('discord.js-commando');

const Logger = require('./logging/Logger'); // Import logger for tracking bot progress.
const addDiscordChannelLogger = require('./logging/addDiscordChannelLogger');

// Import methods responsible for creating roles and other commands.
const createServerRoles = require('./commands/createServerRoles'); 

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
  Logger.debug('FSEC Role Bot logged in as ' + discordClient.user.tag + '!')
  
  // Generate invite link for bot with a list of permissions we want the bot to have.
  const inviteLink = await discordClient.generateInvite(['CONNECT',
    'MANAGE_ROLES',
    'KICK_MEMBERS',
    'MANAGE_NICKNAMES', 
    'SEND_MESSAGES',   
    'VIEW_CHANNEL']);
  
  Logger.debug('Invite me to your server with this link: ' + inviteLink);
  
  /*
  Set the bot's status on Discord to show when the server was last started.
  Date is formatted as "MMMM Do YYYY, h:mm:ss a" -> "January 1st 2018, 12:01:00 am"
  */ 
  discordClient.user.setPresence({
    game: {
      type: "LISTENING",
      name: Settings.COMMAND_PREFIX + "help for commands!",
    }
  });

  /**
   * Create server roles if necessary. Any roles that aren't in the server that are in settings
   * will be created.
   */
  createServerRoles(discordClient);
});

discordClient.registry.registerGroups([
  ['roles', 'Roles']
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
 * When the bot is invited to a server, try to create all equal roles listed in settings.
 */
discordClient.on('guildCreate', function (serverJoined) {
  createServerRoles(discordClient);
});

discordClient.login(Settings.BOT_TOKEN); // Log into Discord.

module.exports = discordClient; // Export the client for use in other files.