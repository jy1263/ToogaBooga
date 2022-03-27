import {
    ButtonInteraction,
    Collection,
    CommandInteraction,
    EmbedFieldData,
    GuildMember,
    Interaction,
    Message,
    MessageButton,
    MessageEmbed,
    MessageSelectMenu,
    TextChannel
} from "discord.js";
import {GuildFgrUtilities} from "../utilities/fetch-get-request/GuildFgrUtilities";
import {MessageUtilities} from "../utilities/MessageUtilities";
import {StringBuilder} from "../utilities/StringBuilder";
import {StringUtil} from "../utilities/StringUtilities";
import {RealmSharperWrapper} from "../private-api/RealmSharperWrapper";
import {PrivateApiDefinitions as PAD} from "../private-api/PrivateApiDefinitions";
import {GlobalFgrUtilities} from "../utilities/fetch-get-request/GlobalFgrUtilities";
import {
    IGuildInfo,
    IIdNameInfo,
    IManualVerificationEntry,
    IPropertyKeyValuePair,
    ISectionInfo,
    IVerificationProperties
} from "../definitions";
import {MongoManager} from "./MongoManager";
import {AdvancedCollector} from "../utilities/collectors/AdvancedCollector";
import {EmojiConstants} from "../constants/EmojiConstants";
import {TimeUtilities} from "../utilities/TimeUtilities";
import {UserManager} from "./UserManager";
import {DungeonUtilities} from "../utilities/DungeonUtilities";
import {LoggerManager} from "./LoggerManager";
import {ButtonConstants} from "../constants/ButtonConstants";
import {InteractivityManager} from "./InteractivityManager";
import {ModmailManager} from "./ModmailManager";
import {CommonRegex} from "../constants/CommonRegex";

export namespace VerifyManager {
    export const NUMBER_OF_STATS: number = 8;
    export const SHORT_STAT_TO_LONG: { [s: string]: [string, string] } = {
        "att": ["attack", "Attack"],
        "def": ["defense", "Defense"],
        "spd": ["speed", "Speed"],
        "dex": ["dexterity", "Dexterity"],
        "vit": ["vitality", "Vitality"],
        "wis": ["wisdom", "Wisdom"],
        "hp": ["health", "Health"],
        "mp": ["magic", "Magic"]
    };

    export const LONG_STAT_TO_SHORT: { [s: string]: string } = {
        "attack": "att",
        "defense": "def",
        "speed": "spd",
        "dexterity": "dex",
        "vitality": "vit",
        "wisdom": "wis",
        "health": "hp",
        "magic": "mp"
    };

    export const GY_HIST_TO_DISPLAY: { [s: string]: string } = {
        "Lost Halls completed": "Lost Halls",
        "Voids completed": "Voids",
        "Cultist Hideouts completed": "Cultist Hideouts",
        "Nests completed2": "Nests",
        "Shatters completed1": "Shatters",
        "Tombs completed": "Tomb of the Ancients",
        "Ocean Trenches completed": "Ocean Trenches",
        "Parasite chambers completed4": "Parasite Chambers",
        "Lairs of Shaitan completed4": "Lair of Shaitans",
        "Puppet Master's Encores completed4": "Puppet Master's Encores",
        "Cnidarian Reefs completed": "Cnidarian Reefs",
        "Secluded Thickets completed": "Secluded Thickets",
        "Cursed Libraries completed": "Cursed Libraries",
        "Fungal Caverns completed": "Fungal Caverns",
        "Crystal Caverns completed": "Crystal Caverns",
        "Lairs of Draconis (hard mode) completed2": "Lair of Draconis (Hard)",
        "Lairs of Draconis (easy mode) completed1": "Lair of Draconis (Easy)",
        "Mountain Temples completed2": "Mountain Temples",
        "Crawling Depths completed1": "Crawling Depths",
        "Woodland Labyrinths completed1": "Woodland Labyrinths",
        "Deadwater Docks completed1": "Deadwater Docks",
        "Ice Caves completed1": "Ice Cave",
        "Bella Donnas completed3": "Belladonna's Gardens",
        "Davy Jones's Lockers completed1": "Davy Jones' Lockers",
        "Battle for the Nexuses completed1": "Battle of the Nexus",
        "Candyland Hunting Grounds completed": "Candyland Hunting Grounds",
        "Puppet Master's Theatres completed1": "Puppet Master's Theatres",
        "Toxic Sewers completed1": "Toxic Sewers",
        "Haunted Cemeteries completed1": "Haunted Cemetaries",
        "Mad Labs completed1": "Mad Labs",
        "Abysses of Demons completed": "Abyss of Demons",
        "Manors of the Immortals completed": "Manor of the Immortals",
        "Ancient Ruins completed": "Ancient Ruins",
        "Undead Lairs completed": "Undead Lairs",
        "Sprite Worlds completed": "Sprite Worlds",
        "Snake Pits completed": "Snake Pits",
        "Caves of a Thousand Treasures completed1": "Cave of a Thousand Treasures",
        "Magic Woods completed": "Magic Woods",
        "Hives completed1": "Hives",
        "Spider Dens completed": "Spider Dens",
        "Forbidden Jungles completed": "Forbidden Jungles",
        "Forest Mazes completed1": "Forest Mazes",
        "Pirate Caves completed": "Pirate Caves"
    };

    export const DISPLAY_TO_GY_HIST: { [s: string]: string } = {
        "Lost Halls": "Lost Halls completed",
        "Voids": "Voids completed",
        "Cultist Hideouts": "Cultist Hideouts completed",
        "Nests": "Nests completed2",
        "Shatters": "Shatters completed1",
        "Tomb of the Ancients": "Tombs completed",
        "Ocean Trenches": "Ocean Trenches completed",
        "Parasite Chambers": "Parasite chambers completed4",
        "Lair of Shaitans": "Lairs of Shaitan completed4",
        "Puppet Master's Encores": "Puppet Master's Encores completed4",
        "Cnidarian Reefs": "Cnidarian Reefs completed",
        "Secluded Thickets": "Secluded Thickets completed",
        "Cursed Libraries": "Cursed Libraries completed",
        "Fungal Caverns": "Fungal Caverns completed",
        "Crystal Caverns": "Crystal Caverns completed",
        "Lair of Draconis (Hard)": "Lairs of Draconis (hard mode) completed2",
        "Lair of Draconis (Easy)": "Lairs of Draconis (easy mode) completed1",
        "Mountain Temples": "Mountain Temples completed2",
        "Crawling Depths": "Crawling Depths completed1",
        "Woodland Labyrinths": "Woodland Labyrinths completed1",
        "Deadwater Docks": "Deadwater Docks completed1",
        "Ice Cave": "Ice Caves completed1",
        "Belladonna's Gardens": "Bella Donnas completed3",
        "Davy Jones' Lockers": "Davy Jones's Lockers completed1",
        "Battle of the Nexus": "Battle for the Nexuses completed1",
        "Candyland Hunting Grounds": "Candyland Hunting Grounds completed",
        "Puppet Master's Theatres": "Puppet Master's Theatres completed1",
        "Toxic Sewers": "Toxic Sewers completed1",
        "Haunted Cemetaries": "Haunted Cemeteries completed1",
        "Mad Labs": "Mad Labs completed1",
        "Abyss of Demons": "Abysses of Demons completed",
        "Manor of the Immortals": "Manors of the Immortals completed",
        "Ancient Ruins": "Ancient Ruins completed",
        "Undead Lairs": "Undead Lairs completed",
        "Sprite Worlds": "Sprite Worlds completed",
        "Snake Pits": "Snake Pits completed",
        "Cave of a Thousand Treasures": "Caves of a Thousand Treasures completed1",
        "Magic Woods": "Magic Woods completed",
        "Hives": "Hives completed1",
        "Spider Dens": "Spider Dens completed",
        "Forbidden Jungles": "Forbidden Jungles completed",
        "Forest Mazes": "Forest Mazes completed1",
        "Pirate Caves": "Pirate Caves completed"
    };

    const CHECK_PROFILE_ID: string = "check_profile";
    const NO_MANUAL_VERIFY_ID: string = "deny";
    const MANUAL_VERIFY_ID: string = "manual_verify";
    const MANUAL_EVIDENCE_ID: string = "manual_evidence";

    // For approving or denying manual verification applications
    export const MANUAL_VERIFY_ACCEPT_ID: string = "accept_manual";
    export const MANUAL_VERIFY_DENY_ID: string = "reject_manual";
    export const MANUAL_VERIFY_MODMAIL_ID: string = "modmail_manual";


    const CHECK_PROFILE_BUTTON = new MessageButton()
        .setLabel("Check Profile")
        .setCustomId(CHECK_PROFILE_ID)
        .setStyle("PRIMARY");
    const NO_MANUAL_VERIFY_BUTTON = new MessageButton()
        .setLabel("Deny Manual Verify")
        .setCustomId(NO_MANUAL_VERIFY_ID)
        .setStyle("DANGER");
    const MANUAL_VERIFY_BUTTON = new MessageButton()
        .setLabel("Accept")
        .setCustomId(MANUAL_VERIFY_ID)
        .setStyle("PRIMARY");
    const MANUAL_EVIDENCE_BUTTON = new MessageButton()
        .setLabel("Accept With Evidence")
        .setCustomId(MANUAL_EVIDENCE_ID)
        .setStyle("PRIMARY");

    const GUILD_ROLES: string[] = [
        "Founder",
        "Leader",
        "Officer",
        "Member",
        "Initiate"
    ];

    // An interface representing a "kit" with the relevant channels for this verification session, along with the
    // message to be used for the verification process.
    interface IVerificationKit {
        manualVerify: TextChannel | null;
        verifyChannel: TextChannel | null;
        verifySuccess: TextChannel | null;
        verifyFail: TextChannel | null;
        verifyStep: TextChannel | null;
        verifyStart: TextChannel | null;
        msg: Message | null;
    }

    /**
     * Checks whether a guild member can receive direct messages.
     * @param {GuildMember} member The guild member to check.
     * @returns {Promise<Message | null>} The message that was sent to the member, or `null` if such message could
     * not be sent.
     * @private
     */
    async function getInitialMessage(member: GuildMember): Promise<Message | null> {
        return await GlobalFgrUtilities.sendMsg(member, {
            embeds: [
                new MessageEmbed()
                    .setColor("YELLOW")
                    .setDescription("This is a test message to ensure that you can receive direct messages.")
            ]
        });
    }

