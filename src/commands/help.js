const Discord = require('discord.js');

const commandsAvailable = 
    "role: Request a role (Sophomore, Soft. Eng. Major, etc)\n" + 
    "roles: List all available roles.\n" + 
    "about: Prints information about this bot.\n" + 
    "help: Prints this message.\n"


/**
 * Prints a list of commands available.
 * @param {Discord.Message} message The message that prompted this command.
 */
function helpCommand(message) {
  message.channel.send(commandsAvailable, {code: true});
}

module.exports = helpCommand;