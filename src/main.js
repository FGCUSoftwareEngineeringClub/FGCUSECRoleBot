const Discord = require('discord.js'); // Import Discord Library
const Settings = require('./settings'); // Import settings from the settings.js file.

const createServerRoles = require('./createServerRoles');
const discordClient = new Discord.Client();

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
  console.log('FSEC Role Bot logged in as ' + discordClient.user.tag + '!');
  
  // Generate invite link for bot with a list of permissions we want the bot to have.
  const inviteLink = await discordClient.generateInvite(['CONNECT',
    'MANAGE_ROLES',
    'KICK_MEMBERS',
    'MANAGE_NICKNAMES', 
    'SEND_MESSAGES',   
    'VIEW_CHANNEL']);
  
  console.log('Invite me to your server with this link: ' + inviteLink);
  
  /*
  Set the bot's status on Discord to show when the server was last started.
  */ 
  discordClient.user.setPresence({
    game: {
      type: "WATCHING",
      name: "Server last started at " + new Date().toDateString(),
    }
  });

  /**
   * Create server roles if necessary. Any roles that aren't in the server that are in settings
   * will be created.
   */
  createServerRoles(discordClient);
});

/**
 * Sets a temporary debug command. If an administrator runs this command, then all roles that the 
 * bot has listed in Settings are removed.
 */
discordClient.on('message', function (message) {
  if (message.content.startsWith(Settings.COMMAND_PREFIX + 'order66') && 
      message.member.hasPermission('ADMINISTRATOR') && !message.author.bot) {
    message.channel.send('Removing roles I added.');
    let rolesRemoved = [];
    message.guild.roles.forEach(async function (role) {
      if (Settings.allEqualRoles.includes(role.name)) {
        rolesRemoved.push(role.name);
        await role.delete('Admin requested role be removed.')
      }
    });

    // Prints a formatted message with the roles removed in a list.
    const rolesRemovedMessage = rolesRemoved.length + ' roles removed:\n' + rolesRemoved.join('\n');
    message.channel.send(rolesRemovedMessage, {
      code: true,
    });
  }
});


discordClient.login(Settings.BOT_TOKEN); // Log into Discord.