    /**
     * An entry point for verification. This is called when the "Get Verified" (or some version of it) button is
     * pressed. Applies to any section.
     * @param {Interaction} i The interaction.
     * @param {IGuildInfo} guildDoc The guild document.
     * @param {ISectionInfo} section The section where verification will occur.
     */
    export async function verifyInteraction(i: Interaction, guildDoc: IGuildInfo, section: ISectionInfo): Promise<void> {
        if (!i.isButton()) {
            return;
        }

        if (!i.guild) {
            await i.deferUpdate();
            return;
        }

        const member = await GuildFgrUtilities.fetchGuildMember(i.guild, i.user.id);
        if (!member) {
            await i.deferUpdate();
            return;
        }

        // Check if the verified role exists.
        const verifiedRole = await GuildFgrUtilities.fetchRole(member.guild, section.roles.verifiedRoleId);

        // No verified role = no go. Or, if the person is verified, no need for them to get verified.
        if (!verifiedRole || GuildFgrUtilities.memberHasCachedRole(member, verifiedRole.id)) {
            return;
        }

        // Get logging channels ready
        const loggingChannels = section.isMainSection
            ? guildDoc.channels.loggingChannels
            : section.channels.loggingChannels;

        const verifyStartChannel = GuildFgrUtilities.getCachedChannel<TextChannel>(
            member.guild,
            loggingChannels.find(x => x.key === "VerifyStart")?.value ?? ""
        );

        const verifyFailChannel = GuildFgrUtilities.getCachedChannel<TextChannel>(
            member.guild,
            loggingChannels.find(x => x.key === "VerifyFail")?.value ?? ""
        );

        verifyStartChannel?.send(`[${section.sectionName}] ${member} has started the verification process.`)
            .catch();

        // If we can't open a DM, then don't bother.
        let dmMsg: Message | null = null;
        if (section.isMainSection) {
            dmMsg = await getInitialMessage(member);
            if (!dmMsg) {
                await i.reply({
                    content: "I can't seem to message you directly. Please make sure your privacy settings are set so"
                        + " anyone can send you direct messages.",
                    ephemeral: true
                });

                verifyFailChannel?.send(`[${section.sectionName}] ${member} could not be directly messaged.`)
                    .catch();
                return;
            }
        }

        const verifyStepChannel = GuildFgrUtilities.getCachedChannel<TextChannel>(
            member.guild,
            loggingChannels.find(x => x.key === "VerifyStep")?.value ?? ""
        );
        const verifySuccessChannel = GuildFgrUtilities.getCachedChannel<TextChannel>(
            member.guild,
            loggingChannels.find(x => x.key === "VerifySuccess")?.value ?? ""
        );
        const getVerifiedChannel = GuildFgrUtilities.getCachedChannel<TextChannel>(
            member.guild,
            section.channels.verification.verificationChannelId
        );
        const manualVerifyChannel = GuildFgrUtilities.getCachedChannel<TextChannel>(
            member.guild,
            section.channels.verification.manualVerificationChannelId
        );

        if (section.isMainSection) {
            await i.deferUpdate();
        }

        verify(member, guildDoc, section, {
            manualVerify: manualVerifyChannel,
            verifyStart: verifyStartChannel,
            verifySuccess: verifySuccessChannel,
            verifyStep: verifyStepChannel,
            verifyFail: verifyFailChannel,
            verifyChannel: getVerifiedChannel,
            msg: dmMsg
        }, i).catch();
    }

    /**
     * An entry point for verification. This is called when the "verify" command is executed. Applies to the main
     * section only.
     * @param {CommandInteraction} i The interaction (slash command) that led to this function being executed.
     * @param {IGuildInfo} guildDoc The guild document.
     */
    export async function verifyMainCommand(i: CommandInteraction, guildDoc: IGuildInfo): Promise<void> {
        if (!i.guild)
            return;

        const member = await GuildFgrUtilities.fetchGuildMember(i.guild, i.user.id);
        if (!member)
            return;

        // Check if the verified role exists.
        const verifiedRole = await GuildFgrUtilities.fetchRole(member.guild, guildDoc.roles.verifiedRoleId);

        // No verified role = no go. Or, if the person is verified, no need for them to get verified.
        if (!verifiedRole || GuildFgrUtilities.memberHasCachedRole(member, verifiedRole.id))
            return;

        const verifyStartChannel = GuildFgrUtilities.getCachedChannel<TextChannel>(
            member.guild,
            guildDoc.channels.loggingChannels.find(x => x.key === "VerifyStart")?.value ?? ""
        );
        const verifyFailChannel = GuildFgrUtilities.getCachedChannel<TextChannel>(
            member.guild,
            guildDoc.channels.loggingChannels.find(x => x.key === "VerifyFail")?.value ?? ""
        );

        verifyStartChannel?.send(`[Main] ${member} has started the verification process.`)
            .catch();

        // If we can't open a DM, then don't bother.
        const dmMsg = await getInitialMessage(member);
        if (!dmMsg) {
            await i.reply({
                content: "I can't seem to message you directly. Please make sure your privacy settings are set so"
                    + " anyone can send you direct messages.",
                ephemeral: true
            });

            verifyFailChannel?.send(`[Main] ${member} could not be directly messaged.`)
                .catch();
            return;
        }

        const verifyStepChannel = GuildFgrUtilities.getCachedChannel<TextChannel>(
            member.guild,
            guildDoc.channels.loggingChannels.find(x => x.key === "VerifyStep")?.value ?? ""
        );
        const verifySuccessChannel = GuildFgrUtilities.getCachedChannel<TextChannel>(
            member.guild,
            guildDoc.channels.loggingChannels.find(x => x.key === "VerifySuccess")?.value ?? ""
        );
        const getVerifiedChannel = GuildFgrUtilities.getCachedChannel<TextChannel>(
            member.guild,
            guildDoc.channels.verification.verificationChannelId
        );
        const manualVerifyChannel = GuildFgrUtilities.getCachedChannel<TextChannel>(
            member.guild,
            guildDoc.channels.verification.manualVerificationChannelId
        );

        verify(member, guildDoc, MongoManager.getMainSection(guildDoc), {
            manualVerify: manualVerifyChannel,
            verifyStart: verifyStartChannel,
            verifySuccess: verifySuccessChannel,
            verifyStep: verifyStepChannel,
            verifyFail: verifyFailChannel,
            verifyChannel: getVerifiedChannel,
            msg: dmMsg
        }).catch();
    }

    /**
     * The function where verification will begin. This should be called through an entry function (for example, a
     * function that is called when a button is pressed or the verify command is executed). This assumes that the
     * member to be verified can receive direct messages.
     * @param {GuildMember} member The member to verify.
     * @param {IGuildInfo} guildDoc The guild document.
     * @param {ISectionInfo} section The section to verify in.
     * @param {IVerificationKit} verifKit The verification "kit."
     * @param {ButtonInteraction} [interaction] The interaction, if any, that led to this function execution.
     * @private
     */
    async function verify(member: GuildMember, guildDoc: IGuildInfo, section: ISectionInfo,
                          verifKit: IVerificationKit, interaction?: ButtonInteraction): Promise<void> {
        if (!(await RealmSharperWrapper.isOnline())) {
            await GlobalFgrUtilities.sendMsg(member, {
                embeds: [
                    MessageUtilities.generateBlankEmbed(member, "RED")
                        .setTitle("Verification Unavailable.")
                        .setDescription("Verification is currently unavailable. Please try again later.")
                        .setTimestamp()
                ]
            });
            return;
        }

        // Check if this person is currently being manually verified.
        const manualVerifyEntry = guildDoc.manualVerificationEntries
            .find(x => x.userId === member.id && x.sectionId === section.uniqueIdentifier);

        // If this is true, then this person is being manually verified.
        if (manualVerifyEntry) {
            await GlobalFgrUtilities.sendMsg(member, {
                content: "Your profile is currently under manual verification. Please try again later."
            });
            verifKit.verifyFail?.send({
                content: `[${section.sectionName}] ${member} tried to verify but they are currently under manual `
                    + "verification."
            }).catch();
            return;
        }

        // This has to be a verification channel so we don't need to double check.
        if (section.isMainSection) {
            verifyMain(member, guildDoc, verifKit).catch();
            return;
        }

        verifySection(member, section, verifKit, interaction!).catch();
    }

