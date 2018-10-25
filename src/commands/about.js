const Discord = require('discord.js');
const moment = require('moment'); // Time/Date management library
const os = require('os'); // Get information about device running bot

/**
 * Prints out information about this bot in a pretty embedded message.
 * @see https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/first-bot/using-embeds-in-messages.md
 * @see 
 * @param {Discord.Message} message The message that prompted this command
 */
function aboutCommand(message) {
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

  message.channel.send(richEmbed);
}

module.exports = aboutCommand;