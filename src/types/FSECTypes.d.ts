import Commando from 'discord.js-commando';
import Discord from 'discord.js';

type MessageSplitDisabled = {
  split?: undefined | false | null
}

type MessageSplitEnabled = {
  split: true | SplitOptions
}

type MessageOptionsSplitDisabled = MessageOptions & MessageSplitDisabled;
type MessageAdditionsSplitDisabled = MessageAdditions & MessageSplitDisabled
declare module "discord.js" {

  interface Guild {
    settings: Commando.GuildSettingsHelper
  }

  interface Message {
    public reply(content?: StringResolvable, options?: MessageOptions & MessageSplitDisabled): Promise<Message>;
    public reply(content?: StringResolvable, options?: MessageOptions & MessageSplitEnabled): Promise<Message | Message[]>;
  }

  interface TextChannel extends PartialTextBasedChannelFields {
    send(content?: StringResolvable, options?: (MessageOptions & MessageSplitDisabled) | RichEmbed | Attachment): Promise<Message>;
    send(content?: StringResolvable, options?: (MessageOptions & MessageSplitEnabled) | RichEmbed | Attachment): Promise<Message | Message[]>;
    send(content?: StringResolvable, options?: MessageOptions & MessageSplitDisabled): Promise<Message>;
		send(options?: (MessageOptions & MessageSplitEnabled) | APIMessage): Promise<Message | Message[]>;

  }
}

declare module "discord.js-commando" {
  interface CommandMessage {
    public reply(content?: StringResolvable, options?: MessageOptions & MessageSplitDisabled): Promise<Message>;
    public reply(content?: StringResolvable, options?: MessageOptions & MessageSplitEnabled): Promise<Message | Message[]>;
  }
}