    /**
     * Verifies in the main server.
     * @param {GuildMember} member The member.
     * @param {IGuildInfo} guildDoc The guild document.
     * @param {IVerificationKit} verifKit The verification "kit."
     * @private
     */
    async function verifyMain(member: GuildMember, guildDoc: IGuildInfo, verifKit: IVerificationKit): Promise<void> {
        if (!verifKit.msg)
            return;

        let userDocToUse: IIdNameInfo | null = null;

        const dmChannel = await member.createDM();
        const userDocs = await MongoManager.findIdInIdNameCollection(member.id);
        let nameToVerify: string | null = null;
        if (userDocs.length > 0) {
            await verifKit.msg.edit({
                embeds: [
                    MessageUtilities.generateBlankEmbed(member.user, "RED")
                        .setTitle(`**${member.guild.name}**: Guild Verification`)
                        .setDescription(
                            "It appears that you have one or more name(s) associated with this Discord account. Please"
                            + " select a name that you want to use to verify with this server. If you want to use a"
                            + " name that isn't listed, simply press the **Skip** button."
                        )
                        .setFooter({text: "Respond By"})
                        .setTimestamp(Date.now() + 2 * 60 * 1000)
                ],
                components: AdvancedCollector.getActionRowsFromComponents([
                    new MessageSelectMenu()
                        .setMaxValues(1)
                        .setMinValues(1)
                        .addOptions(userDocs[0].rotmgNames.map(x => {
                            return {label: x.ign, value: x.ign};
                        }))
                        .setCustomId("select"),
                    new MessageButton()
                        .setStyle("DANGER")
                        .setLabel("Skip")
                        .setCustomId("skip"),
                    ButtonConstants.CANCEL_BUTTON
                ])
            });
            const selectedOption = await AdvancedCollector.startInteractionCollector({
                oldMsg: verifKit.msg,
                acknowledgeImmediately: true,
                duration: 2 * 60 * 1000,
                clearInteractionsAfterComplete: true,
                deleteBaseMsgAfterComplete: false,
                targetAuthor: member,
                targetChannel: dmChannel
            });

            // No option = terminate process
            if (!selectedOption) {
                verifKit.verifyFail?.send({
                    content: `[Main] ${member} was asked to select a name previously associated with the Discord `
                        + "account, but they did not select a name within the specified time."
                });

                verifKit.msg.delete().catch();
                return;
            }

            if (selectedOption.isSelectMenu() && selectedOption.values.length > 0) {
                nameToVerify = selectedOption.values[0];
                userDocToUse = userDocs[0];
            }

            if (selectedOption.isButton() && selectedOption.customId === ButtonConstants.CANCEL_ID) {
                verifKit.verifyFail?.send({
                    content: `[Main] ${member} has stopped the verification process. This occurred when the person was `
                        + "asked to either use an existing name or provide a new name."
                });

                verifKit.msg.delete().catch();
                return;
            }
        }

        // Ask for a name if no name is provided.
        if (!nameToVerify) {
            InteractivityManager.ACTIVE_DIRECT_MESSAGES.set(member.user.id);
            await verifKit.msg.edit({
                embeds: [
                    MessageUtilities.generateBlankEmbed(member.user, "RED")
                        .setTitle(`**${member.guild.name}**: Guild Verification`)
                        .setDescription(
                            "Please type the name that you want to verify with. Make sure you have access to the"
                            + " **RealmEye** profile associated with the name that you want to use."
                        )
                        .addField(
                            "Cancel Process",
                            "To cancel the verification process, simply type **`-cancel`**."
                        )
                        .setFooter({text: "Respond By"})
                        .setTimestamp(Date.now() + 2 * 60 * 1000)
                ],
                components: []
            });

            const nameToUse = await AdvancedCollector.startNormalCollector({
                cancelFlag: "-cancel",
                deleteResponseMessage: false,
                oldMsg: verifKit.msg,
                duration: 2 * 60 * 1000,
                deleteBaseMsgAfterComplete: false,
                targetAuthor: member,
                targetChannel: dmChannel
            }, AdvancedCollector.getStringPrompt(member, {
                min: 1,
                max: 15,
                regexFilter: {
                    regex: CommonRegex.ONLY_LETTERS,
                    withErrorMsg: "Your name can only have letters."
                }
            }));

            setTimeout(() => {
                InteractivityManager.ACTIVE_DIRECT_MESSAGES.delete(member.user.id);
            }, 2 * 1000);

            if (!nameToUse) {
                verifKit.verifyFail?.send({
                    content: `[Main] ${member} has stopped the verification process. This occurred when the person was `
                        + "asked to provide a name for verification."
                });

                verifKit.msg.delete().catch();
                return;
            }

            // Check if the name is being used in database or in guild
            const matchedNameUserDocs = await MongoManager.findNameInIdNameCollection(nameToUse);
            let userDoc: IIdNameInfo | null = null;
            let invalidDocs = 0;
            for (const doc of matchedNameUserDocs) {
                if (doc.currentDiscordId === member.id) {
                    userDoc = doc;
                    break;
                }

                invalidDocs++;
            }

            // Make sure this isn't already registered to this user.
            if (!userDoc && invalidDocs > 0) {
                const idsRegistered = matchedNameUserDocs.map(x => x.currentDiscordId).join(", ");
                verifKit.verifyFail?.send({
                    content: `[Main] ${member} tried to verify with the name, **\`${nameToUse}\`**, but this name `
                        + `has already been registered by the following Discord ID(s): ${idsRegistered}`
                });

                verifKit.msg.edit({
                    embeds: [
                        MessageUtilities.generateBlankEmbed(member.user, "RED")
                            .setTitle(`**${member.guild.name}**: Guild Verification __Failed__`)
                            .setDescription(`The name, **\`${nameToUse}\`**, has already been registered by another`
                                + " user. You will need to resolve this issue by messaging a staff member for"
                                + " assistance. If you want to verify with a different in-game name, please"
                                + " restart the verification process.")
                            .setFooter({text: "Verification Process Stopped."})
                    ]
                }).catch();

                return;
            }

            nameToVerify = nameToUse;
            userDocToUse = userDoc ?? null;
        }

        const allAssociatedNames: string[] = [];
        if (userDocToUse) {
            allAssociatedNames.push(
                ...userDocToUse.rotmgNames.map(x => x.ign),
                ...userDocToUse.pastRealmNames.map(x => x.ign)
            );
        }

        const code = StringUtil.generateRandomString(15);
        verifKit.verifyStep?.send({
            content: `[Main] ${member} will be trying to verify under the name: **\`${nameToVerify}\`** with code`
                + "`" + code + "`."
        });

        const timeStarted = Date.now();
        await verifKit.msg.edit({
            embeds: [
                getVerifEmbed(member, nameToVerify, code, guildDoc, guildDoc.otherMajorConfig.verificationProperties)
                    .setFooter({text: "Verification Process Expires"})
                    .setTimestamp(timeStarted + 20 * 60 * 1000)
            ],
            components: AdvancedCollector.getActionRowsFromComponents([
                CHECK_PROFILE_BUTTON,
                ButtonConstants.CANCEL_BUTTON
            ])
        });

        const collector = verifKit.msg.createMessageComponentCollector({
            filter: i => i.user.id === member.id,
            time: 20 * 60 * 1000
        });

        collector.on("end", () => {
            // nothing for now
        });

        collector.on("collect", async i => {
            await i.deferUpdate();
            if (i.customId === ButtonConstants.CANCEL_ID) {
                await verifKit.msg!.edit({
                    embeds: [
                        MessageUtilities.generateBlankEmbed(member.guild, "RED")
                            .setTitle(`**${member.guild.name}**: Guild Verification Canceled`)
                            .setDescription(
                                "You have canceled the verification process. To verify again, please restart the"
                                + " verification process."
                            )
                            .setTimestamp()
                    ],
                    components: []
                });

                verifKit.verifyFail?.send({
                    content: `[Main] ${member} has canceled the verification process.`
                });

                collector.stop();
                return;
            }

            await verifKit.msg!.edit({
                embeds: [
                    MessageUtilities.generateBlankEmbed(member.guild, "RED")
                        .setTitle(`**${member.guild.name}**: Guild Verification Checking`)
                        .setDescription(
                            "Your RealmEye profile is currently being reviewed. Please wait patiently. Once your"
                            + " profile has been checked, I will edit this message (and send you a new message to"
                            + " notify you). This should take no more than one minute."
                        )
                        .setTimestamp()
                ],
                components: []
            });

            // Grab normal data.
            const requestData = await GlobalFgrUtilities.tryExecuteAsync<PAD.IPlayerData>(async () => {
                return RealmSharperWrapper.getPlayerInfo(nameToVerify!);
            });

            if (!requestData) {
                await verifKit.msg!.edit({
                    embeds: [
                        MessageUtilities.generateBlankEmbed(member.guild, "RED")
                            .setTitle(`**${member.guild.name}**: Guild Verification Error`)
                            .setDescription(
                                "An unknown error occurred when trying to reach your RealmEye profile's basic data."
                                + " This error is usually caused by one of several things.\n\n"
                                + `The URL I tried to reach is https://www.realmeye.com/player/${nameToVerify!}.`
                            )
                            .addField(
                                "1. Private Profile",
                                "Make sure __anyone__ can view your profile. To confirm that this is the case, use"
                                + " your browser's private browsing feature to check your profile."
                            )
                            .addField(
                                "2. RealmEye API Error",
                                "It's possible that the API that the bot uses to check RealmEye is currently down."
                                + " Think of an API as the bot's way of checking your profile. Usually, this is"
                                + " caused by the API being down."
                            )
                            .addField(
                                "Now What?",
                                "The verification process has been stopped. You'll need to restart the verification"
                                + " process. **If** this issue persists, please message a staff member for assistance."
                            )
                            .setTimestamp()
                    ],
                    components: []
                });
                await GlobalFgrUtilities.sendMsg(member, {
                    content: "An error occurred while trying to get basic data from your profile. Please see the above"
                        + " embed."
                });

                verifKit.verifyFail?.send({
                    content: `[Main] ${member} tried to verify as **\`${nameToVerify}\`**, but an unknown error `
                        + "occurred when trying to reach their RealmEye profile's basic data"
                        + ` (https://www.realmeye.com/player/${nameToVerify!}). Is the profile`
                        + " private?"
                });

                collector.stop();
                return;
            }

            // Check desc
            let codeFound = false;
            for (const d of requestData.description) {
                if (!d.includes(code))
                    continue;
                codeFound = true;
                break;
            }

            if (!codeFound) {
                await verifKit.msg!.edit({
                    embeds: [
                        getVerifEmbed(
                            member,
                            nameToVerify!,
                            code,
                            guildDoc,
                            guildDoc.otherMajorConfig.verificationProperties
                        ).setFooter({text: "Verification Process Expires"})
                            .setTimestamp(timeStarted + 20 * 60 * 1000)
                            .addField(
                                `${EmojiConstants.WARNING_EMOJI} Verification Issues`,
                                "Your verification code was not found in your RealmEye profile's description."
                            )
                    ],
                    components: AdvancedCollector.getActionRowsFromComponents([
                        CHECK_PROFILE_BUTTON,
                        ButtonConstants.CANCEL_BUTTON
                    ])
                });

                const r = await GlobalFgrUtilities.sendMsg(member, {
                    content: "An error occurred while reviewing your profile. Please see the above embed."
                });
                verifKit.verifyFail?.send({
                    content: `[Main] ${member} tried to verify as **\`${nameToVerify}\`**, but the verification code,`
                        + `\`${code}\`, was not found in their description.`
                });

                if (!r) {
                    collector.stop();
                    verifKit.msg?.delete().catch();

                    verifKit.verifyFail?.send({
                        content: `[Main] ${member} tried to verify as **\`${nameToVerify}\`**, but something went wrong`
                            + " when trying to message the user. Verification has been canceled."
                    });
                    return;
                }

                return;
            }

            // Grab name history.
            const nameHistory = await GlobalFgrUtilities.tryExecuteAsync<PAD.INameHistory>(async () => {
                return RealmSharperWrapper.getNameHistory(nameToVerify!);
            });

            if (!nameHistory) {
                await verifKit.msg!.edit({
                    embeds: [
                        getVerifEmbed(
                            member,
                            nameToVerify!,
                            code,
                            guildDoc,
                            guildDoc.otherMajorConfig.verificationProperties
                        ).setFooter({text: "Verification Process Expires"})
                            .setTimestamp(timeStarted + 20 * 60 * 1000)
                            .addField(
                                `${EmojiConstants.WARNING_EMOJI} Verification Issues`,
                                "Something went wrong when trying to get your RealmEye profile's **name history.**"
                                + " Make sure anyone can view your profile's name history. If this issue persists,"
                                + " please **stop** the verification process and contact a staff member for assistance."
                            )
                    ],
                    components: AdvancedCollector.getActionRowsFromComponents([
                        CHECK_PROFILE_BUTTON,
                        ButtonConstants.CANCEL_BUTTON
                    ])
                });

                const r = await GlobalFgrUtilities.sendMsg(member, {
                    content: "An error occurred while trying to get your name history. Please see the above embed."
                });

                verifKit.verifyFail?.send({
                    content: `[Main] ${member} tried to verify as **\`${nameToVerify}\`**, but an unknown error `
                        + "occurred when trying to reach their profile's **name history**."
                });

                if (!r) {
                    collector.stop();
                    verifKit.msg?.delete().catch();

                    verifKit.verifyFail?.send({
                        content: `[Main] ${member} tried to verify as **\`${nameToVerify}\`**, but something went wrong`
                            + " when trying to message the user. Verification has been canceled."
                    });
                    return;
                }
                return;
            }

            // Check blacklist info
            for (const blacklistEntry of guildDoc.moderation.blacklistedUsers) {
                for (const nameEntry of [
                    requestData.name,
                    ...nameHistory.nameHistory.map(x => x.name),
                    ...allAssociatedNames
                ]) {
                    if (blacklistEntry.realmName.lowercaseIgn !== nameEntry.toLowerCase())
                        continue;

                    // Person is blacklisted.
                    await verifKit.msg!.edit({
                        embeds: [
                            MessageUtilities.generateBlankEmbed(member.guild, "RED")
                                .setTitle(`**${member.guild.name}**: Guild Verification Error`)
                                .setDescription(
                                    `The name, **\`${nameEntry}\`**, is blacklisted from this server.`
                                )
                                .addField(
                                    "Associated Discord ID",
                                    `${blacklistEntry.discordId ?? "N/A"} (Your ID: ${member.id})`
                                )
                                .addField("Reason", blacklistEntry.reason)
                                .addField(
                                    "Now What?",
                                    "You cannot verify in this server right now. You can try to appeal your"
                                    + " blacklist with the server staff. When doing so, please give them the"
                                    + " moderation ID associated with your blacklist (shown below)."
                                )
                                .setFooter({text: `Mod. ID: ${blacklistEntry.actionId}`})
                                .setTimestamp()
                        ],
                        components: []
                    });
                    await GlobalFgrUtilities.sendMsg(member, {
                        content: "You are blacklisted and cannot verify in this server at this time. Please see the"
                            + " above embed."
                    });

                    verifKit.verifyFail?.send({
                        content: `[Main] ${member} tried to verify as **\`${nameToVerify}\`**, but they are `
                            + `blacklisted from this server under the name: \`${nameEntry}\`. The corresponding `
                            + `Moderation ID is: \`${blacklistEntry.actionId}\`.`
                    });

                    collector.stop();
                    return;
                }
            }

            // Check everything else
            const checkRes = await checkRequirements(member, MongoManager.getMainSection(guildDoc), requestData);

            if (checkRes.conclusion === "FAIL") {
                const issuesToUse = checkRes.fatalIssues.length === 0 ? checkRes.manualIssues : checkRes.fatalIssues;
                const fields: EmbedFieldData[] = issuesToUse.map(x => {
                    return {name: x.key, value: x.value};
                });

                const failEmbed = MessageUtilities.generateBlankEmbed(member.guild, "RED")
                    .setTitle(`**${member.guild.name}**: Guild Verification Failed`)
                    .setDescription(
                        "You have failed to meet one or more requirements. These requirements are listed below."
                    )
                    .addFields(fields)
                    .setTimestamp();

                failEmbed.addField(
                    "What Now?",
                    "These are requirements that you absolutely must meet in order to get verified. Since you failed"
                    + " to meet these requirements, you aren't able to get manually verified through the bot."
                    + " Message a staff member for more assistance."
                );

                await Promise.all([
                    verifKit.msg!.edit({
                        embeds: [failEmbed],
                        components: []
                    }),
                    GlobalFgrUtilities.sendMsg(member, {
                        content: "A major requirement was not met. Please review the above embed."
                    }),
                    verifKit.verifyFail?.send({
                        content: `[Main] ${member} tried to verify as **\`${nameToVerify}\`**, but there were several `
                            + "fatal issues with the person's profile. These issues are listed below:\n"
                            + issuesToUse.map(x => `- **[${x.key}]** ${x.log}`).join("\n")
                    })
                ]);

                collector.stop();
                return;
            }

            if (checkRes.conclusion === "TRY_AGAIN") {
                await verifKit.msg!.edit({
                    embeds: [
                        getVerifEmbed(
                            member,
                            nameToVerify!,
                            code,
                            guildDoc,
                            guildDoc.otherMajorConfig.verificationProperties
                        ).setFooter({text: "Verification Process Expires"})
                            .setTimestamp(timeStarted + 20 * 60 * 1000)
                            .addField(
                                `${EmojiConstants.WARNING_EMOJI} Verification Issues`,
                                "Something went wrong when fully reviewing your profile. Please resolve these issues"
                                + " and try again.\n"
                                + checkRes.taIssues.map(x => `- **${x.key}**: ${x.value}`).join("\n")
                            )
                    ],
                    components: AdvancedCollector.getActionRowsFromComponents([
                        CHECK_PROFILE_BUTTON,
                        ButtonConstants.CANCEL_BUTTON
                    ])
                });
                const r = await GlobalFgrUtilities.sendMsg(member, {
                    content: "An error occurred while reviewing your profile. Please see the above embed."
                });

                verifKit.verifyFail?.send({
                    content: `[Main] ${member} tried to verify as **\`${nameToVerify}\`**, but there were several `
                        + "minor issues with the person's profile. These issues are listed below:\n"
                        + checkRes.taIssues.map(x => `- **[${x.key}]** ${x.log}`).join("\n")
                });

                if (!r) {
                    collector.stop();
                    verifKit.msg?.delete().catch();

                    verifKit.verifyFail?.send({
                        content: `[Main] ${member} tried to verify as **\`${nameToVerify}\`**, but something went wrong`
                            + " when trying to message the user. Verification has been canceled."
                    });
                    return;
                }

                return;
            }

            if (checkRes.conclusion === "MANUAL") {
                handleManualVerificationCase(member, checkRes, verifKit, MongoManager.getMainSection(guildDoc))
                    .then();
                collector.stop();
                return;
            }

            collector.stop();
            await Promise.all([
                MongoManager.addIdNameToIdNameCollection(member, requestData.name),
                GlobalFgrUtilities.tryExecuteAsync(async () => {
                    await member.roles.add(guildDoc.roles.verifiedRoleId);
                }),
                GlobalFgrUtilities.tryExecuteAsync(async () => {
                    await member.setNickname(requestData.name, "Verified in the main section successfully.");
                })
            ]);

            const finishedEmbed = MessageUtilities.generateBlankEmbed(member.guild, "GREEN")
                .setTitle(`**${member.guild.name}**: Guild Verification Successful`)
                .setFooter({text: "Verification Completed At"})
                .setTimestamp();
            if (guildDoc.otherMajorConfig.verificationProperties.verificationSuccessMessage) {
                finishedEmbed.setDescription(
                    guildDoc.otherMajorConfig.verificationProperties.verificationSuccessMessage
                );
            }
            else {
                finishedEmbed.setDescription(
                    "You have successfully been verified in this server. Please make sure to read the applicable"
                    + " rules/guidelines. If you have any questions, please message a staff member. Thanks!"
                );
            }

            await Promise.all([
                verifKit.msg!.edit({embeds: [finishedEmbed]}).catch(),
                await member.send({
                    content: "Your verification was successful."
                }).catch(),
                verifKit.verifySuccess?.send({
                    content: `[Main] ${member} has successfully verified as **\`${nameToVerify}\`**.`
                })
            ]);
        });
    }

