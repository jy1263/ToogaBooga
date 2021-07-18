import {GuildChannel, Message, Role, User} from "discord.js";
import {MiscUtilities} from "./MiscUtilities";
import {FetchGetRequestUtilities} from "./FetchGetRequestUtilities";

export namespace ParseUtilities {
    /**
     * Parses a role from a message object.
     * @param {Message} msg The message.
     * @return {Role | null} The role, if any; null otherwise.
     */
    export function parseRole(msg: Message): Role | null {
        if (!msg.guild) return null;
        if (MiscUtilities.isSnowflake(msg.content))
            return FetchGetRequestUtilities.getCachedRole(msg.guild, msg.content);

        return msg.mentions.roles.first() ?? null;
    }

    /**
     * Parses a channel from a message object.
     * @param {Message} msg The message.
     * @return {T | null} The channel, if any; null otherwise.
     */
    export function parseChannel<T extends GuildChannel>(msg: Message): T | null {
        if (!msg.guild) return null;
        if (MiscUtilities.isSnowflake(msg.content))
            return FetchGetRequestUtilities.getCachedChannel<T>(msg.guild, msg.content);

        return msg.mentions.channels.first() as T ?? null;
    }

    export function parseUser(msg: Message): User | null {
        if (MiscUtilities.isSnowflake(msg.content))
            return FetchGetRequestUtilities.getCachedUser(msg.content);

        return msg.mentions.users.first() ?? null;
    }
}