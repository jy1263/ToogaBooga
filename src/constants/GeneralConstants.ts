import {IPermAllowDeny} from "../definitions/major/IPermAllowDeny";

export namespace GeneralConstants {
    // These will be used for role permissions.
    // PD = Program defined. These are essentially constants that will be used as placeholders for the actual
    // section or guild role IDs and will be stored in the database as the PD type.
    // User-defined role IDs will be defined in the database as the role ID.
    export const EVERYONE_ROLE: string = "PD-{EVERYONE}";
    export const MEMBER_ROLE: string = "PD-{MEMBER_ROLE}";
    export const SECURITY_ROLE: string = "PD-{SECURITY_ROLE}";
    export const OFFICER_ROLE: string = "PD-{OFFICER_ROLE}";
    export const MODERATOR_ROLE: string = "PD-{MODERATOR_ROLE}";
    export const UNIVERSAL_LEADER_ROLE: string = "PD-{UNIVERSAL_RL}";
    export const UNIVERSAL_ALMOST_LEADER_ROLE: string = "PD-{UNIVERSAL_ARL}";
    export const UNIVERSAL_HEAD_LEADER_ROLE: string = "PD-{UNIVERSAL_HRL}";
    export const SECTION_ALMOST_LEADER_ROLE: string = "PD-{SECTION_ARL}";
    export const SECTION_LEADER_ROLE: string = "PD-{SECTION_RL}";
    export const SECTION_HEAD_LEADER_ROLE: string = "PD-{SECTION_HRL}";

    export const ALL_PD_DEFINED_ROLES: string[] = [
        EVERYONE_ROLE,
        MEMBER_ROLE,
        SECURITY_ROLE,
        OFFICER_ROLE,
        MODERATOR_ROLE,
        UNIVERSAL_ALMOST_LEADER_ROLE,
        UNIVERSAL_LEADER_ROLE,
        UNIVERSAL_HEAD_LEADER_ROLE,
        SECTION_ALMOST_LEADER_ROLE,
        SECTION_LEADER_ROLE,
        SECTION_HEAD_LEADER_ROLE
    ];

    export const DEFAULT_AFK_CHECK_PERMISSIONS: (IPermAllowDeny & {id: string;})[] = [
        {
            id: EVERYONE_ROLE,
            allow: [],
            deny: ["VIEW_CHANNEL", "SPEAK", "STREAM", "CONNECT"]
        },
        {
            id: MEMBER_ROLE,
            allow: ["VIEW_CHANNEL"],
            deny: []
        },
        {
            id: SECURITY_ROLE,
            allow: ["CONNECT", "SPEAK", "MUTE_MEMBERS", "MOVE_MEMBERS", "STREAM"],
            deny: []
        },
        {
            id: OFFICER_ROLE,
            allow: ["VIEW_CHANNEL", "CONNECT", "SPEAK", "MUTE_MEMBERS", "DEAFEN_MEMBERS", "MOVE_MEMBERS", "STREAM"],
            deny: []
        },
        {
            id: MODERATOR_ROLE,
            allow: ["VIEW_CHANNEL", "CONNECT", "SPEAK", "MUTE_MEMBERS", "DEAFEN_MEMBERS", "MOVE_MEMBERS", "STREAM"],
            deny: []
        },
        {
            id: UNIVERSAL_ALMOST_LEADER_ROLE,
            allow: ["VIEW_CHANNEL", "CONNECT", "SPEAK", "MUTE_MEMBERS", "MOVE_MEMBERS", "STREAM"],
            deny: []
        },
        {
            id: UNIVERSAL_LEADER_ROLE,
            allow: ["VIEW_CHANNEL", "CONNECT", "SPEAK", "MUTE_MEMBERS", "MOVE_MEMBERS", "DEAFEN_MEMBERS", "STREAM"],
            deny: []
        },
        {
            id: UNIVERSAL_HEAD_LEADER_ROLE,
            allow: ["VIEW_CHANNEL", "CONNECT", "SPEAK", "MUTE_MEMBERS", "DEAFEN_MEMBERS", "MOVE_MEMBERS", "STREAM"],
            deny: []
        },
        {
            id: SECTION_ALMOST_LEADER_ROLE,
            allow: ["CONNECT", "SPEAK", "MUTE_MEMBERS", "MOVE_MEMBERS", "STREAM"],
            deny: []
        },
        {
            id: SECTION_LEADER_ROLE,
            allow: ["CONNECT", "SPEAK", "MUTE_MEMBERS", "MOVE_MEMBERS", "DEAFEN_MEMBERS", "STREAM"],
            deny: []
        },
        {
            id: SECTION_HEAD_LEADER_ROLE,
            allow: ["CONNECT", "SPEAK", "MUTE_MEMBERS", "DEAFEN_MEMBERS", "MOVE_MEMBERS", "STREAM"],
            deny: []
        }
    ];
}