    /**
     * Verifies in a section. This assumes a non-main section.
     * @param {GuildMember} member The member to verify.
     * @param {ISectionInfo} section The section.
     * @param {IVerificationKit} verifKit The verification "kit."
     * @param {ButtonInteraction} interaction The interaction that led to this.
     * @private
     */
    async function verifySection(member: GuildMember, section: ISectionInfo, verifKit: IVerificationKit,
                                 interaction: ButtonInteraction): Promise<void> {
        const verifiedRole = await GuildFgrUtilities.fetchRole(member.guild, section.roles.verifiedRoleId);
        if (!verifiedRole || GuildFgrUtilities.memberHasCachedRole(member, verifiedRole.id))
            return;

        if (!section.otherMajorConfig.verificationProperties.checkRequirements) {
            await Promise.all([
                member.roles.add(verifiedRole).catch(),
                interaction.reply({
                    content: "You have successfully been verified.",
                    ephemeral: true
                }),
                verifKit.verifySuccess?.send({
                    content: `[${section.sectionName}] ${member} has successfully been verified in this section.`
                })
            ]);
            return;
        }

        const names = UserManager.getAllNames(member.displayName);
        let nameToUse: string;
        const uIdentifier = StringUtil.generateRandomString(30);
        if (names.length === 0) {
            // lookup database for name
            const nameRes = await MongoManager.findIdInIdNameCollection(member.id);
            // no name found = can't verify.
            if (nameRes.length === 0) {
                await interaction.reply({
                    content: "Something went wrong when trying to verify you. You do not have a name registered with"
                        + " the bot and your Discord nickname is not a valid RotMG name. Please contact a staff"
                        + " member for assistance.",
                    ephemeral: true
                });
                return;
            }

            nameToUse = nameRes[0].rotmgNames[0].ign;
        }
        else {
            nameToUse = names[0];
        }

        const requestData = await GlobalFgrUtilities.tryExecuteAsync<PAD.IPlayerData>(async () => {
            return RealmSharperWrapper.getPlayerInfo(nameToUse);
        });

        if (!requestData) {
            await interaction.reply({
                content: `Your in-game name, **\`${nameToUse}\`**, could not be found on RealmEye. Make sure your`
                    + " profile is **public** (anyone can see it).",
                ephemeral: true
            });

            verifKit.verifyFail?.send({
                content: `[${section.sectionName}] ${member} tried to verify as **\`${nameToUse}\`**, but an unknown`
                    + " error occurred when trying to reach their RealmEye profile's basic data"
                    + ` (https://www.realmeye.com/player/${nameToUse}). Is the profile private?`
            });
            return;
        }

        const checkRes = await checkRequirements(member, section, requestData);
        if (checkRes.conclusion === "TRY_AGAIN") {
            await interaction.reply({
                content: `Your in-game name, **\`${nameToUse}\`**, was found on RealmEye. However, your RealmEye`
                    + " profile has a few issues that need to be resolved. These issues are listed below:\n"
                    + checkRes.taIssues.map(x => `- **${x.key}**: ${x.value}`).join("\n"),
                ephemeral: true
            });

            verifKit.verifyFail?.send({
                content: `[${section.sectionName}] ${member} tried to verify as **\`${nameToUse}\`**, but there were`
                    + " several minor issues with the person's profile. These issues are listed below:\n"
                    + checkRes.taIssues.map(x => `- **[${x.key}]** ${x.log}`).join("\n")
            });
            return;
        }

        if (checkRes.conclusion === "FAIL") {
            await interaction.reply({
                content: `Your in-game name, **\`${nameToUse}\`**, was found on RealmEye. However, your RealmEye`
                    + " profile has failed to meet one or more major issues. These issues are listed below:\n"
                    + checkRes.fatalIssues.map(x => `- **${x.key}**: ${x.value}`).join("\n"),
                ephemeral: true
            });

            verifKit.verifyFail?.send({
                content: `[${section.sectionName}] ${member} tried to verify as **\`${nameToUse}\`**, but there were`
                    + " several fatal issues with the person's profile. These issues are listed below:\n"
                    + checkRes.fatalIssues.map(x => `- **[${x.key}]** ${x.log}`).join("\n")
            });
            return;
        }

        if (checkRes.conclusion === "MANUAL") {
            handleManualVerificationCase(member, checkRes, verifKit, section)
                .then();

            await interaction.reply({
                content: new StringBuilder()
                    .append(`Your in-game name, **\`${nameToUse}\`**, was found on RealmEye. However, your RealmEye `)
                    .append("profile does not meet one or more requirements. These issues are listed below:")
                    .appendLine()
                    .append(checkRes.manualIssues.map(x => `- **${x.key}**: ${x.value}`).join("\n"))
                    .appendLine(2)
                    .append("Please check your direct messages. If you did not receive a message from the bot, you ")
                    .append("may need to adjust your privacy settings so anyone can direct message you.")
                    .toString(),
                ephemeral: true
            });
            return;
        }

        // Passed requirements.
        await Promise.all([
            member.roles.add(verifiedRole).catch(),
            interaction.reply({
                content: "You have successfully been verified.",
                ephemeral: true
            }),
            verifKit.verifySuccess?.send({
                content: `[${section.sectionName}] ${member} has successfully been verified in this section.`
            })
        ]);
    }

