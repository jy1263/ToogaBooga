import {BaseCommand, ICommandContext, ICommandInfo} from "../BaseCommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {UserManager} from "../../managers/UserManager";
import {TimeUtilities} from "../../utilities/TimeUtilities";
import {SuspensionManager} from "../../managers/PunishmentManager";
import {StringBuilder} from "../../utilities/StringBuilder";
import {MessageUtilities} from "../../utilities/MessageUtilities";
import {StringUtil} from "../../utilities/StringUtilities";
import {MessageSelectMenu, MessageSelectOptionData} from "discord.js";
import {GuildFgrUtilities} from "../../utilities/fetch-get-request/GuildFgrUtilities";
import {AdvancedCollector} from "../../utilities/collectors/AdvancedCollector";
import {SuspendMember} from "./SuspendMember";

export class SectionSuspendMember extends BaseCommand {
    private static readonly ERROR_NO_SUSPEND_STR: string = new StringBuilder()
        .append("Something went wrong when trying to suspend this person.").appendLine()
        .append("- The person already has the suspended role. In this case, manually remove the Suspended role and")
        .append(" then try running the command again.").appendLine()
        .toString();

    public constructor() {
        const cmi: ICommandInfo = {
            cmdCode: "SECTION_SUSPEND_MEMBER",
            formalCommandName: "Section Suspend Member",
            botCommandName: "sectionsuspend",
            description: "Suspends a user from a particular section (not the main section).",
            rolePermissions: ["Security", "Officer", "Moderator", "RaidLeader", "HeadRaidLeader", "VeteranRaidLeader"],
            generalPermissions: [],
            botPermissions: ["MANAGE_ROLES"],
            commandCooldown: 3 * 1000,
            usageGuide: ["sectionsuspend [Member] {Duration} [Reason]"],
            exampleGuide: ["sectionsuspend @Console#8939 For being bad", "suspend @Console#8939 3d For being bad"],
            guildOnly: true,
            botOwnerOnly: false
        };

        const scb = new SlashCommandBuilder()
            .setName(cmi.botCommandName)
            .setDescription(cmi.description);
        scb.addStringOption(o => {
            return o
                .setName("member")
                .setDescription("The member to suspend from the section. This can either be an ID, IGN, or mention.")
                .setRequired(true);
        }).addStringOption(o => {
            return o
                .setName("duration")
                .setDescription(
                    "The duration. Supported time units are minutes (m), hours (h), days (d), weeks (w). For"
                    + " example, to specify 3 days, use \"3d\" as the duration. Not specifying a duration at all"
                    + " implies an indefinite suspension. Not specifying the time unit for the suspension implies days."
                )
                .setRequired(false);
        }).addStringOption(o => {
            return o
                .setName("reason")
                .setDescription("The reason for this section suspension.")
                .setRequired(true);
        });

        super(cmi, scb);
    }

    /**
     * @inheritDoc
     */
    public async run(ctx: ICommandContext): Promise<number> {
        const memberStr = ctx.interaction.options.getString("member", true);
        const member = await UserManager.resolveMember(ctx.guild!, memberStr);

        if (!member) {
            await ctx.interaction.reply({
                content: "This member could not be resolved. Please try again.",
                ephemeral: true
            });

            return 0;
        }

        const sections = [
            ctx.guildDoc!.roles.staffRoles.universalLeaderRoleIds.headLeaderRoleId,
            ctx.guildDoc!.roles.staffRoles.universalLeaderRoleIds.vetLeaderRoleId,
            ctx.guildDoc!.roles.staffRoles.universalLeaderRoleIds.leaderRoleId
        ].some(x => ctx.member!.roles.cache.has(x))
            ? ctx.guildDoc!.guildSections
            : ctx.guildDoc!.guildSections.filter(x => {
                return [
                    x.roles.leaders.sectionVetLeaderRoleId,
                    x.roles.leaders.sectionLeaderRoleId
                ].some(y => ctx.member!.roles.cache.has(y));
            });

        if (sections.length === 0) {
            await ctx.interaction.reply({
                content: "You are not able to suspend this user from any sections at this time. Try again later",
                ephemeral: true
            });

            return 0;
        }

        const secSelectOpt: MessageSelectOptionData[] = sections
            .map(x => {
                const role = GuildFgrUtilities.getCachedRole(ctx.guild!, x.roles.verifiedRoleId);
                return {
                    label: x.sectionName,
                    description: role?.name ?? "No Member Role.",
                    value: x.uniqueIdentifier
                };
            });

        const uId = StringUtil.generateRandomString(30);
        await ctx.interaction.reply({
            content: "Please select the section where you want to section suspend this person from.",
            components: AdvancedCollector.getActionRowsFromComponents([
                new MessageSelectMenu()
                    .setMaxValues(1)
                    .setMinValues(1)
                    .setCustomId(uId)
                    .addOptions(secSelectOpt.concat({
                        label: "Cancel",
                        description: "Cancel the Section Suspension Process",
                        value: "cancel"
                    }))
            ])
        });

        const result = await AdvancedCollector.startInteractionEphemeralCollector({
            targetChannel: ctx.channel!,
            targetAuthor: ctx.user,
            acknowledgeImmediately: true,
            duration: 60 * 1000
        }, uId);

        if (!result || result.customId === "cancel" || !result.isSelectMenu()) {
            await ctx.interaction.editReply({
                content: "This process has been canceled.",
                components: []
            });

            return 0;
        }

        const sectionPicked = sections.find(x => x.uniqueIdentifier === result.values[0])!;

        const durationStr = ctx.interaction.options.getString("duration", false);
        const parsedDuration = durationStr ? TimeUtilities.parseTimeUnit(durationStr) : null;

        const reason = ctx.interaction.options.getString("reason", true);

        const susRes = await SuspensionManager.addSectionSuspension(member, ctx.member!, {
            duration: parsedDuration?.ms ?? -1,
            evidence: [],
            guildDoc: ctx.guildDoc!,
            reason: reason,
            section: sectionPicked
        });

        if (!susRes) {
            await ctx.interaction.editReply({
                content: SuspendMember.ERROR_NO_SUSPEND_STR
            });

            return 0;
        }

        await ctx.interaction.reply({
            embeds: [
                MessageUtilities.generateBlankEmbed(ctx.guild!, "RED")
                    .setTitle("Section Suspended.")
                    .setDescription(`${member} has been suspended from the \`${sectionPicked.sectionName}\` section.`)
                    .addField("Reason", StringUtil.codifyString(reason))
                    .addField("Duration", StringUtil.codifyString(parsedDuration?.formatted ?? "Indefinite"))
                    .addField("Moderation ID", StringUtil.codifyString(susRes))
                    .setTimestamp()
            ]
        });

        return 0;
    }
}