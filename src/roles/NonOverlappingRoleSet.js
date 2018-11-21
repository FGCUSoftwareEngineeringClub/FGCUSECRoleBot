const Discord = require('discord.js');

/**
 * Represents a set of roles that shouldn't be allowed to exist together at the same time, such as
 * having the Sophomore and Senior role at the same time.
 */
class NonOverlappingRoleSet {
  /**
   *
   * @param {string} nameOfSet
   * @param {string[]} roles
   */
  constructor(nameOfSet, roles) {
    this.nameOfSet = nameOfSet;
    /** @private */
    this._roles = roles;
  }

  /**
   * Returns the given name for this set as set in the constructor.
   * @return {string}
   */
  getNameOfSet() {
    return this.nameOfSet;
  }

  /**
   * Returns the roles of this set.
   * @return {string[]}
   */
  getRoles() {
    return this._roles;
  }

  /**
   * Returns true if this set contains the given role.
   * @param {string} nameOfRole The name of the role to check against the set.
   * @return {boolean}
   */
  contains(nameOfRole) {
    return this._roles.includes(nameOfRole);
  }

  /**
   * Compares the roles of a user to the roles in this set and returns the roles of this set that
   * a user also has.
   * @param {Discord.GuildMember} user
   * @return {Discord.Role[]}
   */
  findMatchingRoles(user) {
    const userRoles = user.roles.array();
    const rolesOfThisSet = this._roles;
    const rolesInThisSetThatUserHas = userRoles.filter(function(role) {
      return rolesOfThisSet.includes(role.name);
    });

    return rolesInThisSetThatUserHas;
  }
}

module.exports = NonOverlappingRoleSet;