    /**
     * Handles the case where we need to deal with manual verification.
     * @param {GuildMember} member The member to manually verify.
     * @param {IReqCheckResult} checkRes The original check results.
     * @param {IVerificationKit} verifKit The verification kit.
     * @param {ISectionInfo} section The section.
     * @private
     */
    async function handleManualVerificationCase(member: GuildMember, checkRes: IReqCheckResult,
                                                verifKit: IVerificationKit, section: ISectionInfo): Promise<void> {
        const failedStr = checkRes.manualIssues.map(x => `- **[${x.key}]** ${x.value}`).join("\n");
        const logStr = checkRes.manualIssues.map(x => `- **[${x.key}]** ${x.log}`).join("\n");
        const buttonsToUse: MessageButton[] = [NO_MANUAL_VERIFY_BUTTON, MANUAL_VERIFY_BUTTON];

        verifKit.verifyStep?.send({
            content: section.isMainSection
                ? `[Main] ${member} tried to verify as **\`${checkRes.name}\`**, but there were several `
                + "minor issues with the person's profile. The user is currently being asked if they want"
                + " to get manually verified. The outstanding issues are listed below:\n" + logStr
                : `[${section.sectionName}] ${member} tried to verify, but there were several minor issues with the`
                + " person's profile. The user is currently being asked if they want to get manually"
                + " verified. The outstanding issues are listed below:\n" + logStr
        });

        const failEmbed = MessageUtilities.generateBlankEmbed(member.guild, "RED")
            .setTitle(
                section.isMainSection
                    ? `**${member.guild.name}**: Guild Verification Failed`
                    : `${member.guild.name} ⇨ **${section.sectionName}**: Section Verification Failed`
            )
            .setDescription(
                new StringBuilder()
                    .append("You have failed to meet one or more requirements. These requirements are listed ")
                    .append("below:")
                    .appendLine()
                    .append(failedStr)
                    .appendLine(2)
                    .append("*However*, you have the opportunity to get manually verified by a staff member. ")
                    .append("Please review the following options.")
                    .toString()
            )
            .addField(
                "No Manual Verification",
                "To prevent your profile from getting manually verified, click the **Deny Manual Verify**"
                + " button. If chosen, your profile will **not** be reviewed by staff, and you can verify again in"
                + " your free time."
            )
            .addField(
                "Allow Manual Verification",
                "If you want your profile to be manually verified, click the **Accept** button. If chosen,"
                + " your profile will be reviewed by staff. During manual verification, one or more server"
                + " staff member(s) will review your RealmEye profile. The staff member(s) will have the"
                + " final say in whether you get verified. Once the staff member(s) decide, you will be notified."
                + " **Keep in mind** that you will not be able to verify in this server or section until your"
                + " manual verification results come back, and you will **not** be able to stop this process."
            )
            .setFooter({text: "Respond By:"})
            .setTimestamp(Date.now() + 2 * 60 * 1000);

        const [m, , dmChannel] = await Promise.all([
            new Promise<Message | null>((resolve) => {
                if (!verifKit.msg) {
                    return resolve(
                        GlobalFgrUtilities.sendMsg(member, {
                            embeds: [failEmbed],
                            components: AdvancedCollector.getActionRowsFromComponents(buttonsToUse)
                        })
                    );
                }

                return resolve(verifKit.msg.edit({
                    embeds: [failEmbed],
                    components: AdvancedCollector.getActionRowsFromComponents(buttonsToUse)
                }));
            }),
            new Promise<void>((resolve) => {
                // no message available means this was done in section
                // thus, there is no base message to refer back to.
                if (!verifKit.msg)
                    return resolve();

                GlobalFgrUtilities.sendMsg(member, {
                    content: "You do not meet the requirements to verify in this server or section. Please review"
                        + " the above."
                });
                resolve();
            }),
            await member.createDM()
        ]);

        if (!m) {
            // Might be worth logging this
            return;
        }

        const selected = await AdvancedCollector.startInteractionCollector({
            oldMsg: m,
            acknowledgeImmediately: true,
            duration: 2 * 60 * 1000,
            clearInteractionsAfterComplete: true,
            deleteBaseMsgAfterComplete: false,
            targetAuthor: member,
            targetChannel: dmChannel
        });

        const acknowledgementEmbed = MessageUtilities.generateBlankEmbed(member.guild, "RED")
            .setTitle(
                section.isMainSection
                    ? `**${member.guild.name}**: Guild Verification Failed`
                    : `${member.guild.name} ⇨ **${section.sectionName}**: Section Verification Failed`
            )
            .setTimestamp();

        if (!selected || selected.customId === NO_MANUAL_VERIFY_ID) {
            verifKit.verifyFail?.send({
                content: section.isMainSection
                    ? `[Main] ${member} tried to verify as **\`${checkRes.name}\`**, but did not want to get `
                    + "manually verified."
                    : `[${section.sectionName}] ${member} tried to verify, but did not want to get manually verified.`
            });

            await m.edit({
                embeds: [acknowledgementEmbed.setDescription("You have chosen not to get manually verified. If you"
                    + " want to try to verify again, please start the verification process again.")],
                components: []
            });

            return;
        }

        verifKit.verifyFail?.send({
            content: section.isMainSection
                ? `[Main] ${member} tried to verify as **\`${checkRes.name}\`**, but did not meet the`
                + " requirements. They have opted for manual verification."
                : `[${section.sectionName}] ${member} tried to verify, but did not meet the requirements. They have`
                + " opted for manual verification."
        });

        await m.edit({
            embeds: [acknowledgementEmbed.setDescription("You have chosen to get manually verified. A staff"
                + " member will look through your profile shortly. Please do **not** make your profile private.")],
            components: []
        });

        await sendManualVerifyEmbedAndLog(member, checkRes, verifKit, section).catch();
    }

