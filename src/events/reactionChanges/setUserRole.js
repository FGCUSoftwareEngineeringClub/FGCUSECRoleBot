// @ts-check
const Commando = require('discord.js-commando');
const Discord = require('discord.js');
const {getServerRoleAssignmentChannelIdFromSettings, serverHasRoleAssignmentChannel} = require('../../roles/util');
const {settingsKeys} = require('../../settings/SettingsProvider');

/**
 *
 * @param {Discord.MessageReaction} reaction
 * @param {Discord.User} user
 */
function assignUserRole(reaction, user) {
  const message = reaction.message;
  const messageChannel = message.channel;

  /**
   * Only if the server has a role assignment channel set in settings, that channel exists, the
   * message the reaction happened in was the channel set in settings, and the user actually reacted
   * to a role assignment message, should we continue.
   */
  const isMessageEligibleForRoleAssignment = serverHasRoleAssignmentChannel(message.guild) &&
    currentChannelIsRoleAssignmentChannel(messageChannel) &&
    userReactedToRoleAssigningMessage(reaction, user);

  if (!isMessageEligibleForRoleAssignment) return;
}

/**
 * Returns true if the given channel is the server's role assignment channel.
 * @param {Discord.TextChannel} channel
 * @return {boolean}
 */
function currentChannelIsRoleAssignmentChannel(channel) {
  return channel.id === getServerRoleAssignmentChannelIdFromSettings(channel.guild).id;
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
  return serverRoleAssignmentChannelIds.includes(message.id) && messageAuthorWasBot;
}
