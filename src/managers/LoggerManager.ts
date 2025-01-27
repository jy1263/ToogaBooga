import {Collection, GuildMember, User} from "discord.js";
import {MongoManager} from "./MongoManager";
import {Filter, UpdateFilter} from "mongodb";
import {IGuildInfo, IUserInfo} from "../definitions";
import {MAPPED_AFK_CHECK_REACTIONS} from "../constants/dungeons/MappedAfkCheckReactions";
import {DungeonUtilities} from "../utilities/DungeonUtilities";

export namespace LoggerManager {
    export enum RunResult {
        Complete = "Completed",
        Failed = "Failed",
        Assist = "Assisted"
    }

    const KEY_IDS_TO_STORE: string[] = [
        "VIAL_OF_PURE_DARKNESS",
        "SHIELD_RUNE",
        "SWORD_RUNE",
        "HELM_RUNE",
        "LOST_HALLS_KEY",
        "NEST_KEY",
        "SHATTERS_KEY",
        "FUNGAL_CAVERN_KEY"
    ];

    export type DungeonLedType = Collection<string, { completed: number; failed: number; assisted: number; }>;
    export type DungeonRunType = Collection<string, { completed: number; failed: number; }>;

    interface IUserStats {
        /**
         * The keys that were used. The key for this collection is the guild ID; the value is a collection where the
         * key is the key name (not ID) and the value is the number popped.
         *
         * @type {Collection<string, Collection<string, number>>}
         */
        keyUse: Collection<string, Collection<string, number>>;

        /**
         * The dungeons that this person did. The key for this collection is the guild ID; the value is a collection
         * where the key is the dungeon name (not ID) and the value is the number completed/failed.
         */
        dungeonRuns: Collection<string, DungeonRunType>;

        /**
         * The dungeons that this person led. The key for this collection is the guild ID; the value is a collection
         * where the key is the dungeon name (not ID) and the value is the number completed/failed/assisted.
         */
        dungeonsLed: Collection<string, DungeonLedType>;
    }

    /**
     * Gets the dungeon ID to log this dungeon as. This is useful if a custom dungeon specified that logging should
     * be done with a base dungeon.
     * @param {IGuildInfo} guildDoc The guild document.
     * @param {string} origDungeonId The original dungeon ID.
     * @return {string} The dungeon ID to log as.
     * @private
     */
    function getDungeonIdToLog(guildDoc: IGuildInfo, origDungeonId: string): string | null {
        if (!DungeonUtilities.isCustomDungeon(origDungeonId))
            return origDungeonId;
        const dgnObj = guildDoc.properties.customDungeons.find(x => x.codeName === origDungeonId);
        return dgnObj?.codeName ?? null;
    }

    /**
     * Updates the user document with the specified log ID and the amount.
     * @param {GuildMember} member The member.
     * @param {string} id The ID, represented by the `key` property.
     * @param {number} amt The amount to log.
     * @param {IUserInfo} [userDoc] The user document, if any.
     * @private
     */
    async function internalUpdateLoggedInfo(member: GuildMember, id: string, amt: number,
                                            userDoc?: IUserInfo): Promise<void> {
        const userDocToUse = userDoc ?? await MongoManager.getOrCreateUserDoc(member.id);
        if (userDocToUse.discordId !== member.id)
            return;

        let filterQuery: Filter<IUserInfo>;
        let updateQuery: UpdateFilter<IUserInfo>;
        if (userDocToUse.loggedInfo.some(x => x.key === id)) {
            filterQuery = {
                discordId: member.id,
                "loggedInfo.key": id
            };
            updateQuery = {
                $inc: {
                    "loggedInfo.$.value": amt
                }
            };
        }
        else {
            filterQuery = {discordId: member.id};
            updateQuery = {
                $push: {
                    loggedInfo: {
                        key: id,
                        value: amt
                    }
                }
            };
        }
        await MongoManager.getUserCollection().updateOne(filterQuery, updateQuery);
    }