    /**
     * Sends the manual verification message to the appropriate channel and logs it in the database.
     * @param {GuildMember} member The member.
     * @param {IReqCheckResult} checkRes The check results.
     * @param {IVerificationKit} verifKit The verification "kit"
     * @param {ISectionInfo} section The section.
     * @private
     */
    async function sendManualVerifyEmbedAndLog(member: GuildMember, checkRes: IReqCheckResult,
                                               verifKit: IVerificationKit, section: ISectionInfo): Promise<void> {
        // Should never hit since this should've been pre-validated
        if (!verifKit.manualVerify)
            return;

        const descSb = new StringBuilder()
            .append(`The following user tried to verify in the section: **\`${section.sectionName}\`**.`).appendLine()
            .appendLine()
            .append("__**Discord Account**__").appendLine()
            .append(`- Discord Mention: ${member} (${member.id})`).appendLine()
            .append(`- Discord Tag: ${member.user.tag}`).appendLine()
            .append(`- Discord Created: ${TimeUtilities.getDateTime(member.user.createdAt)} GMT`).appendLine()
            .appendLine()
            .append("__**RotMG Account**__").appendLine()
            .append(`- Account IGN: **\`${checkRes.orig.name}\`**`).appendLine()
            .append(`- RealmEye Link: [Here](https://www.realmeye.com/player/${checkRes.orig.name}).`).appendLine()
            .append(`- Rank: **\`${checkRes.orig.rank}\`**`).appendLine()
            .append(`- Alive Fame: **\`${checkRes.orig.fame}\`**`).appendLine();
        if (checkRes.orig.created)
            descSb.append(`- Account Created: **\`${checkRes.orig.created}\`**`).appendLine();
        else if (checkRes.orig.firstSeen)
            descSb.append(`- First Seen: **\`${checkRes.orig.firstSeen}\`**`).appendLine();
        else
            descSb.append("- Account Created: **\`N/A\`**").appendLine();

        descSb.append(`- Last Seen: **\`${checkRes.orig.lastSeen}\`**`).appendLine();

        if (checkRes.orig.guild) {
            descSb.append(`- Guild: **\`${checkRes.orig.guild}\`**`).appendLine()
                .append(`- Guild Rank: **\`${checkRes.orig.guildRank}\`**`).appendLine();
        }

        descSb.append(`- RealmEye Description: ${StringUtil.codifyString(checkRes.orig.description.join("\n"))}`);

        const embed = MessageUtilities.generateBlankEmbed(member, "RED")
            .setTitle(`[${section.sectionName}] Manual Verification: **${checkRes.name}**`)
            .setDescription(descSb.toString())
            .addField(
                "Reason(s) for Manual Verification",
                checkRes.manualIssues.map(x => `- **${x.key}**: ${x.log}`).join("\n")
            );

        const manualVerifMsg = await verifKit.manualVerify.send({
            embeds: [embed],
            components: AdvancedCollector.getActionRowsFromComponents([
                new MessageButton()
                    .setLabel("Accept")
                    .setCustomId(MANUAL_VERIFY_ACCEPT_ID)
                    .setStyle("SUCCESS"),
                new MessageButton()
                    .setLabel("Deny")
                    .setCustomId(MANUAL_VERIFY_DENY_ID)
                    .setStyle("DANGER"),
                new MessageButton()
                    .setLabel("Start Modmail Thread")
                    .setCustomId(MANUAL_VERIFY_MODMAIL_ID)
                    .setStyle("PRIMARY")
            ])
        });

        await MongoManager.updateAndFetchGuildDoc({guildId: member.guild.id}, {
            $push: {
                manualVerificationEntries: {
                    userId: member.id,
                    ign: checkRes.name,
                    manualVerifyMsgId: manualVerifMsg.id,
                    manualVerifyChannelId: verifKit.manualVerify.id,
                    sectionId: section.uniqueIdentifier
                }
            }
        });
    }

    /**
     * Acknowledges a manual verification message. This should be called when the person decides to accept, or
     * reject, a manual verification application. This can either be called via the message that has the manual
     * verification information, or via a command.
     * @param {IManualVerificationEntry} manualVerifyRes The manual verification object.
     * @param {GuildMember} moderator The member that acknowledged this manual verification request.
     * @param {string} responseId The response ID. This should be the custom ID from the interaction.
     * @param {Message} [mVerifMsg] The message containing the manual verification message.
     * @returns {boolean} Whether this acknowledgement was completed without error.
     */
    export async function acknowledgeManualVerifyRes(manualVerifyRes: IManualVerificationEntry, moderator: GuildMember,
                                                     responseId: string, mVerifMsg?: Message): Promise<boolean> {
        // Get the manual verification channel
        // Needed so we can get the manual verification message and delete the message if needed
        const manualVerifChannel = GuildFgrUtilities.getCachedChannel<TextChannel>(
            moderator.guild,
            manualVerifyRes.manualVerifyChannelId
        )!;

        const [manualVerifMsg, member, guildDoc] = await Promise.all([
            mVerifMsg ?? GuildFgrUtilities.fetchMessage(manualVerifChannel, manualVerifyRes.manualVerifyMsgId),
            GuildFgrUtilities.fetchGuildMember(moderator.guild, manualVerifyRes.userId),
            MongoManager.getOrCreateGuildDoc(moderator.guild, true)
        ]);

        // No member = no point in getting them verified.
        // Remove all their messages.
        // Note that this should've been accounted for when a member leaves
        if (!member) {
            // Remove all entries with this person's user ID
            await MongoManager.updateAndFetchGuildDoc({guildId: moderator.guild.id}, {
                $pull: {
                    manualVerificationEntries: {
                        userId: manualVerifyRes.userId
                    }
                }
            });

            // Delete all manual verify messages
            await Promise.all(
                guildDoc.manualVerificationEntries
                    .filter(x => x.userId === manualVerifyRes.userId)
                    .map(async x => {
                        const channel = GuildFgrUtilities.getCachedChannel<TextChannel>(
                            moderator.guild,
                            x.manualVerifyChannelId
                        );

                        if (!channel)
                            return;

                        const relevantMsg = await GuildFgrUtilities.fetchMessage(channel, x.manualVerifyMsgId);
                        await relevantMsg?.delete().catch();
                    })
            );

            return false;
        }

        let section = guildDoc.guildSections.find(x => x.uniqueIdentifier === manualVerifyRes.sectionId);
        // No section = remove all manual verification requests for that section
        if (!section) {
            if (manualVerifyRes.sectionId !== "MAIN") {
                await MongoManager.updateAndFetchGuildDoc({guildId: moderator.guild.id}, {
                    $pull: {
                        manualVerificationEntries: {
                            sectionId: manualVerifyRes.sectionId
                        }
                    }
                });

                return false;
            }

            section = MongoManager.getMainSection(guildDoc);
        }

        // No verified role = no point in manually verifying that person.
        if (!GuildFgrUtilities.hasCachedRole(moderator.guild, section.roles.verifiedRoleId))
            return false;

        // Logging channels for logging success/failed manual verification reqs
        const verifySuccessChannel = GuildFgrUtilities.getCachedChannel<TextChannel>(
            moderator.guild,
            guildDoc.channels.loggingChannels.find(x => x.key === "VerifySuccess")?.value ?? ""
        );

        const verifyFailChannel = GuildFgrUtilities.getCachedChannel<TextChannel>(
            moderator.guild,
            guildDoc.channels.loggingChannels.find(x => x.key === "VerifyFail")?.value ?? ""
        );

        // Promises to resolve after evaluating the response ID
        const promises: (Promise<any> | undefined)[] = [];
        switch (responseId) {
            case (MANUAL_VERIFY_MODMAIL_ID): {
                return await ModmailManager.startModmailWithUser(member, moderator);
            }
            case (MANUAL_VERIFY_DENY_ID): {
                const finishedEmbed = MessageUtilities.generateBlankEmbed(member.guild, "RED")
                    .setTitle(
                        section.isMainSection
                            ? `**${member.guild.name}**: Guild Verification Denied`
                            : `**${member.guild.name}**: ${section.sectionName} Section Verification Denied`
                    )
                    .setTimestamp()
                    .setFooter({text: "Manual Verification Request Denied."})
                    .setDescription(
                        "Your manual verification request was **denied**. If you have any questions regarding why"
                        + " your request was denied, please message a staff member or send a modmail."
                    );

                promises.push(
                    manualVerifMsg?.delete().catch(),
                    GlobalFgrUtilities.sendMsg(member, {embeds: [finishedEmbed]}),
                    section.isMainSection
                        ? verifyFailChannel?.send({
                            content: `[Main] ${member} has tried to verify as **\`${manualVerifyRes.ign}\`**, but`
                                + ` their manual verification request was __denied__ by ${moderator}.`
                        })
                        : verifyFailChannel?.send({
                            content: `[${section.sectionName}] ${member} has tried to get manually verified, but`
                                + ` was __denied__ manual verification by ${moderator}.`
                        })
                );

                break;
            }
            case (MANUAL_VERIFY_ACCEPT_ID): {
                const finishedEmbed = MessageUtilities.generateBlankEmbed(member.guild, "GREEN")
                    .setTitle(
                        section.isMainSection
                            ? `**${member.guild.name}**: Guild Verification Successful`
                            : `**${member.guild.name}**: ${section.sectionName} Section Verification Successful`
                    )
                    .setTimestamp();
                if (section.otherMajorConfig.verificationProperties.verificationSuccessMessage) {
                    finishedEmbed.setDescription(
                        section.otherMajorConfig.verificationProperties.verificationSuccessMessage
                    );
                }
                else {
                    finishedEmbed.setDescription(
                        "You have successfully been verified in this server or section. Please make sure to read the"
                        + " applicable rules/guidelines. If you have any questions, please message a staff member."
                        + " Thanks!"
                    );
                }

                promises.push(
                    manualVerifMsg?.delete().catch(),
                    GlobalFgrUtilities.sendMsg(member, {embeds: [finishedEmbed]}),
                    member.roles.add(section.roles.verifiedRoleId).catch()
                );

                if (section.isMainSection) {
                    promises.push(
                        MongoManager.addIdNameToIdNameCollection(member, manualVerifyRes.ign),
                        GlobalFgrUtilities.tryExecuteAsync(async () => {
                            await member.setNickname(manualVerifyRes.ign, "Manually verified successfully.");
                        }),
                        verifySuccessChannel?.send({
                            content: `[Main] ${member} has been manually verified as **\`${manualVerifyRes.ign}\`** by`
                                + ` ${moderator}.`
                        }),
                    );
                }
                else {
                    promises.push(
                        verifySuccessChannel?.send({
                            content: `[${section.sectionName}] ${member} has been manually verified by ${moderator}.`
                        })
                    );
                }

                break;
            }
            default: {
                // Unknown code given.
                return false;
            }
        }

        promises.push(
            MongoManager.updateAndFetchGuildDoc({guildId: moderator.guild.id}, {
                $pull: {
                    manualVerificationEntries: {
                        sectionId: manualVerifyRes.sectionId,
                        userId: manualVerifyRes.userId
                    }
                }
            })
        );

        await Promise.all(promises);
        return true;
    }

