/**
 * This file holes access to settings that are considered "global," including bot tokens, roles for
 * the bot to manage, bot owners, and other things that aren't necessarily specific to a certain
 * Discord server.
 */

/**
 * Import environment variables. Instead of having strings, especially hardcoded ones in our files,
 *  we put them in our .env file for privacy and so they can be easily changed.
 *
 * Look at the .example.env file for an example of what variables are used.
 *
 * To access an environment variable, use 'process.env.key', where key is the name of the variable.
 */
const environmentVariables = require('dotenv').config();
const roles = require('./roles/RolesAggregate'); // Import data about server roles.

/**
 * A list of permissions that roles that should be equal in authority should have. For a list of
 * these permissions, see the link below.
 * @see https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
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
  'USE_VAD',
];

const botOwners = process.env.BOT_OWNERS.split(' ');

const settings = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  COMMAND_PREFIX: process.env.COMMAND_PREFIX,
  DATABASE_NAME: process.env.DATABASE_NAME,

  equalRolePermissions: equalRolePermissions,
  roles: roles,
  botOwners: botOwners,
  ROOT_DIRECTORY: __dirname,
};

// Export these settings for use in other files.
module.exports = settings;
