const Logger = require('../logging/Logger');
const Settings = require('../settings');
const Discord = require('discord.js');

/**
 * Sets a temporary debug command. If an administrator runs this command, then all roles that the 
 * bot has listed in Settings are removed.
 * @param {Discord.Message} message 
 */
function removeAllRoles(message) {
  Logger.info('User ' + message.author.tag + ' requested all roles be removed.');
  message.channel.send('Removing roles added.');
  let rolesRemoved = [];

  message.guild.roles.forEach(async function (role) {
    if (Settings.allEqualRoles.includes(role.name)) {
      rolesRemoved.push(role.name);
      try {
        await role.delete('Admin requested role be removed.');
      } catch (error) {
        Logger.error(error);
      }
    }
  });

  // Prints a formatted message with the roles removed in a list.
  const rolesRemovedMessage = rolesRemoved.length + ' roles removed:\n' + rolesRemoved.join('\n');
  message.channel.send(rolesRemovedMessage, {
    code: true,
  });
}

module.exports = removeAllRoles;