    /**
     * Generates the embed that will be used for verification.
     * @param {GuildMember} member The member.
     * @param {string} ign The in-game name.
     * @param {string} code The verification code.
     * @param {IGuildInfo} guildDoc The guild document.
     * @param {IVerificationProperties} verifProps The verification properties.
     * @returns {MessageEmbed} The message embed containing the verification steps.
     * @private
     */
    function getVerifEmbed(member: GuildMember, ign: string, code: string, guildDoc: IGuildInfo,
                           verifProps: IVerificationProperties): MessageEmbed {
        return MessageUtilities.generateBlankEmbed(member.guild)
            .setTitle(`**${member.guild.name}**: Guild Verification`)
            .setDescription(new StringBuilder()
                .append(`You have selected the in-game name: **\`${ign}\`**. To access your Realm profile, click `)
                .append(`[here](https://www.realmeye.com/player/${ign}). If you don't have your RealmEye account `)
                .append("password, you can learn how to get one [here](https://www.realmeye.com/mreyeball#password).")
                .appendLine(2)
                .append("As a reminder, the requirements for verification is:")
                .append(StringUtil.codifyString(getVerificationRequirements(guildDoc, verifProps)))
                .append("Please complete the following steps. If you do not want to complete verification at this ")
                .append("time, press the **Cancel** button.")
                .toString())
            .setFooter({text: "You have 15 minutes to complete this process."})
            .addField(
                "1. Verification Code",
                new StringBuilder().append(`Your verification code is: ${StringUtil.codifyString(code)}`)
                    .append("Put this verification code in __one__ of your three lines of your RealmEye profile's ")
                    .append("description.")
                    .toString()
            )
            .addField(
                "2. Check Profile Settings",
                "Make sure anyone can see your general profile, exaltations, graveyard (summary), and name history."
                + " Additionally, make sure the bot can easily see that the above requirements are satisfied."
                + ` You can access your profile settings [here](https://www.realmeye.com/settings-of/${ign}).`
            )
            .addField(
                "3. Wait",
                "RealmEye may sometimes take a while before registering any chances. It is recommended that you wait"
                + " before continuing."
            )
            .addField(
                "4. Confirm",
                "Press the **Check Profile** button to begin the verification check. During this time, you won't be"
                + " able to do anything. If something goes wrong, an error message will be shown below."
            );
    }

    /**
     * Generates verification requirements from the given properties.
     * @param {IGuildInfo} guildDoc The guild document.
     * @param {IVerificationProperties} verifProps The verification properties.
     * @returns {string} The requirements.
     */
    export function getVerificationRequirements(guildDoc: IGuildInfo, verifProps: IVerificationProperties): string {
        const sb = new StringBuilder();
        if (!verifProps.checkRequirements)
            return sb.append("No Requirements.").toString();
        if (verifProps.verifReq.lastSeen.mustBeHidden)
            sb.append("- Private Location.").appendLine();
        if (verifProps.verifReq.rank.checkThis)
            sb.append(`- At Least ${verifProps.verifReq.rank.minRank} Stars.`).appendLine();
        if (verifProps.verifReq.guild.checkThis) {
            if (verifProps.verifReq.guild.guildName.checkThis)
                sb.append(`- In Guild: ${verifProps.verifReq.guild.guildName.name}.`).appendLine();
            if (verifProps.verifReq.guild.guildRank.checkThis) {
                if (verifProps.verifReq.guild.guildRank.exact)
                    sb.append(`- Must Be Rank: ${verifProps.verifReq.guild.guildRank.minRank}.`).appendLine();
                else
                    sb.append(`- Must Be At Least Rank: ${verifProps.verifReq.guild.guildRank.minRank}.`).appendLine();
            }
        }
        if (verifProps.verifReq.aliveFame.checkThis)
            sb.append(`- At Least ${verifProps.verifReq.aliveFame.minFame} Alive Fame.`).appendLine();
        if (verifProps.verifReq.characters.checkThis) {
            const checkPastDeaths = verifProps.verifReq.characters.checkPastDeaths;
            for (let i = 0; i < verifProps.verifReq.characters.statsNeeded.length; i++) {
                const numNeeded = verifProps.verifReq.characters.statsNeeded[i];
                if (numNeeded === 0)
                    continue;
                sb.append(`- ${numNeeded} ${i}/${NUMBER_OF_STATS} Characters`)
                    .append(checkPastDeaths ? " (Past Deaths Allowed)." : ".").appendLine();
            }
        }

        if (verifProps.verifReq.exaltations.checkThis) {
            let added = false;
            for (const stat in verifProps.verifReq.exaltations.minimum) {
                if (!verifProps.verifReq.exaltations.minimum.hasOwnProperty(stat))
                    continue;

                const numNeeded = verifProps.verifReq.exaltations.minimum[stat];
                if (numNeeded === 0) continue;
                // Put here so this shows up first on list
                if (!added) {
                    sb.append("- Exaltations is Public.").appendLine();
                    added = true;
                }
                const displayedVersion = SHORT_STAT_TO_LONG[stat][1];
                sb.append(`- ${numNeeded} ${displayedVersion} Exaltations.`).appendLine();
            }

            if (added && verifProps.verifReq.exaltations.onOneChar)
                sb.append("- Exaltations Must Be On One Character.").appendLine();
        }

        if (verifProps.verifReq.graveyardSummary.checkThis) {
            if (verifProps.verifReq.graveyardSummary.useBotCompletions) {
                for (const entry of verifProps.verifReq.graveyardSummary.botCompletions) {
                    if (entry.value === 0) continue;
                    const dgnInfo = DungeonUtilities.getDungeonInfo(entry.key, guildDoc);
                    if (!dgnInfo) continue;
                    sb.append(`- ${entry.value} ${dgnInfo.dungeonName} Completion Logged.`).appendLine();
                }
            }
            else {
                let added = false;
                for (const entry of verifProps.verifReq.graveyardSummary.realmEyeCompletions) {
                    if (entry.value === 0) continue;
                    // Put here so this shows up first on list
                    if (!added) {
                        sb.append("- Graveyard History is Public.").appendLine();
                        added = true;
                    }
                    const display = GY_HIST_TO_DISPLAY[entry.key];
                    sb.append(`- ${entry.value} ${display} Completions.`).appendLine();
                }
            }
        }

        return sb.toString().trim();
    }

    interface IReqCheckResult {
        name: string;
        conclusion: "PASS" | "TRY_AGAIN" | "MANUAL" | "FAIL";
        manualIssues: (IPropertyKeyValuePair<string, string> & { log: string; })[];
        fatalIssues: (IPropertyKeyValuePair<string, string> & { log: string; })[];
        taIssues: (IPropertyKeyValuePair<string, string> & { log: string; })[];
        orig: PAD.IPlayerData;
    }

