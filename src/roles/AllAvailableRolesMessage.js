const roles = require('./RolesAggregate');

roles.nonOverlappingRoleSets;

let allRolesMessage = `Non-Overlapping Roles (Only one from each category.): \n`;

/**
 * Formats the message with all available roles. This also indents the message, where the name of 
 * each set is indented by one level, and the roles of that set are indented by another level, hence
 * the various spaces below.
 */
for (const set of roles.nonOverlappingRoleSets) {
  allRolesMessage += `  ${set.nameOfSet}:
    ${set.getRoles().join('\n    ')}\n\n`
} 

allRolesMessage += 'Overlapping Roles (Request as many of these as you want!)\n  ';
allRolesMessage += roles.namesOfOverlappingRoles.join('\n  ');

module.exports = allRolesMessage;