    /**
     * Logs a key use into the user document. This will also give the user the points, if any, for this key log.
     * @param {GuildMember} member The member.
     * @param {string | null} keyId The key ID, if any.
     * @param {number} amt The number of the specified key to add.
     */
    export async function logKeyUse(member: GuildMember, keyId: string, amt: number): Promise<void> {
        // Format:      K:GUILD_ID:KEY_ID:USE     For runes, vials, "bigger" keys.
        //              K:GUILD_ID:GENERAL:USE            For anything else.
        let dbKeyId: string;
        if (KEY_IDS_TO_STORE.includes(keyId))
            dbKeyId = `K:${member.guild.id}:${keyId}:USE`;
        else
            dbKeyId = `K:${member.guild.id}:GENERAL:USE`;

        const [guildDoc, userDoc] = await Promise.all([
            await MongoManager.getOrCreateGuildDoc(member.guild.id, true),
            await MongoManager.getOrCreateUserDoc(member.id)
        ]);
        await internalUpdateLoggedInfo(member, dbKeyId, amt, userDoc);

        // Points system
        // Recall that the {key = reaction ID (i.e. the key ID), value = points}.
        const ptsForReact = guildDoc.properties.reactionPoints.find(x => x.key === keyId);
        if (!ptsForReact)
            return;
        await logPoints(member, ptsForReact.value * amt);
    }

    /**
     * Logs a dungeon run into the user document.
     * @param {GuildMember} member The member.
     * @param {string} dungeonId The dungeon ID.
     * @param {boolean} completed Whether the dungeon was completed.
     * @param {number} [amt] The number of this dungeon that was either completed or failed.
     */
    export async function logDungeonRun(member: GuildMember, dungeonId: string, completed: boolean,
                                        amt: number = 1): Promise<void> {
        // Format:      R:GUILD_ID:DUNGEON_ID:COMPLETED(1/0)
        const dgnId = getDungeonIdToLog(await MongoManager.getOrCreateGuildDoc(member.guild, true), dungeonId);
        if (!dgnId)
            return;
        await internalUpdateLoggedInfo(member, `R:${member.guild.id}:${dgnId}:${completed ? 1 : 0}`, amt);
    }

    /**
     * Logs the result of a dungeon raid.
     * @param {GuildMember} member The member.
     * @param {string} dungeonId The dungeon ID.
     * @param {RunResult} result The result of the raid.
     * @param {number} [amt] The number of this dungeon, with the specified result, that was done.
     */
    export async function logDungeonLead(member: GuildMember, dungeonId: string, result: RunResult,
                                         amt: number = 1): Promise<void> {
        // Format:      L:GUILD_ID:DUNGEON_ID:RESULT
        const dgnId = getDungeonIdToLog(await MongoManager.getOrCreateGuildDoc(member.guild, true), dungeonId);
        if (!dgnId)
            return;
        await internalUpdateLoggedInfo(member, `L:${member.guild.id}:${dgnId}:${result}`, amt);
    }

    /**
     * Logs points for a certain person.
     * @param {GuildMember} member The member.
     * @param {number} points The points to log.
     */
    export async function logPoints(member: GuildMember, points: number): Promise<void> {
        // Format:      P:GUILD_ID:POINTS
        await internalUpdateLoggedInfo(member, `P:${member.guild.id}`, points);
    }

    /**
     * Gets the number of points that this person has.
     * @param {GuildMember} member The guild member.
     * @returns {Promise<number>} The number of points.
     */
    export async function getPoints(member: GuildMember): Promise<number> {
        const doc = await MongoManager.getUserCollection().findOne({
            discordId: member.id
        });

        return doc?.loggedInfo.find(x => x.key === `P:${member.guild.id}`)?.value ?? 0;
    }

    /**
     * Gets all completed dungeons.
     * @param {IUserInfo} memberDoc The member document.
     * @param {string} guildId The guild ID.
     * @return {Collection<string, number>} The collection containing the completed dungeons (the IDs, specifically)
     * as the key and the number of completions as the value.
     */
    export function getCompletedDungeons(memberDoc: IUserInfo, guildId: string): Collection<string, number> {
        const res = new Collection<string, number>();
        const data = memberDoc.loggedInfo.filter(x => x.key.startsWith(`R:${guildId}`) && x.key.endsWith("1"));
        if (!data)
            return res;

        for (const dgn of data) {
            const [, , dgnId,] = dgn.key.split(":");
            res.set(dgnId, dgn.value);
        }

        return res;
    }

    /**
     * Gets this person's stats.
     * @param {GuildMember | null} user The user. If not provided, should provide userId
     * @param {string} [guildId] The guild ID. If specified, this will only grab the stats associated with this guild.
     * @param {string} [userId] The user ID. If specified, a user should be provided.
     * @returns {Promise<LoggerManager.IUserStats | null>} The result, if any.
     */
    export async function getStats(user: User | null, guildId?: string, userId?: string): Promise<IUserStats | null> {
        let dId = userId;
        if(user){
            dId = user.id;
        }
        if(!dId){
            return null;
        }
        const userDoc = await MongoManager.getUserCollection().findOne({discordId: dId});
        if (!userDoc) {
            return null;
        }

        const guildDoc = guildId
            ? await MongoManager.getOrCreateGuildDoc(guildId, true)
            : null;

        const stats = await getStatsWithDoc(userDoc, guildDoc);
        return stats;
    }

