const NonOverlappingRoleSet = require('./NonOverlappingRoleSet');

/**
 * Since people can't be in certain multiple groups at the same time, we have an array of roles 
 * where it makes senseto have an overlap and an array where it doesn't make sense to have an overlap.
 * 
 * You can't be a Freshman and a Senior at the same time, for instance, whereas someone could take
 * Assembly and Object Oriented Programming at the same time. This is currently not an exhaustive 
 * list of classes.
 * 
 * For more on how roles that aren't allowed to overlap are handled, see:
 * @see {NonOverlappingRoleSet}
 */
const STUDENT_YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
const MAJORS = ['Soft. Eng. Major', 'STEM Major', 'Non-STEM Major', 'CIS Major'];
/** @type {string[]} */
const equalRolesWithOverlapAllowed = [];

const studentYearSet = new NonOverlappingRoleSet('Student Years', STUDENT_YEARS);
const studentMajorSet = new NonOverlappingRoleSet('Majors', MAJORS);
const equalRolesWithOverlapNotAllowed = [
  studentYearSet,
  studentMajorSet,
];

/**
 * An array where each item is an array of the names of the roles for that set.
 */
const rolesOfEachSet = equalRolesWithOverlapNotAllowed.map(roleSet => roleSet.getRoles());

/**
 * The names of all roles that shouldn't be allowed to overlap by adding all the roles
 */
const namesOfAllNonOverlappingRoles = rolesOfEachSet.reduce(function (firstSet, secondSet) {
  return firstSet.concat(secondSet);
});

/**
 * A list of the names of all roles that should have the same level of permissions by default. 
 */
let allEqualRoles = namesOfAllNonOverlappingRoles.concat(equalRolesWithOverlapAllowed);

// Remove duplicate names from the list in case there are any by filtering out names that have already occurred.
allEqualRoles = allEqualRoles.filter(function (role, index, allRolesArray) {
  return allRolesArray.indexOf(role) == index;
});

const roles = {
  namesOfAllRoles: allEqualRoles,
  namesOfNonOverlappingRoles: namesOfAllNonOverlappingRoles,
  namesOfOverlappingRoles: equalRolesWithOverlapAllowed,
  nonOverlappingRoleSets: equalRolesWithOverlapNotAllowed,

  getNonOverlappingSetFromName: getNonOverlappingSetFromName
};

/**
 * Returns the NonOverlappingRoleSet containing the given role.
 * @param {string} roleName The name of the role to search for.
 * @returns {NonOverlappingRoleSet | undefined}
 */
function getNonOverlappingSetFromName(roleName) {
  for (const roleSet of equalRolesWithOverlapNotAllowed) {
    if (roleSet.contains(roleName)) {
      return roleSet;
    }
  }
  return undefined;
}

module.exports = roles;