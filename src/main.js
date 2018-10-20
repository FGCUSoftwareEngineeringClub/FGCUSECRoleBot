const Discord = require('discord.js'); // Import Discord Library

/**
 * Import environment variables. Instead of having strings hardcoded, we put them in our .env file
 * for privacy and so they can be easily changed.
 * 
 * Look at the .example.env file for an example of what variables are used.
 * 
 * To access an environment variable, use 'process.env.key', where key is the name of the variable.
 */
const environmentVariables = require('dotenv').config();

const discordClient = new Discord.Client();

/**
 * Sets a listener to run when the client is ready, or when it's successfully logged in.
 * 
 * This is useful for doing things when the bot first starts running, such as setting a status or
 * printing a message.
 */
discordClient.on('ready', async function () {
  console.log('FSEC Role Bot logged in as ' + discordClient.user.tag + '!');
  
  // Generate invite link for bot with a list of permissions we want the bot to have.
  const inviteLink = await discordClient.generateInvite(['CONNECT',
    'MANAGE_ROLES_OR_PERMISSIONS', 
    'MANAGE_ROLES',
    'KICK_MEMBERS',
    'MANAGE_NICKNAMES', 
    'READ_MESSAGES', 
    'SEND_MESSAGES', 
    'VIEW_CHANNEL']);
  
  console.log('Invite me to your server with this link: ' + inviteLink);
  
  /*
  Set the bot's status on Discord to show when the server was last started.
  */ 
  discordClient.user.setPresence({
    game: {
      type: "WATCHING",
      name: "Server last started at " + new Date(),
    }
  })
});


discordClient.login(process.env.BOT_TOKEN); // Log into Discord.