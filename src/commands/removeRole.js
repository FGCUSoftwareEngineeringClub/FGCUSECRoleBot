const Discord = require('discord.js');
const Logger = require('../logging/Logger');

/**
 * Removes a given set of roles from a user if they have that role.
 * @param {Discord.Message} message The message that triggered this request.
 */
async function removeRoles(message) {
  const messageWithoutCommand = message.content.substring(message.content.indexOf(' '));
  const roles = messageWithoutCommand.split(',').map(word => word.trim());
  const user = message.member;

  // TODO: Only remove roles if they are a role managed by this boy.
  if (roles.length > 0) {
    // If the name of the current role is in the roles array, then remove it.
    const rolesToRemove = user.roles.filter(function (role) {
      return roles.includes(role.name);
    });
    const rolesToRemoveNames = rolesToRemove.array().join(', ');
    await user.removeRoles(rolesToRemove);
    message.reply(rolesToRemoveNames + " removed.");
    Logger.info('Removed roles: ' + rolesToRemoveNames + ' from ' + user.user.tag);
  } else {
    message.reply('There were no roles to remove.');
  }
}

module.exports = removeRoles;