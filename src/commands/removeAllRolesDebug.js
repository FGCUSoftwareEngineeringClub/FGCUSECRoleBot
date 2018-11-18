//@ts-check
const Logger = require('../logging/Logger');
const Discord = require('discord.js');
const roles = require('../roles/RolesAggregate');

/**
 * Sets a temporary debug command. If an administrator runs this command, then all roles that the 
 * bot has listed in the RolesAggregate are removed.
 * @param {Discord.Message} message 
 */
function removeAllRoles(message) {
  Logger.info({
    server: message.guild,
    message: 'User ' + message.author.tag + ' requested all roles be removed.'
  });
  message.channel.send('Removing roles added.');
  let rolesRemoved = [];

  message.guild.roles.forEach(async function (role) {
    if (roles.namesOfAllRoles.includes(role.name)) {
      rolesRemoved.push(role.name);
      try {
        await role.delete('Admin requested role be removed.');
      } catch (error) {
        Logger.error({
          server: message.guild,
          message: error,
        });
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