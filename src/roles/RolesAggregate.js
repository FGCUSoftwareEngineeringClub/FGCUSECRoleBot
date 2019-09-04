const NonOverlappingRoleSet = require('./NonOverlappingRoleSet');

/**
 * Since people can't be in certain multiple groups at the same time, we have an array of roles
 * where it makes senseto have an overlap and an array where it doesn't make sense to have an
 * overlap.
 *
 * You can't be a Freshman and a Senior at the same time, for instance, whereas someone could take
 * Assembly and Object Oriented Programming at the same time. This is currently not an exhaustive
 * list of classes.
 *
 * For more on how roles that aren't allowed to overlap are handled, see:
 * @see {NonOverlappingRoleSet}
 */
const STUDENT_YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];
const STUDENT_YEARS_EMOJIS = ['🐣', '🐥', '🐤', '🐔', '🍗'];
const MAJORS = ['Soft. Eng. Major', 'STEM Major', 'Non-STEM Major', 'CIS Major'];
const MAJORS_EMOJIS = ['💻', '🔬', '📚', '⌨'];

/** @type {string[]} */
const equalRolesWithOverlapAllowed = [];
const overlappingRoleEmojis = [];
const overlappingRolesWithEmojis = equalRolesWithOverlapAllowed
  .map((roleName, index) => [roleName, overlappingRoleEmojis[index]]);

const studentYearSet =
  new NonOverlappingRoleSet('Student Years', STUDENT_YEARS, STUDENT_YEARS_EMOJIS);
const studentMajorSet = new NonOverlappingRoleSet('Majors', MAJORS, MAJORS_EMOJIS);
const equalRolesWithOverlapNotAllowed = [
  studentYearSet,
  studentMajorSet,
];

/**
 * An array where each item is an array of the names of the roles for that set.
 */
const rolesOfEachSet = equalRolesWithOverlapNotAllowed.map((roleSet) => roleSet.getRoles());

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

/*
 * Remove duplicate names from the list in case there are any by filtering out names that have
 * already occurred.
 */
allEqualRoles = allEqualRoles.filter(function (role, index, allRolesArray) {
  return allRolesArray.indexOf(role) == index;
});

const roles = {
  namesOfAllRoles: allEqualRoles,
  namesOfNonOverlappingRoles: namesOfAllNonOverlappingRoles,
  namesOfOverlappingRoles: equalRolesWithOverlapAllowed,
  nonOverlappingRoleSets: equalRolesWithOverlapNotAllowed,
  overlappingRolesWithEmojis: overlappingRolesWithEmojis,

  getNonOverlappingSetFromName: getNonOverlappingSetFromName,
  doesRoleExist: doesRoleExist,
  doesOverlappingRoleExist: doesOverlappingRoleExist,
};

/**
 * Returns the NonOverlappingRoleSet containing the given role.
 * @param {string} roleName The name of the role to search for.
 * @param {boolean | undefined} caseInsensitive Whether or not case matters when comparing role
 *  names.
 * @return {NonOverlappingRoleSet | null}
 */
function getNonOverlappingSetFromName(roleName, caseInsensitive) {
  for (const roleSet of equalRolesWithOverlapNotAllowed) {
    if (caseInsensitive) {
      const namesOfRolesInThisSetLowercase =
        roleSet.getRoles().map((roleName) => roleName.toLowerCase());

      const doesRoleSetContainGivenName =
        namesOfRolesInThisSetLowercase.includes(roleName.toLowerCase());

      if (doesRoleSetContainGivenName) return roleSet;
    }

    if (roleSet.contains(roleName)) {
      return roleSet;
    }
  }
  return null;
}

/**
 * Returns true if a given role exists, regardless of whether or not they're overlapping.
 * @param {string} role A string that's a role name to look for.
 * @param {boolean | undefined} caseInsensitive Whether case matters in this search.
 * @return {boolean}
 */
function doesRoleExist(role, caseInsensitive) {
  if (caseInsensitive) {
    const allRolesAsLowercase = allEqualRoles.map((role) => role.toLowerCase());
    return allRolesAsLowercase.includes(role.toLowerCase());
  }

  return allEqualRoles.includes(role);
}

/**
 * Returns true if the given role exists and is allowed to overlap with other roles.
 * @param {string} role The role name to search for.
 * @param {boolean | undefined} caseInsensitive Whether or not case matters in this search.
 * @return {boolean}
 */
function doesOverlappingRoleExist(role, caseInsensitive) {
  if (caseInsensitive) {
    const allOverlappingRolesAsLowercase =
      equalRolesWithOverlapAllowed.map((role) => role.toLowerCase());
    return allOverlappingRolesAsLowercase.includes(role.toLowerCase);
  }

  return equalRolesWithOverlapAllowed.includes(role);
}

module.exports = roles;
