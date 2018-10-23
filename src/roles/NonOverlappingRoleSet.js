const Discord = require('discord.js');

/**
 * Represents a set of roles that shouldn't be allowed to exist together at the same time, such as
 * having the Sophomore and Senior role at the same time. 
 */
class NonOverlappingRoleSet {
  /**
   *
   * @param {string[]} roles
   */
  constructor(roles) {
    this.roles = roles;
  }

  getRoles() {
    return this.roles;
  }

  /**
   * Returns true if this set contains the given role.
   * @param {string} nameOfRole The name of the role to check against the set.
   */
  contains(nameOfRole) {
    return this.roles.includes(nameOfRole);
  }

  /**
   * Compares the roles of a user to the roles in this set and returns the roles of this set that
   * a user also has.
   * @param {Discord.GuildMember} user
   */
  findMatchingRoles(user) {
    const userRoles = user.roles.array();
    const rolesOfThisSet = this.roles;
    const rolesInThisSetThatUserHas = userRoles.filter(function (role) {
      return rolesOfThisSet.includes(role.name);
    });

    return rolesInThisSetThatUserHas;
  }
}

module.exports = NonOverlappingRoleSet;