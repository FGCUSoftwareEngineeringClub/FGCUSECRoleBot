/**
 * Import environment variables. Instead of having strings, especially hardcoded ones in our files,
 *  we put them in our .env file for privacy and so they can be easily changed.
 * 
 * Look at the .example.env file for an example of what variables are used.
 * 
 * To access an environment variable, use 'process.env.key', where key is the name of the variable.
 */
const environmentVariables = require('dotenv').config();

/**
 * Since people can take multiple classes at once, we have an array of classes where it makes sense
 * to have an overlap an classes where it doesn't make sense to have one.
 * 
 * You can't be a Freshman and a Senior at the same time, for instance, whereas someone could take
 * Assembly and Object Oriented Programming at the same time. This is currently not an exhaustive 
 * list of classes.
 */
const equalRolesWithOverlapNotAllowed = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Soft. Eng. Major', 'STEM Major', 'Non-STEM Major', 'CIS Major'];
const equalRolesWithOverlapAllowed = ['COP1500', 'PHY2041C'];

/**
 * A list of all roles that should have the same level of permissions by default. 
 * 
 * The Array.slice() command below creates a copy of the original array instead of potentially 
 * combining the two original arrays.
 */
let allEqualRoles = equalRolesWithOverlapNotAllowed.slice().concat(equalRolesWithOverlapAllowed.slice());

// Remove duplicate names from the list in case there are any by filtering out names that have already occurred.
allEqualRoles = allEqualRoles.filter(function (role, index, allRolesArray) {
  return allRolesArray.indexOf(role) == index;
})

/**
 * A list of permissions that roles that should be equal in authority should have. For a list of 
 * these permissions, see https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
 */
const equalRolePermissions = [
  'CREATE_INSTANT_INVITE',
  'VIEW_CHANNEL',
  'SEND_MESSAGES',
  'READ_MESSAGE_HISTORY',
  'USE_EXTERNAL_EMOJIS',
  'ADD_REACTIONS',
  'CONNECT',
  'SPEAK',
  'USE_VAD'
];

const settings = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  COMMAND_PREFIX: process.env.COMMAND_PREFIX,
  equalRolesWithOverlapAllowed: equalRolesWithOverlapAllowed,
  equalRolesWithOverlapNotAllowed: equalRolesWithOverlapNotAllowed,
  allEqualRoles: allEqualRoles,
  equalRolePermissions: equalRolePermissions
};

// Export these settings for use in other files.
module.exports = settings;