    /**
     * Checks a series of requirements to ensure that they are fulfilled.
     * @param {GuildMember} member The member to check.
     * @param {ISectionInfo | IGuildInfo} section The section to check the requirements for.
     * @param {PrivateApiDefinitions.IPlayerData} resp The player's stats.
     * @return {Promise<IReqCheckResult>} The results of this check.
     * @private
     */
    async function checkRequirements(member: GuildMember, section: ISectionInfo | IGuildInfo,
                                     resp: PAD.IPlayerData): Promise<IReqCheckResult> {
        const guildDoc = "guildId" in section
            ? section
            : await MongoManager.getOrCreateGuildDoc(member.guild.id, true);
        const verifReq = section.otherMajorConfig.verificationProperties.verifReq;
        const result: IReqCheckResult = {
            name: resp.name,
            conclusion: "PASS",
            manualIssues: [],
            fatalIssues: [],
            taIssues: [],
            orig: resp
        };

        // Check requirements.
        // Start with generic requirements.
        if (verifReq.lastSeen.mustBeHidden && resp.lastSeen !== "hidden") {
            result.taIssues.push({
                key: "Last Seen Location is Not Private",
                value: "Your last seen location is not hidden. Please make sure no one can see it and then try again.",
                log: "User's last seen location is public."
            });
        }

        // Check guild. Failure to pass these tests will result in a fail.
        if (verifReq.guild.checkThis) {
            if (verifReq.guild.guildName.checkThis
                && resp.guild.toLowerCase() !== verifReq.guild.guildName.name.toLowerCase()) {
                const guildInDisplay = `**\`${resp.guild}\`**`;
                const guildNeededDisplay = `**\`${verifReq.guild.guildName.name}\`**`;
                result.fatalIssues.push({
                    key: "Not In Correct Guild",
                    value: resp.guild
                        ? `You are in the guild ${guildInDisplay} but must be in the guild ${guildNeededDisplay}.`
                        : `You are not in a guild but must be in the guild ${guildNeededDisplay}.`,
                    log: resp.guild
                        ? `User is in guild ${guildInDisplay} but must be in the guild ${guildNeededDisplay}.`
                        : `User is not in a guild but must be in the guild ${guildNeededDisplay}.`
                });
                result.conclusion = "FAIL";
                return result;
            }

            if (verifReq.guild.guildRank.checkThis) {
                const rankHasDisplay = `**\`${resp.guildRank}\`**`;
                const rankNeedDisplay = `**\`${verifReq.guild.guildRank.minRank}\`**`;

                if (verifReq.guild.guildRank.exact) {
                    if (verifReq.guild.guildRank.minRank !== resp.guildRank) {
                        result.fatalIssues.push({
                            key: "Not In Correct Guild",
                            value: resp.guild
                                ? `You have the rank ${rankHasDisplay} but must have the rank ${rankNeedDisplay}.`
                                : `You must be in the guild, **\`${verifReq.guild.guildName.name}\`**.`,
                            log: resp.guild
                                ? `User has the rank ${rankHasDisplay} but must have the rank ${rankNeedDisplay}.`
                                : `User is not in the guild **\`${verifReq.guild.guildName.name}\`**.`
                        });
                        result.conclusion = "FAIL";
                        return result;
                    }
                }
                else if (!isValidGuildRank(verifReq.guild.guildRank.minRank, resp.guildRank)) {
                    result.fatalIssues.push({
                        key: "Invalid Guild Rank",
                        value: resp.guild
                            ? `You have the rank ${rankHasDisplay} but must have at least rank ${rankNeedDisplay}.`
                            : `You must be in the guild, **\`${verifReq.guild.guildName.name}\`**.`,
                        log: resp.guild
                            ? `User has the rank ${rankHasDisplay} but must have at least rank ${rankNeedDisplay}.`
                            : `User is not in the guild **\`${verifReq.guild.guildName.name}\`**.`
                    });
                    result.conclusion = "FAIL";
                    return result;
                }
            }
        }

        // Check rank.
        if (verifReq.rank.checkThis && resp.rank < verifReq.rank.minRank) {
            result.manualIssues.push({
                key: "Rank Too Low",
                value: `You have **\`${resp.rank}\`** stars out of the ${verifReq.rank.minRank} required stars needed.`,
                log: `User has **\`${resp.rank}\`**/${verifReq.rank.minRank} required stars needed.`
            });
        }

        // Check alive fame.
        if (verifReq.aliveFame.checkThis && resp.fame < verifReq.aliveFame.minFame) {
            result.manualIssues.push({
                key: "Alive Fame Too Low",
                value: `You have **\`${resp.fame}\`** alive fame out of the ${verifReq.aliveFame.minFame} `
                    + "required alive fame.",
                log: `User has **\`${resp.fame}\`**/${verifReq.aliveFame.minFame} required alive fame.`
            });
        }

        const gyHist = await RealmSharperWrapper.getGraveyardSummary(resp.name);
        // Check characters.
        if (verifReq.characters.checkThis) {
            // Clone copy since arrays are passed by reference/values.
            const neededStats: number[] = [];
            for (const stat of verifReq.characters.statsNeeded)
                neededStats.push(stat);

            // If we can check past deaths, let's update the array of neededStats to reflect that.
            if (verifReq.characters.checkPastDeaths && gyHist) {
                const stats = gyHist.statsCharacters.map(x => x.stats);
                for (const statInfo of stats) {
                    for (let i = 0; i < statInfo.length; i++) {
                        if (neededStats[i] > 0) {
                            neededStats[i] -= statInfo[i];
                            continue;
                        }

                        // If the stat in question is already fulfilled, we check if any of the lower stats need to
                        // be checked.
                        for (let j = i - 1; j >= 0; j--) {
                            if (neededStats[j] > 0) {
                                neededStats[j] -= statInfo[i];
                                break;
                            }
                        }
                    }
                }
            }

            // Here, we can check each character's individual stats.
            for (const character of resp.characters.filter(x => x.statsMaxed !== -1)) {
                if (neededStats[character.statsMaxed] > 0) {
                    neededStats[character.statsMaxed]--;
                    continue;
                }

                for (let i = character.statsMaxed - 1; i >= 0; i--) {
                    if (neededStats[i] > 0) {
                        neededStats[i]--;
                        break;
                    }
                }
            }

            if (neededStats.some(x => x > 0)) {
                const missingStats = new StringBuilder();
                for (let i = 0; i < neededStats.length; i++) {
                    if (neededStats[i] <= 0) continue;
                    missingStats.append(`- Need ${neededStats[i]} ${i}/${NUMBER_OF_STATS}s`)
                        .appendLine();
                }

                const displayStr = StringUtil.codifyString(missingStats.toString());
                result.manualIssues.push({
                    key: "Stats Requirement Not Fulfilled",
                    value: `You need to fulfill the following stats requirements: ${displayStr}`,
                    log: `User needs to fulfill the following stats requirements: ${displayStr}`
                });
            }
        }

        if (verifReq.graveyardSummary.checkThis) {
            const issues: string[] = [];
            const logIssues: string[] = [];
            if (verifReq.graveyardSummary.useBotCompletions) {
                const completionsNeeded = new Collection<string, number>(
                    verifReq.graveyardSummary.botCompletions.map(x => [x.key, x.value])
                );
                const userDoc = await MongoManager.getUserDoc(resp.name);
                const loggedInfo = userDoc.length === 0
                    ? new Collection<string, number>()
                    : LoggerManager.getCompletedDungeons(userDoc[0], member.guild.id);

                let allPassed = true;
                for (const [dgnId, amt] of loggedInfo) {
                    const dgnInfo = DungeonUtilities.getDungeonInfo(dgnId, guildDoc);
                    if (!dgnInfo)
                        continue;

                    if (completionsNeeded.has(dgnId)) {
                        const newAmt = completionsNeeded.get(dgnId)! - amt;
                        if (newAmt <= 0) {
                            completionsNeeded.delete(dgnId);
                            continue;
                        }

                        allPassed = false;
                        issues.push(
                            `- ${newAmt}/${completionsNeeded.get(dgnId)!} ${dgnInfo.dungeonName} Completions Logged.`
                        );
                        logIssues.push(
                            `- ${newAmt}/${completionsNeeded.get(dgnId)!} ${dgnInfo.dungeonName} Completions Logged.`
                        );
                    }
                }

                if (!allPassed) {
                    const normalDisplay = StringUtil.codifyString(issues.join("\n"));
                    const logDisplay = StringUtil.codifyString(logIssues.join("\n"));
                    result.manualIssues.push({
                        key: "Dungeon Completion Requirement Not Fulfilled",
                        value: `You still need to satisfy the following dungeon requirements: ${normalDisplay}`,
                        log: `User has not fulfilled the following dungeon requirements: ${logDisplay}`
                    });
                }
            }
            else {
                if (!gyHist) {
                    result.taIssues.push({
                        key: "Graveyard History Private",
                        value: "I am not able to access your graveyard summary. Make sure your graveyard is set so"
                            + " anyone can see it and then try again.",
                        log: "User's graveyard information is private."
                    });
                }
                else {
                    for (const gyStat of verifReq.graveyardSummary.realmEyeCompletions) {
                        if (!(gyStat.key in DISPLAY_TO_GY_HIST)) continue;
                        const gyHistKey = DISPLAY_TO_GY_HIST[gyStat.key];
                        const data = gyHist.properties.find(x => x.achievement === gyHistKey);
                        // Doesn't qualify because dungeon doesn't exist.
                        if (!data) {
                            issues.push(`- You do not have any ${gyStat.key} completions.`);
                            logIssues.push(`- No ${gyStat.key} completions.`);
                            continue;
                        }

                        // Doesn't qualify because not enough
                        if (gyStat.value > data.total) {
                            issues.push(
                                `- You have ${data.total} / ${gyStat.key} total ${gyStat.key} completions needed.`
                            );
                            logIssues.push(`- ${data.total} / ${gyStat.key} total ${gyStat.key} completions.`);
                        }
                    }

                    if (issues.length > 0) {
                        const normalDisplay = StringUtil.codifyString(issues.join("\n"));
                        const logDisplay = StringUtil.codifyString(logIssues.join("\n"));
                        result.manualIssues.push({
                            key: "Dungeon Completion Requirement Not Fulfilled",
                            value: `You still need to satisfy the following dungeon requirements: ${normalDisplay}`,
                            log: `User has not fulfilled the following dungeon requirements: ${logDisplay}`
                        });
                    }
                }
            }
        }

        if (verifReq.exaltations.checkThis) {
            const exaltData = await RealmSharperWrapper.getExaltation(resp.name);
            if (!exaltData) {
                result.taIssues.push({
                    key: "Exaltation Information Private",
                    value: "I am not able to access your exaltation data. Make sure anyone can see your exaltation "
                        + "data and then try again.",
                    log: "User's exaltation information is private."
                });
            }
            else {
                // We use this variable to keep track of each stat and corresponding exaltations needed.
                // neededExalt will have keys "att" "spd" "hp" etc
                const neededExalt: { [s: string]: number } = {};
                for (const d of Object.keys(SHORT_STAT_TO_LONG))
                    neededExalt[d] = verifReq.exaltations.minimum[d];

                if (verifReq.exaltations.onOneChar) {
                    for (const entry of exaltData.exaltations) {
                        let passed = true;
                        // exaltationStats will have keys like "attack" "speed" "health" etc
                        for (const longStat in entry.exaltationStats) {
                            if (!entry.exaltationStats.hasOwnProperty(longStat))
                                continue;

                            const shortenedStat = LONG_STAT_TO_SHORT[longStat];
                            if (neededExalt[shortenedStat] - entry.exaltationStats[longStat] > 0) {
                                passed = false;
                                break;
                            }
                        }

                        // If passed, then set neededExalts to 0. Otherwise, try again
                        if (passed) {
                            for (const k in neededExalt) {
                                if (!neededExalt.hasOwnProperty(k))
                                    continue;

                                neededExalt[k] = 0;
                            }
                            break;
                        }
                    }
                }
                else {
                    for (const entry of exaltData.exaltations) {
                        for (const longStat in entry.exaltationStats) {
                            if (!entry.exaltationStats.hasOwnProperty(longStat))
                                continue;

                            const shortenedStat = LONG_STAT_TO_SHORT[longStat];
                            neededExalt[shortenedStat] -= entry.exaltationStats[longStat];
                        }
                    }
                }

                // If we happen to have any stats whose exaltation number is > 0, then we want to show them.
                const notMetExaltations = Object.keys(neededExalt)
                    .filter(x => neededExalt[x] > 0);

                if (notMetExaltations.length > 0) {
                    const issuesExaltations = new StringBuilder();
                    if (verifReq.exaltations.onOneChar) {
                        issuesExaltations.append(
                            "- You do not have one character that meets all exaltation requirements."
                        ).appendLine();
                    }
                    else {
                        for (const statNotFulfilled of notMetExaltations) {
                            const statName = SHORT_STAT_TO_LONG[statNotFulfilled];
                            issuesExaltations.append(`- Need ${neededExalt[statNotFulfilled]} ${statName[1]}`)
                                .append(" Exaltations.")
                                .appendLine();
                        }
                    }

                    const strDisplay = StringUtil.codifyString(issuesExaltations.toString());
                    result.manualIssues.push({
                        key: "Exaltation Requirement Not Satisfied",
                        value: `You did not satisfy one or more exaltation requirements: ${strDisplay}`,
                        log: `User did not satisfy one or more exaltation requirements: ${strDisplay}`
                    });
                }
            }
        }

        // Assess whether this person passed verification requirements.
        if (result.fatalIssues.length > 0)
            result.conclusion = "FAIL";
        else if (result.taIssues.length > 0)
            result.conclusion = "TRY_AGAIN";
        else if (result.manualIssues.length > 0)
            result.conclusion = "MANUAL";
        else
            result.conclusion = "PASS";

        if (result.conclusion === "MANUAL" && !GuildFgrUtilities.hasCachedChannel(
            member.guild,
            section.channels.verification.manualVerificationChannelId
        )) {
            result.conclusion = "FAIL";
        }

        return result;
    }

    /**
     * Checks whether a person has the required guild rank or higher.
     * @param {string} minNeeded The minimum rank needed.
     * @param {string} actual The person's rank.
     * @return {boolean} Whether the rank is good.
     */
    export function isValidGuildRank(minNeeded: string, actual: string): boolean {
        if (minNeeded === actual) return true;
        const idx = GUILD_ROLES.indexOf(minNeeded);
        if (idx === -1)
            return false;

        for (let i = idx; i >= 0; i--) {
            if (GUILD_ROLES[i] === actual)
                return true;
        }

        return false;
    }
}