    /**
     * Gets this person's stats when the IUserInfo is already available.
     * @param {IUserInfo} userInfo The user info.
     * @param {string} guildDoc The guild doc.
     * @returns {Promise<LoggerManager.IUserStats | null>} The result, if any.
     */
    export async function getStatsWithDoc(userInfo: IUserInfo, guildDoc : IGuildInfo | null): Promise<IUserStats | null> {

        const stats: IUserStats = {
            keyUse: new Collection<string, Collection<string, number>>(),
            dungeonsLed: new Collection<string, Collection<string, {
                completed: number;
                failed: number;
                assisted: number
            }>>(),
            dungeonRuns: new Collection<string, Collection<string, {
                completed: number;
                failed: number
            }>>()
        };

        const logInfoToProcess = guildDoc 
            ? userInfo.loggedInfo.filter(x => x.key.includes(guildDoc.guildId))
            : userInfo.loggedInfo;

        for (const {key, value} of logInfoToProcess) {

            const [type, gId, vId, ...rest] = key.split(":");
            switch (type) {
                case "P": {
                    break;
                }
                case "K": {
                    // K = Key flag
                    let keyName: string | null = null;
                    if (vId === "GENERAL")
                        keyName = "General";
                    else if (vId in MAPPED_AFK_CHECK_REACTIONS && MAPPED_AFK_CHECK_REACTIONS[vId].type.includes("KEY"))
                        keyName = MAPPED_AFK_CHECK_REACTIONS[vId].name;
                    else {
                        const customKey = guildDoc?.properties.customReactions
                            .find(x => x.key === vId && x.value.type.includes("KEY"));
                        if (customKey)
                            keyName = customKey.value.name;
                    }

                    // No support for custom reactions
                    if (!keyName)
                        break;

                    if (!stats.keyUse.has(gId))
                        stats.keyUse.set(gId, new Collection<string, number>());
                    stats.keyUse.get(gId)!.set(keyName, value);
                    break;
                }
                case "L": {
                    // Lead dungeon flag
                    const dgnName = DungeonUtilities.getDungeonInfo(vId, guildDoc)?.dungeonName;

                    if (!dgnName)
                        break;

                    const [result,] = rest;

                    if (!stats.dungeonsLed.has(gId)) {
                        stats.dungeonsLed.set(gId, new Collection<string, {
                            completed: number;
                            failed: number;
                            assisted: number;
                        }>());
                    }

                    if (stats.dungeonsLed.get(gId)!.has(dgnName)) {
                        if (result === "Completed")
                            stats.dungeonsLed.get(gId)!.get(dgnName)!.completed += value;
                        else if (result === "Assisted")
                            stats.dungeonsLed.get(gId)!.get(dgnName)!.assisted += value;
                        else
                            stats.dungeonsLed.get(gId)!.get(dgnName)!.failed += value;
                    }
                    else {
                        if (result === "Completed")
                            stats.dungeonsLed.get(gId)!.set(dgnName, {completed: value, failed: 0, assisted: 0});
                        else if (result === "Assisted")
                            stats.dungeonsLed.get(gId)!.set(dgnName, {completed: 0, failed: 0, assisted: value});
                        else
                            stats.dungeonsLed.get(gId)!.set(dgnName, {completed: 0, failed: value, assisted: 0});
                    }

                    break;
                }
                case "R": {
                    // Dungeon completion/failed flag
                    const dgnName = DungeonUtilities.getDungeonInfo(vId, guildDoc)?.dungeonName;

                    if (!dgnName)
                        break;

                    // result -> 1 = completed, 0 = failed
                    const result = Number.parseInt(rest[0], 10);
                    if (!result)
                        break;

                    if (!stats.dungeonRuns.has(gId)) {
                        stats.dungeonRuns.set(gId, new Collection<string, {
                            completed: number;
                            failed: number;
                        }>());
                    }

                    if (stats.dungeonRuns.get(gId)!.has(dgnName)) {
                        if (result === 0)
                            stats.dungeonRuns.get(gId)!.get(dgnName)!.failed += value;
                        else
                            stats.dungeonRuns.get(gId)!.get(dgnName)!.completed += value;
                    }
                    else {
                        if (result === 0)
                            stats.dungeonRuns.get(gId)!.set(dgnName, {completed: 0, failed: value});
                        else
                            stats.dungeonRuns.get(gId)!.set(dgnName, {completed: value, failed: 0});
                    }

                    break;
                }
            }
        }

        return stats;
    }
}