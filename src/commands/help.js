const Discord = require('discord.js');
const Commando = require('discord.js-commando');

const commandsAvailable = 
    "role: Request a role (Sophomore, Soft. Eng. Major, etc)\n" + 
    "roles: List all available roles.\n" + 
    "removerole: Removes given roles if you have them.\n" +
    "ping: pong\n" + 
    "about: Prints information about this bot.\n" + 
    "help: Prints this message.\n"

/**
 * Prints a list of commands available.
 * @param {Discord.Message} message The message that prompted this command.
 */
function helpCommand(message) {
  message.channel.send(commandsAvailable, {code: true});
}

//TODO: Is this necessary?
class HelpCommand extends Commando.Command {
  constructor(client) {
    super(client, {
      name: help
    })
  }
}

module.exports = helpCommand;