//@ts-check
const Discord = require('discord.js');
const moment = require('moment'); // Time/Date management library
const os = require('os'); // Get information about device running bot
const Commando = require('discord.js-commando');

/**
 * Prints out information about this bot in a pretty embedded message.
 * @see https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/first-bot/using-embeds-in-messages.md
 */
class AboutCommand extends Commando.Command {
  /**
   * 
   * @param {Commando.CommandoClient} client 
   */
  constructor(client) {
    super(client, {
      name: 'about',
      group: 'util',
      memberName: 'aboutbot',
      guildOnly: false, // Set this to true if you only want this command to work in a server chatroom.
      description: 'Prints information about this bot.',
    });
  }

  /**
   * @param {Commando.CommandMessage} message 
   * @param {string[]} args 
   */
  async run(message, args) {
    const serverUptime = moment.duration(os.uptime(), 'seconds').humanize()
    const clientUptime = moment.duration(message.client.uptime, 'milliseconds').humanize();
  
    const richEmbed = new Discord.RichEmbed({
        title: "**FSEC Role Bot**",
        timestamp: new Date(),
    });
  
    richEmbed.setAuthor("FGCU Software Engineering Club", "https://i.imgur.com/OfRkVRS.jpg", "https://getinvolved.fgcu.edu/organization/seclub");
    richEmbed.addField("Github", "[Click Here](https://github.com/tgayle/FGCUSECRoleBot)");
    richEmbed.addField("Bot Uptime", clientUptime);
    richEmbed.addField("Running On", `${os.type()} ${os.arch()}`);
    richEmbed.addField("Server Uptime", serverUptime);
  
    richEmbed.setFooter("Made with ❤");
  
    return message.channel.send(richEmbed);
  }
}

module.exports = AboutCommand;