// @ts-check
const Commando = require('discord.js-commando');
const Discord = require('discord.js');
const {getServerRoleAssignmentChannelIdFromSettings,
  serverHasRoleAssignmentChannel,
  findRoleFromEmoji,
  userHasRole,
  removeUserConflictingRoles,
  findServerRoleFromName} = require('../../roles/util');

const {settingsKeys} = require('../../settings/SettingsProvider');

/**
 *
 * @param {Discord.MessageReaction} reaction
 * @param {Discord.User} user
 */
async function assignUserRole(reaction, user) {
  if (user.bot) return;
  const message = reaction.message;
  const messageChannel = message.channel;

  /**
   * Only if the server has a role assignment channel set in settings, that channel exists, the
   * message the reaction happened in was the channel set in settings, and the user actually reacted
   * to a role assignment message, should we continue. The user can't be a bot either.
   */
  const isMessageEligibleForRoleAssignment = serverHasRoleAssignmentChannel(message.guild) &&
    currentChannelIsRoleAssignmentChannel(messageChannel) &&
    userReactedToRoleAssigningMessage(reaction, user);

  if (!isMessageEligibleForRoleAssignment) return;

  const emojiAdded = reaction.emoji.name;
  const requestedRoleInfo = findRoleFromEmoji(emojiAdded);
  const userAsGuildMember = await message.guild.fetchMember(user);

  if (requestedRoleInfo.roleSet) {
    // Remove conflicting roles in the set and assign new role.
    await removeUserConflictingRoles(userAsGuildMember, requestedRoleInfo.roleSet);
  } else {
    const userRole = userHasRole(userAsGuildMember, requestedRoleInfo.role);
    if (userRole) {
      /**
       * If we get to this point, the userRole here must be an overlapping role, so if the user
       * already has it, just remove it.
       */
      await userAsGuildMember.removeRole(userRole);
      await reaction.remove(userAsGuildMember);

      return;
    }
  }

  const serverRoleRequested = findServerRoleFromName(message.guild, requestedRoleInfo.role);
  await userAsGuildMember.addRole(serverRoleRequested);
  await reaction.remove(userAsGuildMember);
}

/**
 * Returns true if the given channel is the server's role assignment channel.
 * @param {Discord.TextChannel} channel
 * @return {boolean}
 */
function currentChannelIsRoleAssignmentChannel(channel) {
  return channel.id === getServerRoleAssignmentChannelIdFromSettings(channel.guild);
}

/**
 * Returns true if the user that added a message reaction reacted to a message that is defined for
 * assigning roles.
 * @param {Discord.MessageReaction} reaction
 * @param {Discord.User} user
 * @return {boolean}
 */
function userReactedToRoleAssigningMessage(reaction, user) {
  const message = reaction.message;
  const server = reaction.message.guild;
  /** @type {string[]} */
  const serverRoleAssignmentChannelIds = server.settings.get(settingsKeys.ROLE_ASSIGNMENT_MESSAGES);
  const messageAuthorWasBot = message.author.id === message.client.user.id;

  /**
   * Find if the message the user reacted to was a message the bot posted and check if the message
   * the user reacted to was a message that's for assigning roles.
   */
  return serverRoleAssignmentChannelIds &&
          serverRoleAssignmentChannelIds.includes(message.id) &&
          messageAuthorWasBot;
}

module.exports = assignUserRole;
