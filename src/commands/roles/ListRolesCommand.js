const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const roles = require('../../roles/RolesAggregate');

let allRolesMessage = `Non-Overlapping Roles (Only one from each category.): \n`;

/**
 * Formats the message with all available roles. This also indents the message, where the name of
 * each set is indented by one level, and the roles of that set are indented by another level, hence
 * the various spaces below.
 */
if (roles.namesOfNonOverlappingRoles.length > 0) {
  for (const set of roles.nonOverlappingRoleSets) {
    allRolesMessage += `  ${set.nameOfSet}:
    ${set.getRoles().join('\n    ')}\n\n`;
  }
}

if (roles.namesOfOverlappingRoles.length > 0) {
  allRolesMessage += 'Overlapping Roles (Request as many of these as you want!)\n  ';
  allRolesMessage += roles.namesOfOverlappingRoles.join('\n  ');
}

if (roles.namesOfAllRoles.length === 0) {
  allRolesMessage = 'No roles available.';
}
/**
 * Command to list the roles available for a user to request.
 */
class ListAvailableRolesCommand extends Commando.Command {
  /**
   *
   * @param {Commando.CommandoClient} client
   */
  constructor(client) {
    super(client, {
      name: 'roles',
      group: 'roles',
      memberName: 'listroles',
      guildOnly: true,
      description: 'List roles a user can request.',
    });
  }

  /**
  * @param {Commando.CommandMessage} message
  * @param {object} args
  */
  async run(message, args) {
    return message.channel.send(allRolesMessage, {code: true});
  }
}

module.exports = ListAvailableRolesCommand;
