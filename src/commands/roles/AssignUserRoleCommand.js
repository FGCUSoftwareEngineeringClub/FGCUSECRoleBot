//@ts-check
const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const Logger = require('../../logging/Logger');
const RolesAggregate = require('../../roles/RolesAggregate');
const Settings = require('../../settings');
const NonOverlappingRoleSet = require('../../roles/NonOverlappingRoleSet');

/**
 * Assigns roles to a user. Valid roles that a user can request should be listed in Settings. A user
 * should be able to request multiple roles at once by separated them with a comma.
 * 
 * Special thanks to Jeremy R. Martin.
 * 
 * @param {Discord.Message} message 
 */
class AssignUserRoleCommand extends Commando.Command { // TODO: Redo all of this.
  constructor(client) {
    super(client, {
      name: 'role',
      description: 'Assigns roles to the user',
      group: 'roles',
      guildOnly: true,
      memberName: 'assignuserrole',
    });
  }

  /**
  * @param {Commando.CommandMessage} message
  * @param {object} args 
  */
  async run(message, args) {
    const requestedRoles = this.getRequestedRoles(message);
    const rolesToAssign = this.getRolesToAssign(message, requestedRoles).map(role => role.toLowerCase());

    const rolesThatWereRequestedAndExistInThisServer = this.getRolesOfServer(message, rolesToAssign);

    await this.removeUserConflictingRoles(message, rolesThatWereRequestedAndExistInThisServer);

    // If the user's current roles don't contain the name of the role requested, place them in this collection.
    const rolesTheUserRequestedAndDoesNotCurrentlyHave = rolesThatWereRequestedAndExistInThisServer.filter(function (role) {
      return !message.member.roles.find(findingRole => findingRole.name === role.name);
    });

    const namesOfServerRolesAssigned = rolesTheUserRequestedAndDoesNotCurrentlyHave.map(role => role.name).join(', ');

    await message.member.addRoles(rolesTheUserRequestedAndDoesNotCurrentlyHave);
    const loggingMessage = `User ${message.author.tag} ${message.member.nickname || ''} was assigned ${namesOfServerRolesAssigned}`;
    Logger.info({
      server: message.guild,
      message: loggingMessage
    });
    return message.reply(`You were assigned: ${namesOfServerRolesAssigned}`);

  }

  /**
   * Returns a list of the roles a user requested.
   * @param {Commando.CommandMessage} message The message that triggered this command.
   * @returns {string[]} The roles a user requested.
   */
  getRequestedRoles(message) {
    return message.argString
    .split(',') // Split at commas to find roles
    .map(untrimmedString => untrimmedString.trim()) // Remove extra spaces
    .filter(trimmedString => trimmedString.length !== 0); // Remove any items that have nothing in them.
  }

  /**
   * Returns a list of roles that don't conflict with each other. If a user requests two roles that
   * do conflict, they'll receive the last one requested. Roles that are allowed to exist together
   * should be added to the resulting array unchanged.
   * 
   * @param {Commando.CommandMessage} message The message that prompted this command.
   * @param {string[]} requestedRoles A list of roles 
   */
  getRolesToAssign(message, requestedRoles) {
    /** @type {Map<NonOverlappingRoleSet, string>} */
    const nonOverlappingRolesToAssign = this.findUserPreexistingNonOverlappingRoles(message, new Map());
    let keysOfNonOverlappingRolesToAssign = [...nonOverlappingRolesToAssign.keys()];

    /** @type {string[]} */
    const allRolesToAssign = [];
    for (const role of requestedRoles) {
      const setForThisRole = RolesAggregate.getNonOverlappingSetFromName(role, true);

      /**
       * If a nonoverlapping set exists for this role, then add it to the map and add it to the
       * array of all roles. If the set is already in the map, then we know that it should already
       * be in the array, meaning we can find the index and maintain the order the user requested
       * the roles in.
       */
      if (setForThisRole) {
        nonOverlappingRolesToAssign.set(setForThisRole, role);
        
        const indexOfThisSet = keysOfNonOverlappingRolesToAssign.indexOf(setForThisRole);

        if (indexOfThisSet === -1) { // No role from this set has been requested yet so add it to the end.
          allRolesToAssign.push(role);
        } else { // A role from this set has already been requested so we should overwrite it.
          allRolesToAssign[indexOfThisSet] = role;
        }

      } else if (RolesAggregate.doesOverlappingRoleExist(role, true)) { // If set doesn't exist, then add it to the list since it should be an overlapping role.
        allRolesToAssign.push(role);
      }

      keysOfNonOverlappingRolesToAssign = [...nonOverlappingRolesToAssign.keys()];
    }

    return [...nonOverlappingRolesToAssign.values()];
  }

  /**
   * Returns a Collection of roles that exist in the current server, we're allowed to assign, and 
   * the user requested.
   * 
   * @param {Commando.CommandMessage} message The message that prompted this command.
   * @param {string[]} requestedRoles An array of roles for the user to be assigned.
   * 
   * @returns {Discord.Collection<string, Discord.Role>}
   */
  getRolesOfServer(message, requestedRoles) {
    const allServerRoles = message.guild.roles;

    const serverRolesThatAreManagedAndRequested = allServerRoles.filter(function (role) {
      return RolesAggregate.doesRoleExist(role.name, true) && requestedRoles.includes(role.name.toLowerCase());
    });

    return serverRolesThatAreManagedAndRequested;
  }
  
  /**
   * Populates a map with a user's preexisting roles that aren't allowed to overlap.
   * @param {Commando.CommandMessage} message The message that prompted this command.
   * @param {Map<NonOverlappingRoleSet, string>} map The map to place results into.
   */
  findUserPreexistingNonOverlappingRoles(message, map) {
    const user = message.member;

    /**
     * For each of the user's roles, check if it exists in a nonoverlapping set, then add it to the 
     * map if it does.
     */
    for (const [roleId, role] of user.roles) {
      const setForThisRole = RolesAggregate.getNonOverlappingSetFromName(role.name, true);
      if (setForThisRole) {
        map.set(setForThisRole, role.name);
      }
    }

    return map;
  }

  /**
   * Removes any roles that a user currently has that would conflict with the roles they're to be assigned.
   * @param {Commando.CommandMessage} message The message that prompted this command.
   * @param {Discord.Collection<string, Discord.Role>} requestedRoles A collection of requested roles that exist.
   */
  async removeUserConflictingRoles(message, requestedRoles) {
    const user = message.member;

    for (const [id, role] of requestedRoles) {
      const setForThisRole = RolesAggregate.getNonOverlappingSetFromName(role.name, true);
      
      if (setForThisRole) {
        const conflictingRoles = setForThisRole.findMatchingRoles(user);
        await user.removeRoles(conflictingRoles);
        Logger.info({
          server: message.guild,
          message: `${user.user.tag} had roles ${conflictingRoles.map(role => role.name).join(', ')} removed.`
        });
      }
    }

  }
}

module.exports = AssignUserRoleCommand;