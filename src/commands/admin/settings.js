//@ts-check
const Commando = require('discord.js-commando');
const {
  settingsKeys
} = require('../../settings/SettingsProvider');
const Discord = require('discord.js');

class SettingsCommand extends Commando.Command {

  constructor(client) {
    super(client, {
      name: 'settings',
      group: 'admin',
      memberName: 'managesettings',
      guildOnly: true,
      description: 'Modify the settings of the current server.'
    });
  }

  /**
   * 
   * @param {Commando.CommandMessage} message 
   */
  hasPermission(message) {
    // Use officer role.
    const isUserAnOfficer = message.member.roles.find((role) => role.name === "Club Officers");
    return !!isUserAnOfficer || message.member.permissions.has('ADMINISTRATOR');
  }

  /**
   * @param {Commando.CommandMessage} message
   * @param {string} args 
   */
  async run(message, args) {
    const client = message.client;
    const messageArguments = args.split(' ');

    if (args.length === 0 || messageArguments.length === 0) {
      return message.reply(`Use --list for a list of settings, --remove to remove a setting, or the name of a key and the new value if you want to set a setting.`);
    }

    switch (messageArguments[0]) {
      case '--list':
        return listServerSettings(message, messageArguments);
      case '--listkeys':
        return listSettingKeys(message, messageArguments);
      case '--remove':
        return removeServerSetting(message, messageArguments);
    }

    switch (messageArguments.length) {
      case 2:
        return setSettingFromKey(message, messageArguments);
      case 1:
        return getValueOfSetting(message, messageArguments);
    }
  }
}

/**
 * Lists all the setting that have been set in a server.
 * @param {Commando.CommandMessage} message 
 * @param {string[]} messageArguments 
 */
function listServerSettings(message, messageArguments) {
  const settingsAndValues = [];
  for (const key of settingsKeys) {
    const valueOfSetting = message.client.settings.get(key, null);
    if (valueOfSetting) settingsAndValues.push(`${key}: ${valueOfSetting}`);
  }

  if (settingsAndValues.length > 0) {
    return message.reply(settingsAndValues.join('\n'), {code: true});
  } else {
    return message.reply(`No settings have been set in this server. Use --listkeys to see options for settings.`);
  }
}

/**
 * Removes a setting from a server given the key.
 * @param {Commando.CommandMessage} message 
 * @param {string[]} messageArguments 
 */
function removeServerSetting(message, messageArguments) {
  const result = message.client.settings.remove(messageArguments[1]);
  return message.reply(`Setting value ${messageArguments[1]} removed with result ${result}`);
}

/**
 * Sets a setting to a new value given a key.
 * @param {Commando.CommandMessage} message 
 * @param {string[]} messageArguments 
 */
function setSettingFromKey(message, messageArguments) {
  const [settingKey, newSetting] = messageArguments;
  if (settingsKeys.includes(settingKey)) {
    message.client.settings.set(settingKey, newSetting);
    return message.reply(`${settingKey} was assigned '${newSetting}'`);
  } else {
    return message.reply(`Only preset settings can be set or modified. Use --listkeys to see a list of possible options.`);
  }
}

/**
 * Returns the value of a setting in a server.
 * @param {Commando.CommandMessage} message 
 * @param {string[]} messageArguments 
 */
function getValueOfSetting(message, messageArguments) {
  const settingValue = message.client.settings.get(messageArguments[1], null);
  if (settingValue) {
    return message.reply(`Value for ${messageArguments[0]} is ${settingValue}`);
  } else {
    return message.reply(`There is no value for key ${messageArguments[0]}`);
  }
}

/**
 * Lists all keys available for settings to be assigned to.
 * @param {Commando.CommandMessage} message 
 * @param {string[]} messageArguments 
 */
function listSettingKeys(message, messageArguments) {
  return message.reply(settingsKeys.join('\n'), {code: true});
}

module.exports = SettingsCommand;