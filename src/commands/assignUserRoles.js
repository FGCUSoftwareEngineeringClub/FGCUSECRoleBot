const Discord = require('discord.js');
const Logger = require('../logging/Logger');
const roles = require('../roles/RolesAggregate');
const rolesWithOverlapNotAllowed = roles.namesOfNonOverlappingRoles;

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
  const rolesToAssignToUser = getRolesToAssignUser(message.member, requestedRoles);

  
  // If there's any sort of conflict, let the user know and stop. Otherwise, assign the roles.
  if (rolesToAssignToUser.conflict) {
    message.reply(rolesToAssignToUser.conflict.message);

    Logger.error(`There was an issue when assigning roles to ${message.author.tag}.
    Roles requested: ${requestedRoles}
    Error Message: ${rolesToAssignToUser.conflict}`);

    return;
  } else {

    /** 
     * Filter the roles in the server to roles that the user should be assigned and roles that 
     * actually do exist in the server and the user doesn't already have.
     */
    const serverRoles = message.guild.roles.filter(function (role) {
      return rolesToAssignToUser.roles.includes(role.name) && 
      !message.member.roles.find(filteringRole => role.name === filteringRole.name);
    });

    const serverRolesAsArray = serverRoles.array();

    try {
      await message.member.addRoles(serverRoles);
      Logger.info(message.author.tag + ' was assigned: ' + serverRolesAsArray.join(', '));
      message.reply('You were assigned: ' + serverRolesAsArray.join(', '));
    } catch (error) {
      const errorMessage = `There was an issue trying to assign roles to ${message.author.tag}
      Roles Intended: ${serverRolesAsArray.join(', ')}
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
 * @param {Discord.GuildMember} user
 * @param {string[]} requestedRoles
 * 
 * @returns {{ conflict: {message: string}, roles: string[] }} 
 */
function getRolesToAssignUser(user, requestedRoles) {
  const rolesForUser = [];

  const overlappingRolesToAssign = getOverlappingRolesToAssign(requestedRoles);
  const nonOverlappingRolesToAssign = getNonOverlappingRolesToAssign(user, requestedRoles);
  const nonOverLappingRolesToAssignNames = nonOverlappingRolesToAssign.length ? nonOverlappingRolesToAssign.reduce((prev, curr) => prev.concat(curr)) : [];
  const nonOverlappingUserRoles = getUserConflictingRoles(user);
  const allRequestedRolesToAssign = overlappingRolesToAssign.concat(nonOverLappingRolesToAssignNames);
  /*
  Copy roles of a user that aren't allowed to overlap so that we can compare them all at once and
  find conflicts.
  */
  // nonOverlappingRolesToAssign.push(...nonOverlappingUserRoles);

  let conflict = null;

  /** @type {string[][]} */
  const conflictingRequestedRoles = [];

  /*
  If the size of a subarray in nonOverlappingRoles is greater than 1, that means that a user is 
  trying to request multiple roles that aren't allowed allowed to overlap.
  */
  for (const nonOverlappingRoleSet of nonOverlappingRolesToAssign) {
    if (nonOverlappingRoleSet.length > 1) {
      conflictingRequestedRoles.push(nonOverlappingRoleSet);
    }
  }

  if (conflictingRequestedRoles.length > 1) {
    const conflictingRequestedRolesError = conflictingRequestedRoles.reduce(function (firstSet, secondSet) {
        const firstSetString = removeDuplicates(firstSet).join(', ');
        const secondSetString = removeDuplicates(secondSet).join(', ');

        if (firstSetString === secondSetString) {
          return `[${firstSetString}], `
        } else {
          return `[${firstSetWithoutDuplicates.join(', ')}], [${secondSetWithoutDuplicates.join(', ')}]`;
        }
    });

    const errorMessage = "Tried to request multiple roles that aren't allowed to overlap: " + conflictingRequestedRolesError

    conflict = {
      message: errorMessage,
    };
  } else {
    // Copy the contents of nonOverlappingRolesToAssign into the rolesForUser array.
    rolesForUser.push(...allRequestedRolesToAssign);
  }

  return {
    conflict: conflict,
    roles: allRequestedRolesToAssign,
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
  const rolesWithOverlapAllowed = roles.namesOfOverlappingRoles;

  const rolesRequestedThatAlsoExist = requestedRoles.filter(function (requestedRole) {
    return rolesWithOverlapAllowed.includes(requestedRole);
  });

  return rolesRequestedThatAlsoExist;
}

/**
 * Returns an array of roles that are not allowed to exist together, such as being a Freshman and 
 * Sophomore at the same time.
 * 
 * @param {Discord.GuildMember} user
 * @param {string[]} requestedRoles 
 * @returns {string[][]} An array of an array of strings, where each subarray represents all the
 * the roles a user should be assigned from a single set.
 */
function getNonOverlappingRolesToAssign(user, requestedRoles) {
  const nonOverlappingRoleSets = roles.nonOverlappingRoleSets;
  const namesOfAllNonOverlappingRoles = roles.namesOfNonOverlappingRoles;

  const requestedRolesThatExist = requestedRoles.filter(function (roleName) {
    return namesOfAllNonOverlappingRoles.includes(roleName);
  });

  /** @typedef {string[][]} */
  const overlappingRolesToAssign = [];

  /**
   * For each set of nonOverlappingRoles, we iterate over all the requestedRoles that already
   * actually exist, and if the set contains that role, we add to an array the roles in that set
   * that a user already has as well as the role that they're requesting in that moment.
   * 
   * The result is overlappingRolesToAssign should be an array of an array of strings (string[][]),
   * and if any subarray in that array has a length greater than one, the user is trying to request
   * roles that are overlapping, or they're requesting a role that would conflict with something 
   * they already have.
   */
  for (const roleSet of nonOverlappingRoleSets) {
    for (const nameOfRequestedRole of requestedRolesThatExist) {
      if (roleSet.contains(nameOfRequestedRole)) {
        const rolesInThisSetOfAUser = getRoleNamesFromRoles(roleSet.findMatchingRoles(user));
        overlappingRolesToAssign.push(rolesInThisSetOfAUser.concat(nameOfRequestedRole))
      }
    }
  }

  return overlappingRolesToAssign;
}

/**
 * Returns a list of conflicting roles that a user already has been assigned.
 * @param {Discord.GuildMember} user 
 * 
 * @returns {string[]} The names of the conflicting roles.
 */
function getUserConflictingRoles(user) {
  const userConflictingRoles =  user.roles.filter(function (userRole) {
    return rolesWithOverlapNotAllowed.includes(userRole.name);
  });

  const namesOfUserConflictingRoles = userConflictingRoles.array().map(function (role) {
    return role.name;
  });

  return namesOfUserConflictingRoles;
}

/**
 * Returns an array with the name of all the roles passed in.
 * @param {Discord.Role[]} roles An array of Role objects.
 */
function getRoleNamesFromRoles(roles) {
  return roles.map(role => role.name);
}

/**
 * Removes duplicate strings from an array, returning just one instance of each element.
 * @param {string[]} array
 */
function removeDuplicates(array) {
  return array.filter(function (element, index, originalArray) {
    return originalArray.indexOf(element) == index;
  });
}

module.exports = assignUserRole;