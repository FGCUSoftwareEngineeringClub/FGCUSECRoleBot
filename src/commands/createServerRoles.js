const Settings = require('../settings');
const Discord = require('discord.js');
const Logger = require('../logging/Logger');
const roles = require('../roles/RolesAggregate');

/**
 * For each server this bot is connected to, we check if the roles in settings exist for this
 * server. If the role doesn't exist, create it.
 * @param {Discord.Client} discordClient 
 */
function createServerRoles(discordClient) {
  discordClient.guilds.forEach(async function (guild) {
    const rolesWithEqualPermissions = roles.namesOfAllRoles;
    const allRolesOfCurrentGuild = guild.roles.array();
    
    rolesWithEqualPermissions.forEach(async function (nameOfRole) {
      /** Checks if role exists in server. This returns the role it does exist and returns
       * 'undefined' if doesn't exist, which is why we check if the role is false OR undefined.
       */
      const doesRoleExistInThisServer = allRolesOfCurrentGuild.find(function (currentRole) {
        return currentRole.name === nameOfRole;
      });

      if (doesRoleExistInThisServer === false || doesRoleExistInThisServer === undefined) {
        const newRoleToCreate = await guild.createRole({
          name: nameOfRole,
          mentionable: true,
          permissions: Settings.equalRolePermissions,
        });

        Logger.info({
          server: guild,
          message: 'Created role ' + newRoleToCreate.name + ' in server ' + guild.name + '.'
        }); 
      }
    });
  });
}

module.exports = createServerRoles;