// @ts-check
const Commando = require('discord.js-commando');
const Discord = require('discord.js');
const {settingsKeys} = require('../../settings/SettingsProvider');
const util = require('../../roles/util');
const Roles = require('../../roles/RolesAggregate');
const Logger = require('../../logging/Logger');

/**
 * Command to generate the messages that users can add a reaction to in order to have a role
 * assigned.
 */
class GenerateRoleAssignmentMessagesCommand extends Commando.Command {
  /** @param {Commando.CommandoClient} client */
  constructor(client) {
    super(client, {
      name: 'generaterolemessages',
      description: 'Generates the messages users can react to in order to have a role assigned.',
      group: 'roles',
      memberName: 'generatereactionrolemessages',
    });
  }

  /**
   * @param {Commando.CommandMessage} message The message that prompted this command.
   * @param {string[]} args
   */
  async run(message, args) {
    if (!util.serverHasRoleAssignmentChannel(message.guild)) {
      return this.alertRoleAssignmentChannelDoesNotExist(message);
    };

    if (args.includes('--force')) {
      await this.removePreexistingRoleAssignmentMessages(message);
    } else if (await util.serverHasExistingRoleAssignmentMessages(message.guild)) {
      return this.promptUserAboutPreexistingRoleMessages(message);
    }

    const roleAssignmentChannelId =util.getServerRoleAssignmentChannelIdFromSettings(message.guild);
    /** @type {Discord.TextChannel} */
    const roleAssignmentChannel = message.guild.channels.get(roleAssignmentChannelId);

    /** @type {Discord.Message[]} */
    const roleAssignmentMessages = [];

    for (const nonOverlappingRoleSet of Roles.nonOverlappingRoleSets) {
      const roleNamesAndEmote = nonOverlappingRoleSet.rolesAndEmotes;

      const roleSelectionMessage = `Group: **${nonOverlappingRoleSet.nameOfSet}**\n` +
        nonOverlappingRoleSet.rolesAndEmotes
            .map(([roleName, emoji]) => `${emoji}: **${roleName}**`)
            .join('\n');

      /** @type {Discord.Message} */
      const roleRequestMessageForDiscord = await roleAssignmentChannel.send(roleSelectionMessage);

      // Wait for all emotes to be added to each message before continuing/
      for (const [roleName, emoji] of roleNamesAndEmote) {
        await roleRequestMessageForDiscord.react(emoji);
      }

      roleAssignmentMessages.push(roleRequestMessageForDiscord);
    }

    if (Roles.namesOfOverlappingRoles.length) {
      const overlappingRoleMessage = `Group: **Other Roles**\n` +
      Roles.overlappingRolesWithEmojis
          .map(([roleName, emoji]) => `${emoji}: **${roleName}**`)
          .join('\n');

      /** @type {Discord.Message} */
      const overlappingRoleRequestMessage = 
        await roleAssignmentChannel.send(overlappingRoleMessage);
      for (const [roleName, emoji] of Roles.overlappingRolesWithEmojis) {
        await overlappingRoleRequestMessage.react(emoji);
      }

      roleAssignmentMessages.push(overlappingRoleRequestMessage);
    }

    const roleAssignmentDiscordMessageIds = roleAssignmentMessages.map((message) => message.id);

    // Update server settings with the new role assignment messages.
    message.guild.settings
        .set(settingsKeys.ROLE_ASSIGNMENT_MESSAGES, roleAssignmentDiscordMessageIds);

    return message.reply(`Role assignment commands created in ${roleAssignmentChannel.name}`);
  }

  /**
   * Alerts the user that role selection messages already exist and that they should use the --force
   * argument to recreate them.
   * @param {Commando.CommandMessage} message The message that prompted this command.
   * @return {Discord.Message}
   */
  promptUserAboutPreexistingRoleMessages(message) {
    return message.reply(`Role-request messages already exist for this server. Use this command with --force to recreate role-request messages.`);
  }

  /**
   * Lets the user know that creating role assignment messages failed since the server doesn't have
   * a role-assigning channel set.
   * @param {Commando.CommandMessage} message
   * @return {Discord.Message}
   */
  alertRoleAssignmentChannelDoesNotExist(message) {
    return message.reply(`This server does not have a role-assignment channel set. Use the settings command to set a role-assignment channel.`);
  }

  /**
  * @param {Commando.CommandMessage} message
  */
  async removePreexistingRoleAssignmentMessages(message) {
    /** @type {string[]} */
    const roleAssignmentMessageIds = message
        .guild
        .settings
        .get(settingsKeys.ROLE_ASSIGNMENT_MESSAGES);

    const roleAssignmentChannelId =util.getServerRoleAssignmentChannelIdFromSettings(message.guild);

    /** @type {Discord.TextChannel} */
    const roleAssignmentChannel = message.guild.channels.get(roleAssignmentChannelId);
    const currentRoleAssignmentMessages = roleAssignmentMessageIds.map((id) =>
      roleAssignmentChannel.messages.get(id));

    // Check if message exists with ternery to make sure we don't call a method on something that
    // doesn't exist.
    const removedMessages =
            await Promise.all(currentRoleAssignmentMessages
                .map((message) => message ? message.delete(): undefined));

    // Remove references to message ids from server settings.
    message.guild.settings.remove(settingsKeys.ROLE_ASSIGNMENT_MESSAGES);
    Logger.info({
      message: `${message.author.tag} requested removal of role assignment messages. ${removedMessages.length} messages removed.`,
      server: message.guild,
    });
  }
}

module.exports = GenerateRoleAssignmentMessagesCommand;
