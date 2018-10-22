const Discord = require('discord.js');
const Logger = require('../logging/Logger');
const Settings = require('../settings');

/**
 * Assigns roles to a user. Valid roles that a user can request should be listed in Settings. A user
 * should be able to request multiple roles at once by separated them with a comma.
 * 
 * @param {Discord.Message} message 
 */
async function assignUserRole(message) {
  /**
   * Get all the arguments a user adds to a message by returning the message starting after the
   * first space, or after the initial command. 
   * 
   * Example: "!!role Software Engineering" would return "Software Engineering"
   */
  const messageWithoutCommand = message.content.substring(message.content.indexOf(' '));

  const requestedRoles = messageWithoutCommand.split(',').map(word => word.trim());
  const rolesToAssignToUser = getRolesToAssignUser(requestedRoles);

  
  // If there's any sort of conflict, let the user know and stop. Otherwise, assign the roles.
  if (rolesToAssignToUser.conflict) {
    message.reply(rolesToAssignToUser.conflict.message);

    Logger.verbose(`There was an issue when assigning roles to ${message.author.tag}.
    Roles requested: ${requestedRoles}
    Error Message: ${rolesToAssignToUser.conflict}`);

    return;
  } else {

    /** 
     * Filter the roles in the server to roles that the user should be assigned and roles that 
     * actually do exist in the server.
     */
    const serverRoles = message.guild.roles.filter(function (role) {
      return rolesToAssignToUser.roles.includes(role.name);
    });

    try {
      await message.member.addRoles(serverRoles);
      Logger.info(message.author.tag + ' was assigned: ' + serverRoles.array().join(', '));
      message.reply('You were assigned: ' + serverRoles.array().join(', '));
    } catch (error) {
      const errorMessage = `There was an issue trying to assign roles to ${message.author.tag}
      Roles Intended: ${serverRoles.join(', ')}
      Error: ${error}`;

      Logger.error(errorMessage);
      message.reply('There might have been an issue trying to assign your role. Please try again.');
    }
  }
}

/**
 * Returns an object with a list of roles to assign a user and another object explaining if there's
 * any sort of conflict, such as trying to request roles that would conflict.
 * 
 * @param {string[]} requestedRoles
 * 
 * @returns {{ conflict: {message: string}, roles: string[] }} 
 */
function getRolesToAssignUser(requestedRoles) {
  const rolesForUser = [];

  const overlappingRolesToAssign = getOverlappingRolesToAssign(requestedRoles);
  const nonOverlappingRolesToAssign = getNonOverlappingRolesToAssign(requestedRoles);

  // Copy the contents of overlappingRolesToAssign into the rolesForUser array.
  rolesForUser.push(...overlappingRolesToAssign); 

  let conflict = null;

  /*
  If the size of the nonOverlappingRoles array is greater than 1, that means that a user is trying
  to request multiple roles that aren't allowed allowed to overlap.
  */
  if (nonOverlappingRolesToAssign.length > 1) {
    const errorMessage = "Tried to request multiple roles that aren't allowed to overlap: " + 
    nonOverlappingRolesToAssign.join(', ');

    conflict = {
      message: errorMessage,
    };
  } else {
    // Copy the contents of nonOverlappingRolesToAssign into the rolesForUser array.
    rolesForUser.push(...nonOverlappingRolesToAssign);
  }

  return {
    conflict: conflict,
    roles: rolesForUser,
  }
}

/**
 * Returns an array of roles that are allowed to exist together, such as taking two classes at the
 * same time.
 * 
 * @param {string[]} requestedRoles 
 * @returns {string[]}
 */
function getOverlappingRolesToAssign(requestedRoles) {
  const rolesWithOverlapAllowed = Settings.equalRolesWithOverlapAllowed;

  const rolesRequestedThatAlsoExist = requestedRoles.filter(function (requestedRole) {
    return rolesWithOverlapAllowed.includes(requestedRole);
  });

  return rolesRequestedThatAlsoExist;
}

/**
 * Returns an array of roles that are not allowed to exist together, such as being a Freshman and 
 * Sophomore at the same time.
 * 
 * @param {string[]} requestedRoles 
 * @returns {string[]}
 */
function getNonOverlappingRolesToAssign(requestedRoles) {
  const rolesWithOverlapNotAllowed = Settings.equalRolesWithOverlapNotAllowed;

  const nonOverlappingRolesThatExist = requestedRoles.filter(function (requestedRole) {
    return rolesWithOverlapNotAllowed.includes(requestedRole);
  });

  return nonOverlappingRolesThatExist;
}

module.exports = assignUserRole;