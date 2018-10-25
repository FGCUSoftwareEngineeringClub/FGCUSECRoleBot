const roles = require('./RolesAggregate');

let allRolesMessage = `Non-Overlapping Roles (Only one from each category.): \n`;

/**
 * Formats the message with all available roles. This also indents the message, where the name of 
 * each set is indented by one level, and the roles of that set are indented by another level, hence
 * the various spaces below.
 */
if (roles.namesOfNonOverlappingRoles.length > 0) {
  for (const set of roles.nonOverlappingRoleSets) {
    allRolesMessage += `  ${set.nameOfSet}:
      ${set.getRoles().join('\n    ')}\n\n`
  } 
}

if (roles.namesOfOverlappingRoles.length > 0) {
  allRolesMessage += 'Overlapping Roles (Request as many of these as you want!)\n  ';
  allRolesMessage += roles.namesOfOverlappingRoles.join('\n  ');
}

if (roles.namesOfAllRoles.length === 0) {
  allRolesMessage = "No roles available.";
}

module.exports = allRolesMessage;