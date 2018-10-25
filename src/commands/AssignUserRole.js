//@ts-check
const Discord = require('discord.js');
const Logger = require('../logging/Logger');
const roles = require('../roles/RolesAggregate');
const NonOverlappingRoleSet = require('../roles/NonOverlappingRoleSet');
const allRolesMessage = require('../roles/AllAvailableRolesMessage');

/**
 * Assigns roles to a user. Valid roles that a user can request should be listed in Settings. A user
 * should be able to request multiple roles at once by separated them with a comma.
 * 
 * Special thanks to Jeremy R. Martin.
 * 
 * @param {Discord.Message} message 
 */
async function assignUserRole(message) {
  /**
   * Get all the arguments a user adds to a message by returning the message starting after the
   * first space, or after the initial command. If no commands are supplied then the index is -1, 
   * however.
   * 
   * Example: "!!role Software Engineering" would return "Software Engineering"
   */
  const messageWithoutCommand = message.content.substring(message.content.indexOf(' '));

  /** Update user member in case their data changes. */
  message.member = await message.guild.fetchMember(message.member, false); 

  /**
   * Separates each of the roles requested and removes extra spaces around them.
   */
  const requestedRoles = messageWithoutCommand.split(',').map(word => word.trim());
  if (requestedRoles.length === 0 || message.content.indexOf(' ') == -1) {
    message.channel.send(allRolesMessage, {code: true});
    return;
  }
  const overlappingRolesToAssign = getOverlappingRolesThatExist(requestedRoles);
  const nonOverlappingRolesToAssignNames = getNonOverlappingRolesThatExist(requestedRoles);

  /**
   * Create a map where the key is the set that the nonoverlapping role belongs to and the value is
   * the name of the role to assign. If a user requests multiple roles from the same set, they'll
   * only get the last one requested.
   * @type {Map<NonOverlappingRoleSet, string>}
   */
  const nonOverlappingRolesToAssignMap = new Map();
  await populateMapWithUserPreexistingRoles(message.member, nonOverlappingRolesToAssignMap);

  for (const nonOverlappingRequestedRole of nonOverlappingRolesToAssignNames) {
    const theSetThisRoleBelongsTo = roles.getNonOverlappingSetFromName(nonOverlappingRequestedRole);
    nonOverlappingRolesToAssignMap.set(theSetThisRoleBelongsTo, nonOverlappingRequestedRole);
  }

  const nonOverlappingRolesToAssign = Array.from(nonOverlappingRolesToAssignMap.values());
  const allRolesToAssignUser = nonOverlappingRolesToAssign.concat(overlappingRolesToAssign);
  const serverRolesToAssign = getServerRolesFromNames(message.guild, allRolesToAssignUser);

  const rolesTheUserCanReceive = getRolesUserDoesNotHave(message.member, serverRolesToAssign);
  const namesOfServerRolesAssigned = rolesTheUserCanReceive.map(role => role.name);

  if (rolesTheUserCanReceive.length === 0) {
    message.reply('No roles could be assigned because you likely already have them, or they don\'t exist.');

    const loggingMessage = message.author.tag + ' tried to request roles that doesn\'t exist or they already have: ' + requestedRoles.join(', ');
    Logger.info(loggingMessage);
  } else {
    await message.member.addRoles(rolesTheUserCanReceive);

    message.reply(`You were assigned: ${namesOfServerRolesAssigned.join(', ')}`);
    
    const loggingMessage = `User ${message.author.tag} ${message.member.nickname || ''} was assigned ${namesOfServerRolesAssigned.join(', ')}`;
    Logger.info(loggingMessage);
  }
 }



/**
 * Returns the roles that are allowed to overlap that the user should be assigned.
 * @param {string[]} requestedRoles An array of roles that the user requested.
 */
function getOverlappingRolesThatExist(requestedRoles) {
  const overlappingRolesToAssign = requestedRoles.filter(function (requestedRole) {
    return roles.namesOfOverlappingRoles.includes(requestedRole);
  });

  return removeDuplicates(overlappingRolesToAssign);
}

/**
 * Returns the roles that are not allowed to overlap that the user should be assigned.
 * @param {string[]} requestedRoles An array of roles that the user requested.
 */
function getNonOverlappingRolesThatExist(requestedRoles) {
  const nonOverlappingRolesToAssign = requestedRoles.filter(function (requestedRole) {
    return roles.namesOfNonOverlappingRoles.includes(requestedRole);
  });

  return removeDuplicates(nonOverlappingRolesToAssign);
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

/**
 * Returns a list of server roles given their names.
 * @param {Discord.Guild} server The server to search for roles.
 * @param {string[]} names A list of names that the roles should have.
 */
function getServerRolesFromNames(server, names) {
  const serverRolesRequestedCollection = server.roles.filter(function (serverRole) {
    return names.includes(serverRole.name);
  });

  return serverRolesRequestedCollection.array();
}

/**
 * Returns an array of roles that a user does not already have.
 * @param {Discord.GuildMember} user The user whose roles should be checked.
 * @param {Discord.Role[]} rolesToCheck A list of roles to check against.
 */
function getRolesUserDoesNotHave(user, rolesToCheck) {
  const rolesTheUserDoesNotHave = rolesToCheck.filter(function (role) {
    return !user.roles.has(role.id);
  });

  return rolesTheUserDoesNotHave;
}

/**
 * Fills a map with a user's preexisting non-overlapping roles and removes roles that do conflict.
 * @param {Discord.GuildMember} user The user whose roles should be checked.
 * @param {Map<NonOverlappingRoleSet, string>} map The map to place the results into.
 */
async function populateMapWithUserPreexistingRoles(user, map) {
  const userRolesAsStrings = user.roles.map(function (role) {
    return role.name;
  });
  const nonOverlappingRolesOfAUser = getNonOverlappingRolesThatExist(userRolesAsStrings);

  for (const userNonOverlappingRoleName of nonOverlappingRolesOfAUser) {
    const theSetOfThisRole = roles.getNonOverlappingSetFromName(userNonOverlappingRoleName);

    /**
     * If the user already has AT LEAST one role in this conflicting set, then remove all 
     * roles of this set.
     */
    if (user.roles.array().some(role => theSetOfThisRole.getRoles().includes(role.name))) {
      const serverRolesFromNames = getServerRolesFromNames(user.guild, theSetOfThisRole.getRoles());
      await user.removeRoles(serverRolesFromNames);
      Logger.info(`Removed roles ${theSetOfThisRole.getRoles().join(', ')} from ${user.user.tag} ${user.nickname || ''}`);
    }
    map.set(theSetOfThisRole, userNonOverlappingRoleName);
  }
}

module.exports = assignUserRole;