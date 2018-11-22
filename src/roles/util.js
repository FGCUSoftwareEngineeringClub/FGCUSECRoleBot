const Discord = require('discord.js');
const {settingsKeys} = require('../settings/SettingsProvider');

/**
 * Returns true if the given server has set a channel to be the primary place for assigning roles
 * in the server settings and that channel actually exists in the server.
 * @param {Discord.Guild} server
 * @return {boolean}
 */
function serverHasRoleAssignmentChannel(server) {
  const serverRoleAssignmentChannelId = getServerRoleAssignmentChannelIdFromSettings(server);

  return !!server.channels.get(serverRoleAssignmentChannelId);
}

/**
 * Returns the id of the channel that is set as the server's role assignment channel from the
 * server's settings.
 * @param {Discord.Guild} server
 * @return {string | undefined}
 */
function getServerRoleAssignmentChannelIdFromSettings(server) {
  return server.settings.get(settingsKeys.DEFAULT_ROLE_ASSIGNMENT_CHANNEL);
}

/**
 * Returns true if the given server has role-assignment messages set in settings and at least one
 * of those channels still exist.
 * @param {Discord.Guild} server
 * @return {boolean};
 */
async function serverHasExistingRoleAssignmentMessages(server) {
  /** @type {Discord.TextChannel} */
  const roleAssignmentChannel =
      server.channels.get(getServerRoleAssignmentChannelIdFromSettings(server));

  /** @type {string[]} */
  const roleAssignmentMessageIds = server.settings.get(settingsKeys.ROLE_ASSIGNMENT_MESSAGES);

  if (!roleAssignmentMessageIds || roleAssignmentMessageIds.length == 0) return false;

  const roleAssignmentMessages = await Promise.all(roleAssignmentMessageIds
      .map((id) => roleAssignmentChannel.fetchMessage(id)));

  // Returns true if at least one id in the channel is stored in the database.
  return roleAssignmentMessages.some((message) => roleAssignmentMessageIds.includes(message.id));
}

module.exports = {
  serverHasRoleAssignmentChannel,
  getServerRoleAssignmentChannelIdFromSettings,
  serverHasExistingRoleAssignmentMessages,
};
