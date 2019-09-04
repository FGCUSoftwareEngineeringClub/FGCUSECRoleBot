const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const Logger = require('../../logging/Logger');
const Settings = require('../../GlobalSettings');

/**
 * Allows removing a requested role given that the user already has the role.
 */
class RemoveRoleCommand extends Commando.Command {
  /** @param {Commando.CommandoClient} client */
  constructor(client) {
    super(client, {
      name: 'removerole',
      examples: ['removerole Senior',
        'removerole Soft. Eng. Major',
        'removerole Soft. Eng. Major, Senior'],
      description: 'Removes a given set of roles from a user if they have that role',
      guildOnly: true,
      group: 'roles',
      memberName: 'remove',

      args: [
        {
          key: 'role',
          infinite: true,
          label: 'roles',
          type: 'string',
          prompt: 'What roles would you like removed?',

          /**
           * @param {string} value
           * @return {string[]}
           */
          parse: (value) => value.split(',').map((role) => role.trim()),

        },
      ],
    });
  }

  /**
   * @param {Commando.CommandMessage} message The message that triggered this command.
   * @param {object} args Any arguments passed in with this commands.
   * @param {string[]} args.role The roles requested to be removed.
   */
  async run(message, args) {
    const user = message.member;
    const rolesRequested = message.argString.split(',').map((input) => input.trim());

    if (rolesRequested.length > 0) {
      /**
       * If the name of the current role is in the roles array and the bot manages this role, then
       * remove it.
       */
      const rolesToRemove = user.roles.filter(function(role) {
        return (rolesRequested.includes(role.name) &&
                Settings.roles.namesOfAllRoles.includes(role.name));
      });
      const rolesToRemoveNames = rolesToRemove.array().map((role) => role.name).join(', ');
      await user.removeRoles(rolesToRemove);
      Logger.info({
        server: message.guild,
        message: 'Removed roles: ' + rolesToRemoveNames + ' from ' + user.user.tag,
      });
      return message.reply(rolesToRemoveNames + ' removed.');
    } else {
      return message.reply('There were no roles to remove.');
    }
  }
}

module.exports = RemoveRoleCommand;
