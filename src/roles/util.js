// @ts-check
const Discord = require('discord.js');
const Roles = require('./RolesAggregate');
const NonOverlappingRoleSet = require('./NonOverlappingRoleSet');
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
 * @return {Promise<boolean>};
 */
async function serverHasExistingRoleAssignmentMessages(server) {
  /** @type {Discord.TextChannel} */
  const roleAssignmentChannel =
      server.channels.get(getServerRoleAssignmentChannelIdFromSettings(server));

  /** @type {string[]} */
  const roleAssignmentMessageIds = server.settings.get(settingsKeys.ROLE_ASSIGNMENT_MESSAGES);

  if (!roleAssignmentMessageIds || roleAssignmentMessageIds.length == 0) return false;

  // Fetch the messages from the server since the client might not have them cached locally.
  const roleAssignmentMessages = await Promise.all(roleAssignmentMessageIds
      .map((id) => roleAssignmentChannel.fetchMessage(id)));

  // Returns true if at least one id in the channel is stored in the database.
  return roleAssignmentMessages.some((message) => roleAssignmentMessageIds.includes(message.id));
}

/**
 * Returns true if the given user has a role that matches the given name.
 * @param {Discord.GuildMember} user
 * @param {string} roleName
 * @return {Discord.Role}
 */
function userHasRole(user, roleName) {
  return user.roles.find((role) => role.name === roleName);
}

/**
 * @typedef {{role: string, roleSet: NonOverlappingRoleSet, emoji: string}} RoleEmojiInfo
 * Find a role given the emoji associated with it. Returns whether or not the role is allowed to
 * overlap with others or not.
 * @param {string} emoji The emoji of the role to look for.
 * @return {RoleEmojiInfo}
 */
function findRoleFromEmoji(emoji) {
  for (const nonOverlappingRoleSet of Roles.nonOverlappingRoleSets) {
    const roleMatchingWithEmoji = nonOverlappingRoleSet.getRoleFromEmoji(emoji);
    if (roleMatchingWithEmoji) {
      return {
        role: roleMatchingWithEmoji,
        roleSet: nonOverlappingRoleSet,
        emoji: emoji,
      };
    }
  }

  for (const [roleName, roleEmoji] of Roles.overlappingRolesWithEmojis) {
    if (emoji === roleEmoji) {
      return {
        role: roleName,
        roleSet: null,
        emoji: roleEmoji,
      };
    }
  }
}

/**
 * Removes all the roles of a user in an overlapping set.
 * @param {Discord.GuildMember} guildMember
 * @param {NonOverlappingRoleSet} roleSet
 */
async function removeUserConflictingRoles(guildMember, roleSet) {
  const rolesAUserHasInThisSet = guildMember.roles.filter((role) => roleSet.contains(role.name));
  await guildMember.removeRoles(rolesAUserHasInThisSet);
}

/**
 * Returns the Discord role that matches the given name for a server.
 * @param {Discord.Guild} server
 * @param {string} roleName
 * @return {Discord.Role}
 */
function findServerRoleFromName(server, roleName) {
  return server.roles.find((role) => role.name === roleName);
}

/**
 * Returns the Discord Channel that was set as the role assignment channel in settings.
 * @param {Discord.Guild} guild
 * @return {Discord.GuildChannel}
 */
function getServerRoleAssignmentChannelFromSettings(guild) {
  const id = getServerRoleAssignmentChannelIdFromSettings(guild);
  return guild.channels.get(id);
}

module.exports = {
  serverHasRoleAssignmentChannel,
  getServerRoleAssignmentChannelIdFromSettings,
  serverHasExistingRoleAssignmentMessages,
  findRoleFromEmoji,
  userHasRole,
  removeUserConflictingRoles,
  findServerRoleFromName,
  getServerRoleAssignmentChannelFromSettings,
};
