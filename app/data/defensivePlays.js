/**
 * @file defensivePlays.js
 * Exhaustive slow-pitch softball defensive playbook and situational alignment database.
 * Supports standard ASA/USA Softball and USSSA 10-player defensive alignments
 * (P, C, 1B, 2B, 3B, SS, LF, LC, RC, RF).
 *
 * All coordinates are normalized percentage coordinates (0 to 100):
 * - Home Plate: { x: 50, y: 78 }
 * - Pitcher: { x: 50, y: 62 }
 * - First Base: { x: 66, y: 56 }
 * - Second Base: { x: 50, y: 48 }
 * - Third Base: { x: 34, y: 56 }
 */

/**
 * Valid standard defensive play categories.
 * @type {readonly string[]}
 */
export const PLAY_CATEGORIES = Object.freeze([
    "Bases Empty",
    "Runner on 1st",
    "Scoring Position",
    "Runners on 1st & 2nd",
    "First & Third",
    "Bases Loaded",
]);

/**
 * Valid play subcategories.
 * @type {readonly string[]}
 */
export const PLAY_SUBCATEGORIES = Object.freeze([
    "Base Hit",
    "Extra Bases",
    "Double Play",
    "Fly Ball / Tag",
    "Infield Grounder",
]);

/**
 * Exhaustive array of slow-pitch softball defensive situational plays.
 * @type {Array<Object>}
 */
export const DEFENSIVE_PLAYS = [
    {
        id: "bases-empty-gb-3b",
        title: "Routine Ground Ball to 3B",
        category: "Bases Empty",
        subCategory: "Infield Grounder",
        tags: ["routine", "3B-play", "throw-to-1b", "bases-empty"],
        situation: {
            outs: 0,
            runners: [],
            batterHand: "R",
            hitType: "Sharp ground ball to 3B",
            description:
                "Routine ground ball fielded by 3B, fired across the diamond to 1B for the out.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Fielded",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Play at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 62,
                },
                role: "Back up play",
                priority: "backup",
                notes: "Clear throwing lane between 3B and 1B; shade toward 1B line.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 58,
                    y: 68,
                },
                role: "Trail batter-runner",
                priority: "backup",
                notes: "Hustle down 1B line behind runner in case of overthrow.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Receive throw at 1B",
                priority: "primary",
                notes: "Find the bag early, present high chest target, stretch toward the throw.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover second base in case runner makes wide turn or overthrow.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Field grounder and throw",
                priority: "primary",
                notes: "Field out in front, plant right foot, deliver accurate strike to 1B.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 36,
                    y: 53,
                },
                role: "Back up 3B",
                priority: "backup",
                notes: "Move laterally behind 3B to field any bobble or deflection.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 44,
                },
                role: "Back up 3B line",
                priority: "backup",
                notes: "Charge toward foul line backing up 3B on grounder.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 38,
                    y: 30,
                },
                role: "Back up infield",
                priority: "backup",
                notes: "Move in toward second base.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 58,
                    y: 30,
                },
                role: "Back up infield",
                priority: "backup",
                notes: "Shade toward right-center in case of high overthrow.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 70,
                    y: 54,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint aggressively to back up throw from 3B behind 1B bag.",
            },
        ],
    },
    {
        id: "bases-empty-gb-ss",
        title: "Routine Ground Ball to Shortstop",
        category: "Bases Empty",
        subCategory: "Infield Grounder",
        tags: ["routine", "SS-play", "throw-to-1b", "bases-empty"],
        situation: {
            outs: 0,
            runners: [],
            batterHand: "R",
            hitType: "Sharp ground ball to Shortstop",
            description:
                "Routine ground ball fielded by SS, balanced crow-hop, throw to 1B for the out.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 43,
                    y: 50,
                },
                label: "Fielded",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Play at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 52,
                    y: 60,
                },
                role: "Clear throwing lane",
                priority: "backup",
                notes: "Drop head and clear throwing lane from SS to 1B.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 58,
                    y: 68,
                },
                role: "Trail runner",
                priority: "backup",
                notes: "Hustle down 1B line in foul ground to back up errant throw.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Receive throw at 1B",
                priority: "primary",
                notes: "Anchor foot to inside corner of bag, stretch toward SS throw.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag in case of overthrow or deflection.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Hold 3B base and communicate bag callouts.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 43,
                    y: 50,
                },
                role: "Field grounder and throw to 1B",
                priority: "primary",
                notes: "Stay low, field on left-eye side, shuffle, fire strong throw to 1B.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 30,
                    y: 38,
                },
                role: "Back up SS",
                priority: "backup",
                notes: "Charge toward shortstop to back up through ball.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 40,
                    y: 30,
                },
                role: "Back up middle infield",
                priority: "backup",
                notes: "Back up SS trajectory and communicate depth.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 58,
                    y: 30,
                },
                role: "Shade to 2B",
                priority: "backup",
                notes: "Back up 2B bag on wide throws.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 72,
                    y: 52,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint to back up throw from SS behind 1B foul line.",
            },
        ],
    },
    {
        id: "bases-empty-gb-2b",
        title: "Routine Ground Ball to Second Base",
        category: "Bases Empty",
        subCategory: "Infield Grounder",
        tags: ["routine", "2B-play", "throw-to-1b", "bases-empty"],
        situation: {
            outs: 0,
            runners: [],
            batterHand: "L",
            hitType: "Routine ground ball to 2B",
            description:
                "Grounder fielded cleanly by 2B, short underhand or crisp overhand throw to 1B.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 57,
                    y: 50,
                },
                label: "Fielded",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Play at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 58,
                    y: 60,
                },
                role: "Shade toward 1B",
                priority: "backup",
                notes: "Take 2-3 steps toward 1B line in case 1B is pulled off bag.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 54,
                    y: 72,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Stay at home plate and direct fielders.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Receive throw at 1B",
                priority: "primary",
                notes: "Give big chest target, keep foot on bag, scoop low throw.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 57,
                    y: 50,
                },
                role: "Field grounder and throw to 1B",
                priority: "primary",
                notes: "Field in center of body, stay balanced, quick flick or throw to 1B.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Stay at 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Sprint to cover second base bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 38,
                },
                role: "Hold outfield depth",
                priority: "backup",
                notes: "Shift toward middle.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Back up 2B bag",
                priority: "backup",
                notes: "Angle toward 2B bag in case of deflection.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 60,
                    y: 32,
                },
                role: "Back up 2B fielder",
                priority: "backup",
                notes: "Charge toward 2B fielding position for backup.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 48,
                },
                role: "Back up 1B line",
                priority: "backup",
                notes: "Back up 1B bag in foul territory.",
            },
        ],
    },
    {
        id: "bases-empty-gb-1b",
        title: "Ground Ball to 1B - Pitcher Covers",
        category: "Bases Empty",
        subCategory: "Infield Grounder",
        tags: ["P-covers-1B", "1B-play", "bases-empty"],
        situation: {
            outs: 0,
            runners: [],
            batterHand: "L",
            hitType: "Slow or wide grounder pulling 1B off the bag",
            description:
                "1B fields wide grounder, Pitcher sprints to cover 1B bag and receives underhand toss.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 71,
                    y: 53,
                },
                label: "Fielded",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Play at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 65,
                    y: 56,
                },
                role: "Sprint to cover 1B bag",
                priority: "primary",
                notes: "Sprint immediately toward 1B line, turn up along inside foul line to receive chest-high toss.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 58,
                    y: 68,
                },
                role: "Trail runner down line",
                priority: "backup",
                notes: "Trail batter down 1B line in foul ground.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 71,
                    y: 53,
                },
                role: "Field grounder and feed P",
                priority: "primary",
                notes: "Field cleanly, lead Pitcher with firm, chest-high underhand toss before pitcher reaches bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 62,
                    y: 51,
                },
                role: "Back up 1B grounder",
                priority: "backup",
                notes: "Trail behind 1B to back up grounder.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Stay at 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag in case runner attempts to advance on bobble.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 38,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold positioning.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Back up 2B bag",
                priority: "backup",
                notes: "Shade toward 2B bag.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 64,
                    y: 32,
                },
                role: "Back up 1B/2B",
                priority: "backup",
                notes: "Charge toward right side infield.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 78,
                    y: 46,
                },
                role: "Back up 1B area",
                priority: "backup",
                notes: "Sprint down right field line to back up 1B bag.",
            },
        ],
    },
    {
        id: "bases-empty-gb-p",
        title: "Comebacker Ground Ball to Pitcher",
        category: "Bases Empty",
        subCategory: "Infield Grounder",
        tags: ["comebacker", "pitcher-play", "throw-to-1b", "bases-empty"],
        situation: {
            outs: 0,
            runners: [],
            batterHand: "R",
            hitType: "Hard comebacker on the ground to Pitcher",
            description:
                "Pitcher fields grounder up the middle, sets feet, and throws to 1B for the out.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 50,
                    y: 61,
                },
                label: "Fielded",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Play at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 61,
                },
                role: "Field comebacker and throw to 1B",
                priority: "primary",
                notes: "Protect self, field ball, pause to gain balance, fire firm chest-high throw to 1B.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Direct throw and callout",
                priority: "backup",
                notes: 'Yell "1! 1! Take your time!" to guide pitcher.',
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Receive throw at 1B",
                priority: "primary",
                notes: "Get to bag quickly, present wide target.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 55,
                    y: 50,
                },
                role: "Back up pitcher",
                priority: "backup",
                notes: "Pinch toward middle to back up ball through mound.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Hold 3B base.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 45,
                    y: 50,
                },
                role: "Back up pitcher",
                priority: "backup",
                notes: "Pinch toward middle to back up ball through mound.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 38,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field depth.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 40,
                    y: 30,
                },
                role: "Back up 2B bag",
                priority: "backup",
                notes: "Move in toward second base.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 60,
                    y: 30,
                },
                role: "Back up 2B bag",
                priority: "backup",
                notes: "Move in toward second base.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 50,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint to back up throw at 1B bag.",
            },
        ],
    },
    {
        id: "bases-empty-single-lf",
        title: "Clean Single to Left Field",
        category: "Bases Empty",
        subCategory: "Base Hit",
        tags: ["single", "left-field", "cutoff-to-2b", "bases-empty"],
        situation: {
            outs: 0,
            runners: [],
            batterHand: "R",
            hitType: "Sharp ground ball or line drive single to Left Field",
            description:
                "LF charges and fields single, throws through SS cutoff into 2B bag to hold batter to a single.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 26,
                    y: 38,
                },
                label: "Fielded",
            },
            {
                step: 0.7,
                pos: {
                    x: 38,
                    y: 44,
                },
                label: "Cutoff / Relay",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 48,
                },
                label: "Play at 2B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 48,
                    y: 58,
                },
                role: "Back up infield",
                priority: "backup",
                notes: "Back up throw to 2B.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Hold home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Watch batter-runner touch 1B, alert defense if runner rounds hard.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Straddle 2B bag, prepare for tag or catch to hold runner.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 38,
                    y: 44,
                },
                role: "Cutoff to 2B",
                priority: "cutoff",
                notes: "Line up between LF and 2B bag, hands high, ready to cut or let ball go through.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 38,
                },
                role: "Field single and throw to 2B",
                priority: "primary",
                notes: "Charge ball hard, field on glove side, deliver firm strike to 2B through SS cutoff.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 32,
                    y: 32,
                },
                role: "Back up LF",
                priority: "backup",
                notes: "Sprint to back up LF in case ball gets past.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 55,
                    y: 32,
                },
                role: "Shade to 2B",
                priority: "backup",
                notes: "Shade toward center field.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 72,
                    y: 40,
                },
                role: "Shade middle",
                priority: "backup",
                notes: "Move in slightly.",
            },
        ],
    },
    {
        id: "bases-empty-single-lc",
        title: "Clean Single to Left Center",
        category: "Bases Empty",
        subCategory: "Base Hit",
        tags: ["single", "left-center", "cutoff-to-2b", "bases-empty"],
        situation: {
            outs: 0,
            runners: [],
            batterHand: "R",
            hitType: "Solid line drive single into LC gap",
            description:
                "LC fields single, throws through SS cutoff into 2B bag to prevent double.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 38,
                    y: 30,
                },
                label: "Fielded",
            },
            {
                step: 0.7,
                pos: {
                    x: 44,
                    y: 41,
                },
                label: "Cutoff / Relay",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 48,
                },
                label: "Play at 2B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 48,
                    y: 58,
                },
                role: "Back up throw",
                priority: "backup",
                notes: "Back up 2B bag.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Hold home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Ensure batter touches 1B.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag, give target to thrower/cutoff.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 44,
                    y: 41,
                },
                role: "Cutoff to 2B",
                priority: "cutoff",
                notes: "Line up directly between LC and 2B bag at edge of outfield grass.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 30,
                    y: 32,
                },
                role: "Back up LC",
                priority: "backup",
                notes: "Sprint toward LC to back up fielding.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 38,
                    y: 30,
                },
                role: "Field ball and throw to 2B",
                priority: "primary",
                notes: "Field ball cleanly, hit cutoff chest high.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 48,
                    y: 26,
                },
                role: "Back up LC",
                priority: "backup",
                notes: "Converge behind LC to back up fielding.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 70,
                    y: 38,
                },
                role: "Hold positioning",
                priority: "backup",
                notes: "Hold right field depth.",
            },
        ],
    },
    {
        id: "bases-empty-single-rc",
        title: "Clean Single to Right Center",
        category: "Bases Empty",
        subCategory: "Base Hit",
        tags: ["single", "right-center", "cutoff-to-2b", "bases-empty"],
        situation: {
            outs: 0,
            runners: [],
            batterHand: "L",
            hitType: "Sharp line drive single into RC gap",
            description:
                "RC fields single, throws through 2B cutoff into 2B bag covered by SS.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 62,
                    y: 30,
                },
                label: "Fielded",
            },
            {
                step: 0.7,
                pos: {
                    x: 56,
                    y: 41,
                },
                label: "Cutoff / Relay",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 48,
                },
                label: "Play at 2B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 52,
                    y: 58,
                },
                role: "Back up throw",
                priority: "backup",
                notes: "Back up throw toward 2B bag.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Hold home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Verify batter touches 1B.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 56,
                    y: 41,
                },
                role: "Cutoff to 2B",
                priority: "cutoff",
                notes: "Line up directly between RC and 2B bag, call for throw.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag and direct cutoff position.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 38,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field depth.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 50,
                    y: 26,
                },
                role: "Back up RC",
                priority: "backup",
                notes: "Sprint toward right-center to back up RC.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 62,
                    y: 30,
                },
                role: "Field ball and throw to 2B",
                priority: "primary",
                notes: "Field cleanly, hit 2B cutoff chest high.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 70,
                    y: 32,
                },
                role: "Back up RC",
                priority: "backup",
                notes: "Sprint toward RC to back up play.",
            },
        ],
    },
    {
        id: "bases-empty-single-rf",
        title: "Clean Single to Right Field",
        category: "Bases Empty",
        subCategory: "Base Hit",
        tags: ["single", "right-field", "cutoff-to-2b", "bases-empty"],
        situation: {
            outs: 0,
            runners: [],
            batterHand: "L",
            hitType: "Sharp ground ball or line drive single to Right Field",
            description:
                "RF fields single, throws through 2B cutoff into 2B bag covered by SS.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 74,
                    y: 38,
                },
                label: "Fielded",
            },
            {
                step: 0.7,
                pos: {
                    x: 62,
                    y: 44,
                },
                label: "Cutoff / Relay",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 48,
                },
                label: "Play at 2B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 52,
                    y: 58,
                },
                role: "Back up throw",
                priority: "backup",
                notes: "Back up throw to 2B bag.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Hold home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Watch batter touch 1B, alert if runner rounds.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 62,
                    y: 44,
                },
                role: "Cutoff to 2B",
                priority: "cutoff",
                notes: "Line up between RF and 2B bag with hands up.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag and direct 2B cutoff alignment.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 44,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Shade toward 2B bag.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 68,
                    y: 32,
                },
                role: "Back up RF",
                priority: "backup",
                notes: "Sprint toward RF to back up fielding.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 38,
                },
                role: "Field ball and throw to 2B",
                priority: "primary",
                notes: "Field out in front, crow-hop, throw through 2B cutoff to 2B bag.",
            },
        ],
    },
    {
        id: "bases-empty-xbh-lf-line",
        title: "Extra-Base Hit Down LF Line",
        category: "Bases Empty",
        subCategory: "Extra Bases",
        tags: [
            "extra-bases",
            "double",
            "LF-line",
            "cutoff-to-3b",
            "bases-empty",
        ],
        situation: {
            outs: 0,
            runners: [],
            batterHand: "R",
            hitType: "Driven down the LF foul line into deep left corner",
            description:
                "LF tracks ball into corner. SS goes out as deep relay, 3B covers 3B bag, 2B covers 2B bag.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 15,
                    y: 42,
                },
                label: "Fielded in Corner",
            },
            {
                step: 0.7,
                pos: {
                    x: 26,
                    y: 50,
                },
                label: "Relay Throw",
            },
            {
                step: 1,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Play at 3B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 26,
                    y: 58,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Sprint to back up throw to 3B in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Stay at home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Ensure batter-runner touches 1B, then trail runner.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to prevent cheap triple if runner holds up.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "primary",
                notes: "Straddle 3B bag, line up SS relay with loud vocal cues.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 26,
                    y: 50,
                },
                role: "Lead relay to 3B",
                priority: "cutoff",
                notes: "Sprint out into LF grass, get in line between LF and 3B, catch and turn to fire.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 15,
                    y: 42,
                },
                role: "Retrieve ball and throw to SS",
                priority: "primary",
                notes: "Turn, chase to corner, pick up ball cleanly, hit relay man SS on the chest.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 22,
                    y: 36,
                },
                role: "Back up LF in corner",
                priority: "backup",
                notes: "Sprint into left corner to back up LF.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 45,
                    y: 32,
                },
                role: "Shift to middle",
                priority: "backup",
                notes: "Move to middle outfield depth.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 68,
                    y: 38,
                },
                role: "Hold right field",
                priority: "backup",
                notes: "Hold positioning.",
            },
        ],
    },
    {
        id: "bases-empty-xbh-lc-gap",
        title: "Extra-Base Hit in Left-Center Gap",
        category: "Bases Empty",
        subCategory: "Extra Bases",
        tags: [
            "extra-bases",
            "double-cut",
            "LC-gap",
            "tandem-relay",
            "bases-empty",
        ],
        situation: {
            outs: 0,
            runners: [],
            batterHand: "R",
            hitType: "Split LF and LC deep to the fence",
            description:
                "Tandem relay setup: SS is lead relay, 2B is trailing secondary relay; throw goes into 3B bag.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 30,
                    y: 16,
                },
                label: "Fielded at Fence",
            },
            {
                step: 0.7,
                pos: {
                    x: 36,
                    y: 34,
                },
                label: "Tandem Relay",
            },
            {
                step: 1,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Play at 3B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 26,
                    y: 58,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Sprint to foul ground 25-30 ft behind 3B bag in line with relay throw.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Hold home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 58,
                    y: 52,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Move in to cover 2B bag as middle infielders are in relay.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 42,
                    y: 42,
                },
                role: "Trailing secondary relay",
                priority: "cutoff",
                notes: 'Trail SS by 25-30 feet; communicate "3! 3!" and receive overthrow if missed.',
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "primary",
                notes: "Anchor at 3B bag, vocally align SS relay.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 36,
                    y: 34,
                },
                role: "Lead relay to 3B",
                priority: "cutoff",
                notes: "Run out to outfield grass, square up to LC fielder, catch on glove side and whip throw to 3B.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 22,
                },
                role: "Back up LC",
                priority: "backup",
                notes: "Pursue ball into gap to assist/back up.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 30,
                    y: 16,
                },
                role: "Retrieve ball and throw to relay",
                priority: "primary",
                notes: "Field at fence, turn quickly, fire strong chest-high throw to SS relay.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 40,
                    y: 20,
                },
                role: "Pursue ball into gap",
                priority: "backup",
                notes: "Sprint toward LC gap to back up play.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 66,
                    y: 36,
                },
                role: "Shift to right-center",
                priority: "backup",
                notes: "Hold depth and watch trail.",
            },
        ],
    },
    {
        id: "bases-empty-xbh-center-gap",
        title: "Extra-Base Hit Deep LC/RC Gap",
        category: "Bases Empty",
        subCategory: "Extra Bases",
        tags: ["extra-bases", "deep-center", "double-cut", "bases-empty"],
        situation: {
            outs: 0,
            runners: [],
            batterHand: "R",
            hitType: "Deep fly ball splitting LC and RC to warning track",
            description:
                "Deep gapper to dead center: 2B and SS form double relay to 3B; 1B rotates to 2B bag.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 50,
                    y: 14,
                },
                label: "Fielded at Fence",
            },
            {
                step: 0.7,
                pos: {
                    x: 48,
                    y: 34,
                },
                label: "Tandem Relay",
            },
            {
                step: 1,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Play at 3B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 26,
                    y: 58,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Sprint deep behind 3B bag in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Hold home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 54,
                    y: 50,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Rotate inside to cover 2B bag while middle infielders relay.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 52,
                    y: 32,
                },
                role: "Lead relay to 3B",
                priority: "cutoff",
                notes: "Go out as lead relay toward dead center, align with 3B bag.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "primary",
                notes: 'Direct the relay tandem with loud vocal commands ("Left! Right! Throw 3!").',
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 44,
                    y: 40,
                },
                role: "Secondary relay to 3B",
                priority: "cutoff",
                notes: "Trail 2B by 25 feet, ready to take bad throw or redirect.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 34,
                    y: 24,
                },
                role: "Back up center gap",
                priority: "backup",
                notes: "Sprint toward center to back up.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 46,
                    y: 16,
                },
                role: "Pursue ball and back up RC",
                priority: "backup",
                notes: "Communicate with RC, back up play at fence.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 50,
                    y: 14,
                },
                role: "Retrieve ball and throw to 2B relay",
                priority: "primary",
                notes: "Pick up ball at fence, turn and fire strike to 2B relay man.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 62,
                    y: 24,
                },
                role: "Back up center gap",
                priority: "backup",
                notes: "Pursue toward gap.",
            },
        ],
    },
    {
        id: "bases-empty-xbh-rc-gap",
        title: "Extra-Base Hit in Right-Center Gap",
        category: "Bases Empty",
        subCategory: "Extra Bases",
        tags: ["extra-bases", "RC-gap", "double-cut", "bases-empty"],
        situation: {
            outs: 0,
            runners: [],
            batterHand: "L",
            hitType: "Driven deep into RC gap roll to fence",
            description:
                "2B is lead relay into RC gap, SS trails for double-cut, throw goes to 3B bag.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 68,
                    y: 16,
                },
                label: "Fielded at Fence",
            },
            {
                step: 0.7,
                pos: {
                    x: 60,
                    y: 34,
                },
                label: "Tandem Relay",
            },
            {
                step: 1,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Play at 3B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 26,
                    y: 58,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Sprint behind 3B bag in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Hold home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 54,
                    y: 50,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Rotate inside to cover 2B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 60,
                    y: 34,
                },
                role: "Lead relay to 3B",
                priority: "cutoff",
                notes: "Sprint into right-center grass, catch high on glove side, spin and throw to 3B.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "primary",
                notes: "Straddle 3B bag and vocally line up 2B.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 52,
                    y: 42,
                },
                role: "Secondary relay to 3B",
                priority: "cutoff",
                notes: "Trail 2B by 25-30 ft, call out throw target.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 30,
                    y: 36,
                },
                role: "Hold left field",
                priority: "backup",
                notes: "Shift toward middle.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 58,
                    y: 22,
                },
                role: "Pursue ball into RC gap",
                priority: "backup",
                notes: "Sprint toward RC to back up retrieval.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 68,
                    y: 16,
                },
                role: "Retrieve ball and throw to 2B relay",
                priority: "primary",
                notes: "Field off fence, turn and hit 2B chest-high.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 22,
                },
                role: "Pursue ball into RC gap",
                priority: "backup",
                notes: "Sprint toward RC to back up play.",
            },
        ],
    },
    {
        id: "bases-empty-xbh-rf-line",
        title: "Extra-Base Hit Down RF Line",
        category: "Bases Empty",
        subCategory: "Extra Bases",
        tags: ["extra-bases", "RF-line", "cutoff-to-3b", "bases-empty"],
        situation: {
            outs: 0,
            runners: [],
            batterHand: "L",
            hitType: "Sliced down RF foul line rattling into corner",
            description:
                "RF chases into corner. 2B goes out for lead relay, SS covers 2B bag, throw goes into 3B.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 86,
                    y: 42,
                },
                label: "Fielded in Corner",
            },
            {
                step: 0.7,
                pos: {
                    x: 72,
                    y: 48,
                },
                label: "Relay Throw",
            },
            {
                step: 1,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Play at 3B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 26,
                    y: 58,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Sprint behind 3B bag in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Hold home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Ensure batter touches 1B, then step into trail cutoff line.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 72,
                    y: 48,
                },
                role: "Lead relay to 3B",
                priority: "cutoff",
                notes: "Sprint deep toward RF line, line up throw from RF corner to 3B bag.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "primary",
                notes: "Straddle 3B bag, yell loud commands.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to prevent batter from advancing or rounding.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 42,
                },
                role: "Back up 3B bag area",
                priority: "backup",
                notes: "Move in behind 3B area.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 45,
                    y: 32,
                },
                role: "Hold center field",
                priority: "backup",
                notes: "Shift toward right-center.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 76,
                    y: 36,
                },
                role: "Back up RF in corner",
                priority: "backup",
                notes: "Sprint to back up RF retrieval.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 86,
                    y: 42,
                },
                role: "Retrieve ball and throw to 2B relay",
                priority: "primary",
                notes: "Chase down ball in corner, turn and throw strong strike to 2B.",
            },
        ],
    },
    {
        id: "r1-dp-543",
        title: "5-4-3 Double Play",
        category: "Runner on 1st",
        subCategory: "Double Play",
        tags: ["double-play", "5-4-3", "force-out", "runner-on-1st"],
        situation: {
            outs: 0,
            runners: ["1B"],
            batterHand: "R",
            hitType: "Sharp ground ball right at 3B",
            description:
                "3B fields cleanly, fires firm strike to 2B covering 2B bag, 2B pivots across bag and throws to 1B for the double play.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Fielded by 3B",
            },
            {
                step: 0.7,
                pos: {
                    x: 50,
                    y: 48,
                },
                label: "Force at 2B Bag",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Play at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 48,
                    y: 60,
                },
                role: "Duck and clear lane",
                priority: "backup",
                notes: "Drop down out of the 3B-to-2B throwing lane.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 56,
                    y: 70,
                },
                role: "Trail batter-runner",
                priority: "backup",
                notes: "Hustle down 1B line in foul ground to back up throw from 2B.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Receive relay throw at 1B",
                priority: "primary",
                notes: "Anchor on bag, give big chest target to 2B, stretch toward second base.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B, pivot and throw to 1B",
                priority: "primary",
                notes: "Approach 2B bag, drag right foot across back of bag, clear runner slide, fire strong throw to 1B.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Field grounder and feed 2B",
                priority: "primary",
                notes: "Field out front, stay low, deliver crisp chest-high feed to 2B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 40,
                    y: 52,
                },
                role: "Back up 3B fielder",
                priority: "backup",
                notes: "Pinch toward 3B to back up grounder.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 44,
                },
                role: "Back up 3B line",
                priority: "backup",
                notes: "Charge toward infield behind 3B.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 40,
                    y: 32,
                },
                role: "Back up 2B bag",
                priority: "backup",
                notes: "Move in behind second base.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 58,
                    y: 32,
                },
                role: "Back up 2B bag",
                priority: "backup",
                notes: "Shade toward 2B bag.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 50,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint aggressively behind 1B foul line to back up 2B relay throw.",
            },
        ],
    },
    {
        id: "r1-dp-643",
        title: "6-4-3 Double Play",
        category: "Runner on 1st",
        subCategory: "Double Play",
        tags: ["double-play", "6-4-3", "force-out", "runner-on-1st"],
        situation: {
            outs: 0,
            runners: ["1B"],
            batterHand: "R",
            hitType: "Routine ground ball directly to Shortstop",
            description:
                "SS fields cleanly, underhand flips or delivers short throw to 2B covering 2B bag, 2B turns and throws to 1B for the double play.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 43,
                    y: 50,
                },
                label: "Fielded by SS",
            },
            {
                step: 0.7,
                pos: {
                    x: 50,
                    y: 48,
                },
                label: "Force at 2B Bag",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Play at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 62,
                },
                role: "Clear throwing lane",
                priority: "backup",
                notes: "Clear middle of diamond.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 56,
                    y: 70,
                },
                role: "Trail batter-runner",
                priority: "backup",
                notes: "Sprint down 1B line in foul ground to back up throw.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Receive relay throw at 1B",
                priority: "primary",
                notes: "Square up to 2B, maintain contact with bag, stretch to beat runner.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag, turn double play",
                priority: "primary",
                notes: "Time arrival to bag, touch bag with left foot, step clear of runner, fire across diamond to 1B.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Hold 3B base in case of wide deflection.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 43,
                    y: 50,
                },
                role: "Field grounder and feed 2B",
                priority: "primary",
                notes: "Field in balance, show the ball, deliver firm chest-high feed to 2B on the move.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 40,
                },
                role: "Back up SS",
                priority: "backup",
                notes: "Charge behind SS.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Back up 2B bag",
                priority: "backup",
                notes: "Shade toward 2B bag.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 60,
                    y: 32,
                },
                role: "Back up 2B bag",
                priority: "backup",
                notes: "Shade toward 2B bag.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 50,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint down right field line to back up throw from 2B.",
            },
        ],
    },
    {
        id: "r1-dp-463",
        title: "4-6-3 Double Play",
        category: "Runner on 1st",
        subCategory: "Double Play",
        tags: ["double-play", "4-6-3", "force-out", "runner-on-1st"],
        situation: {
            outs: 0,
            runners: ["1B"],
            batterHand: "L",
            hitType: "Sharp ground ball to 2B",
            description:
                "2B fields cleanly, underhand tosses to SS covering 2B bag, SS takes feed across bag and fires to 1B.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 57,
                    y: 50,
                },
                label: "Fielded by 2B",
            },
            {
                step: 0.7,
                pos: {
                    x: 50,
                    y: 48,
                },
                label: "Force at 2B Bag",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Play at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 52,
                    y: 60,
                },
                role: "Clear middle lane",
                priority: "backup",
                notes: "Stay out of throwing lane between SS and 1B.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 56,
                    y: 70,
                },
                role: "Trail batter-runner",
                priority: "backup",
                notes: "Trail batter down 1B line in foul ground.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Receive relay throw at 1B",
                priority: "primary",
                notes: "Set feet on inside corner of bag, give wide target to SS.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 57,
                    y: 50,
                },
                role: "Field grounder and feed SS",
                priority: "primary",
                notes: "Stay low, field cleanly, give firm underhand toss with stiff wrist directly to SS chest.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Hold 3B base.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag, turn double play",
                priority: "primary",
                notes: "Arrive at bag under control, touch bag with right foot, plant and fire sidearm/overhand bullet to 1B.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field depth.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Back up 2B bag",
                priority: "backup",
                notes: "Back up second base.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 62,
                    y: 32,
                },
                role: "Back up 2B fielder",
                priority: "backup",
                notes: "Charge toward 2B in case of deflection.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 50,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint aggressively behind 1B bag.",
            },
        ],
    },
    {
        id: "r1-dp-363",
        title: "3-6-3 Double Play",
        category: "Runner on 1st",
        subCategory: "Double Play",
        tags: ["double-play", "3-6-3", "force-out", "runner-on-1st"],
        situation: {
            outs: 0,
            runners: ["1B"],
            batterHand: "L",
            hitType: "Sharp ground ball to 1B off the bag",
            description:
                "1B fields off bag, throws to SS covering 2B bag; SS fires back to 1B bag where P (or returning 1B) completes double play.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 70,
                    y: 52,
                },
                label: "Fielded by 1B",
            },
            {
                step: 0.7,
                pos: {
                    x: 50,
                    y: 48,
                },
                label: "Force at 2B Bag",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Play at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 65,
                    y: 56,
                },
                role: "Sprint to cover 1B bag",
                priority: "primary",
                notes: "Sprint to 1B bag immediately on ball hit to 1B right, receive return throw from SS.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 54,
                    y: 72,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Stay at home plate and direct play.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 70,
                    y: 52,
                },
                role: "Field grounder and throw to 2B",
                priority: "primary",
                notes: "Field ball, pivot inside towards infield, throw crisp strike to SS chest at 2B bag, then hustle back toward 1B.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 60,
                    y: 50,
                },
                role: "Back up 1B fielder",
                priority: "backup",
                notes: "Trail behind 1B on grounder.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Hold 3B base.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag and relay to 1B",
                priority: "primary",
                notes: "Sprint to 2B bag, catch feed from 1B, step over bag, fire accurately to P/1B covering first base.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 44,
                    y: 32,
                },
                role: "Back up 2B bag",
                priority: "backup",
                notes: "Back up 2B bag.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 64,
                    y: 32,
                },
                role: "Back up right side",
                priority: "backup",
                notes: "Move in.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 76,
                    y: 48,
                },
                role: "Back up 1B bag",
                priority: "backup",
                notes: "Sprint to back up return throw at 1B.",
            },
        ],
    },
    {
        id: "r1-dp-163",
        title: "1-6-3 Double Play",
        category: "Runner on 1st",
        subCategory: "Double Play",
        tags: ["double-play", "1-6-3", "comebacker", "runner-on-1st"],
        situation: {
            outs: 0,
            runners: ["1B"],
            batterHand: "R",
            hitType: "Sharp ground ball comebacker up the middle",
            description:
                "Pitcher fields comebacker, turns quickly and fires to SS at 2B bag; SS turns double play to 1B.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 50,
                    y: 61,
                },
                label: "Fielded by P",
            },
            {
                step: 0.7,
                pos: {
                    x: 50,
                    y: 48,
                },
                label: "Force at 2B Bag",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Play at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 61,
                },
                role: "Field and throw to 2B",
                priority: "primary",
                notes: "Field comebacker, spin quickly toward 2B, deliver chest-high throw right over 2B bag.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Direct play",
                priority: "backup",
                notes: 'Loudly call "2! 2! Second base!" to alert pitcher.',
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Receive relay throw at 1B",
                priority: "primary",
                notes: "Get back to 1B bag quickly, present wide target to SS.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 54,
                    y: 49,
                },
                role: "Back up 2B bag",
                priority: "backup",
                notes: "Back up SS at 2B bag.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Hold 3B base.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag and relay to 1B",
                priority: "primary",
                notes: "Sprint to 2B bag, catch feed from P, pivot across bag, fire to 1B.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 38,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 30,
                },
                role: "Back up 2B bag",
                priority: "backup",
                notes: "Shade toward 2B.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 58,
                    y: 30,
                },
                role: "Back up 2B bag",
                priority: "backup",
                notes: "Shade toward 2B.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 50,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint down right field line to back up throw from SS.",
            },
        ],
    },
    {
        id: "r1-single-lf-throw-3b",
        title: "Single to LF - Throw to 3B",
        category: "Runner on 1st",
        subCategory: "Base Hit",
        tags: ["single", "runner-on-1st", "throw-to-3B", "SS-cutoff"],
        situation: {
            outs: 0,
            runners: ["1B"],
            batterHand: "R",
            hitType: "Sharp single to LF; runner on 1st tries for 3B",
            description:
                "LF fields single and throws to 3B to challenge advancing runner; SS is cutoff to 3B, 2B covers 2B bag.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 25,
                    y: 38,
                },
                label: "Fielded by LF",
            },
            {
                step: 0.7,
                pos: {
                    x: 31,
                    y: 50,
                },
                label: "Cutoff / Decision",
            },
            {
                step: 1,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Play at 3B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 26,
                    y: 58,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Sprint behind 3B bag in foul territory to back up throw.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Stay at home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Watch batter touch 1B, alert if batter attempts 2B.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to hold batter-runner from taking extra base.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "primary",
                notes: 'Straddle 3B bag, call "Cut!" or "Let it go!", prepare for tag.',
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 31,
                    y: 50,
                },
                role: "Cutoff to 3B",
                priority: "cutoff",
                notes: "Line up directly between LF and 3B bag at edge of outfield grass.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 25,
                    y: 38,
                },
                role: "Field single and fire to 3B",
                priority: "primary",
                notes: "Charge ball, make clean pickup, fire low, one-hop strike toward 3B through SS cutoff.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 32,
                    y: 32,
                },
                role: "Back up LF",
                priority: "backup",
                notes: "Back up LF on the play.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 55,
                    y: 32,
                },
                role: "Shade center",
                priority: "backup",
                notes: "Hold center field depth.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 72,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold right field depth.",
            },
        ],
    },
    {
        id: "r1-single-lc-throw-3b",
        title: "Single to LC - Throw to 3B",
        category: "Runner on 1st",
        subCategory: "Base Hit",
        tags: ["single", "runner-on-1st", "throw-to-3B", "LC-hit"],
        situation: {
            outs: 0,
            runners: ["1B"],
            batterHand: "R",
            hitType: "Solid single into LC gap; runner attempts 1st to 3rd",
            description:
                "LC fields cleanly, fires toward 3B; SS sets up cutoff line, 2B covers 2B bag.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 38,
                    y: 30,
                },
                label: "Fielded by LC",
            },
            {
                step: 0.7,
                pos: {
                    x: 36,
                    y: 48,
                },
                label: "Cutoff / Relay",
            },
            {
                step: 1,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Play at 3B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 26,
                    y: 58,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Sprint behind 3B bag in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Hold home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Verify batter touches 1B.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag; if SS cuts throw, be ready for throw to 2B.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "primary",
                notes: 'Anchor at 3B bag, direct SS cutoff ("Cut 2!" or "Let it go!").',
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 36,
                    y: 48,
                },
                role: "Cutoff to 3B",
                priority: "cutoff",
                notes: "Line up between LC and 3B bag, hands high, listen to 3B call.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 30,
                    y: 32,
                },
                role: "Back up LC",
                priority: "backup",
                notes: "Sprint toward LC to back up fielding.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 38,
                    y: 30,
                },
                role: "Field and throw to 3B",
                priority: "primary",
                notes: "Field cleanly, hit SS cutoff chest-high or throw through to 3B.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 50,
                    y: 26,
                },
                role: "Back up LC",
                priority: "backup",
                notes: "Back up LC.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 70,
                    y: 38,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold right field.",
            },
        ],
    },
    {
        id: "r1-single-rc-throw-3b",
        title: "Single to RC - Throw to 3B",
        category: "Runner on 1st",
        subCategory: "Base Hit",
        tags: ["single", "runner-on-1st", "throw-to-3B", "RC-hit"],
        situation: {
            outs: 0,
            runners: ["1B"],
            batterHand: "L",
            hitType:
                "Line drive single to Right-Center; runner advances 1st to 3rd",
            description:
                "RC fields single; SS takes cutoff line to 3B, 2B covers 2B bag, 1B covers 1B.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 62,
                    y: 30,
                },
                label: "Fielded by RC",
            },
            {
                step: 0.7,
                pos: {
                    x: 44,
                    y: 50,
                },
                label: "Cutoff to 3B",
            },
            {
                step: 1,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Play at 3B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 26,
                    y: 58,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Sprint behind 3B bag in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Hold home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Ensure batter touches 1B.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to prevent batter from advancing.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "primary",
                notes: "Straddle 3B bag, direct SS cutoff alignment.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 44,
                    y: 50,
                },
                role: "Cutoff to 3B",
                priority: "cutoff",
                notes: "Line up between RC and 3B bag, right in front of 2B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 40,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Move in toward 3B line to back up potential overthrow.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 50,
                    y: 26,
                },
                role: "Back up RC",
                priority: "backup",
                notes: "Sprint toward RC to back up fielding.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 62,
                    y: 30,
                },
                role: "Field and throw to 3B",
                priority: "primary",
                notes: "Field cleanly, throw through SS cutoff toward 3B.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 70,
                    y: 32,
                },
                role: "Back up RC",
                priority: "backup",
                notes: "Back up RC.",
            },
        ],
    },
    {
        id: "r1-single-rf-throw-3b",
        title: "Single to RF - Throw to 3B",
        category: "Runner on 1st",
        subCategory: "Base Hit",
        tags: ["single", "runner-on-1st", "throw-to-3B", "RF-hit"],
        situation: {
            outs: 0,
            runners: ["1B"],
            batterHand: "L",
            hitType:
                "Solid single into Right Field; runner aggressively going 1st to 3rd",
            description:
                "RF fields single, fires across diamond to 3B; SS acts as cutoff between RF and 3B, 2B covers 2B bag.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 74,
                    y: 38,
                },
                label: "Fielded by RF",
            },
            {
                step: 0.7,
                pos: {
                    x: 46,
                    y: 52,
                },
                label: "Cutoff to 3B",
            },
            {
                step: 1,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Play at 3B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 26,
                    y: 58,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Sprint behind 3B bag in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Hold home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Ensure batter touches 1B, alert defense if batter rounds.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag, be ready for cut-and-throw to 2B.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "primary",
                notes: "Straddle 3B bag, guide SS cutoff, prepare for tag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 46,
                    y: 52,
                },
                role: "Cutoff to 3B",
                priority: "cutoff",
                notes: "Line up between RF and 3B bag near pitcher mound, hands high.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 44,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Back up 3B bag on cross-diamond throw.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 44,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold positioning.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 68,
                    y: 32,
                },
                role: "Back up RF",
                priority: "backup",
                notes: "Sprint toward RF to back up fielding.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 38,
                },
                role: "Field and throw to 3B",
                priority: "primary",
                notes: "Charge ball, make clean pickup, fire chest-high strike to SS cutoff toward 3B.",
            },
        ],
    },
    {
        id: "r1-xbh-lf-gap-relay-home",
        title: "XBH in LF/LC Gap - Tandem Relay Home",
        category: "Runner on 1st",
        subCategory: "Extra Bases",
        tags: ["extra-bases", "runner-on-1st", "relay-to-home", "tandem-relay"],
        situation: {
            outs: 0,
            runners: ["1B"],
            batterHand: "R",
            hitType:
                "Deep gap shot rolling to the fence between LF and LC; runner on 1st scoring",
            description:
                "Double cut with SS as lead relay, 2B trailing; 1B acts as cutoff to home, C covers plate, P backs up home.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 32,
                    y: 18,
                },
                label: "Fielded at Fence",
            },
            {
                step: 0.7,
                pos: {
                    x: 38,
                    y: 36,
                },
                label: "Tandem Relay",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Play at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint directly behind home plate to back up throw from relay.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "primary",
                notes: "Set up in front of home plate, direct 1B cutoff alignment, prepare for sweep tag.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 46,
                    y: 66,
                },
                role: "Cutoff to home",
                priority: "cutoff",
                notes: "Move across diamond into line between relay and home plate, hands raised.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 42,
                    y: 44,
                },
                role: "Secondary relay trailer",
                priority: "cutoff",
                notes: "Trail SS relay by 25 feet, direct throw.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag to hold batter-runner from taking 3B.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 38,
                    y: 36,
                },
                role: "Lead relay",
                priority: "cutoff",
                notes: "Run out deep into LF grass, catch feed from LC, pivot and fire strike to 1B cutoff/home.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 22,
                },
                role: "Pursue ball into gap",
                priority: "backup",
                notes: "Sprint to gap to back up LC.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 32,
                    y: 18,
                },
                role: "Field at fence and hit relay",
                priority: "primary",
                notes: "Field off fence, turn and hit SS lead relay chest-high.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 44,
                    y: 22,
                },
                role: "Pursue ball into gap",
                priority: "backup",
                notes: "Back up play.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 68,
                    y: 38,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold right field.",
            },
        ],
    },
    {
        id: "r1-xbh-rc-gap-relay-home",
        title: "XBH in RC Gap - Tandem Relay Home",
        category: "Runner on 1st",
        subCategory: "Extra Bases",
        tags: ["extra-bases", "runner-on-1st", "relay-to-home", "tandem-relay"],
        situation: {
            outs: 0,
            runners: ["1B"],
            batterHand: "L",
            hitType:
                "Deep smash rolling to wall in RC gap; runner on 1st scoring",
            description:
                "2B is lead relay, SS trails; 1B lines up cutoff to home plate, P backs up home.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 68,
                    y: 18,
                },
                label: "Fielded at Fence",
            },
            {
                step: 0.7,
                pos: {
                    x: 60,
                    y: 36,
                },
                label: "Tandem Relay",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Play at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind home plate in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "primary",
                notes: "Position in front of plate, direct 1B cutoff with vocal cues.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 54,
                    y: 66,
                },
                role: "Cutoff to home",
                priority: "cutoff",
                notes: "Set up in line between 2B relay and home plate, hands high.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 60,
                    y: 36,
                },
                role: "Lead relay",
                priority: "cutoff",
                notes: "Go out deep into RC grass, turn and deliver bullet to 1B cutoff/home.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag to hold batter-runner.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 54,
                    y: 44,
                },
                role: "Secondary relay trailer",
                priority: "cutoff",
                notes: "Trail 2B by 25 feet, direct throw.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 38,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 56,
                    y: 22,
                },
                role: "Back up RC",
                priority: "backup",
                notes: "Sprint to back up RC.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 68,
                    y: 18,
                },
                role: "Field at fence and throw to 2B",
                priority: "primary",
                notes: "Pick up ball at fence, turn and fire strike to 2B.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 76,
                    y: 22,
                },
                role: "Back up RC",
                priority: "backup",
                notes: "Sprint to back up RC.",
            },
        ],
    },
    {
        id: "r1-xbh-lf-line-relay-3b",
        title: "XBH Down LF Line - Relay to 3B",
        category: "Runner on 1st",
        subCategory: "Extra Bases",
        tags: ["extra-bases", "runner-on-1st", "relay-to-3B", "LF-line"],
        situation: {
            outs: 0,
            runners: ["1B"],
            batterHand: "R",
            hitType: "Smashed down the LF line into the corner",
            description:
                "LF retrieves in corner, SS is lead relay to 3B bag; P backs up 3B, 2B covers 2B bag.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 15,
                    y: 42,
                },
                label: "Fielded in Corner",
            },
            {
                step: 0.7,
                pos: {
                    x: 26,
                    y: 50,
                },
                label: "Relay Throw",
            },
            {
                step: 1,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Play at 3B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 26,
                    y: 58,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Sprint behind 3B bag in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Stay at home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 58,
                    y: 58,
                },
                role: "Trail batter-runner",
                priority: "coverage",
                notes: "Ensure batter touches 1B, then shade toward mound.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "primary",
                notes: "Straddle 3B bag, guide SS relay throw, prepare for tag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 26,
                    y: 50,
                },
                role: "Lead relay to 3B",
                priority: "cutoff",
                notes: "Run out deep toward left foul line, catch and whip throw to 3B.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 15,
                    y: 42,
                },
                role: "Retrieve ball and throw to SS",
                priority: "primary",
                notes: "Field out of corner, hit SS chest-high.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 22,
                    y: 36,
                },
                role: "Back up LF",
                priority: "backup",
                notes: "Back up LF.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 45,
                    y: 32,
                },
                role: "Shift middle",
                priority: "backup",
                notes: "Shade middle.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 68,
                    y: 38,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold position.",
            },
        ],
    },
    {
        id: "r1-xbh-rf-line-relay-home",
        title: "XBH Down RF Line - Relay to Home",
        category: "Runner on 1st",
        subCategory: "Extra Bases",
        tags: ["extra-bases", "runner-on-1st", "relay-to-home", "RF-line"],
        situation: {
            outs: 0,
            runners: ["1B"],
            batterHand: "L",
            hitType:
                "Ripping drive into deep RF corner; runner on 1st sprinting home",
            description:
                "RF chases down into corner; 2B lead relay, 1B cutoff to home, C prepares for play at the plate, P backs up home.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 86,
                    y: 42,
                },
                label: "Fielded in Corner",
            },
            {
                step: 0.7,
                pos: {
                    x: 70,
                    y: 50,
                },
                label: "Relay Throw",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Play at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind home plate in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "primary",
                notes: "Position in front of plate, direct 1B cutoff.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 58,
                    y: 68,
                },
                role: "Cutoff to home",
                priority: "cutoff",
                notes: "Line up between 2B relay and home plate, hands high.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 70,
                    y: 50,
                },
                role: "Lead relay",
                priority: "cutoff",
                notes: "Sprint out to deep right field line, turn and deliver strike to 1B cutoff.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to hold batter-runner.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 45,
                    y: 32,
                },
                role: "Shift middle",
                priority: "backup",
                notes: "Shift to middle.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 76,
                    y: 36,
                },
                role: "Back up RF in corner",
                priority: "backup",
                notes: "Sprint into corner to back up RF.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 86,
                    y: 42,
                },
                role: "Retrieve ball and throw to 2B",
                priority: "primary",
                notes: "Field ball cleanly in corner, throw strike to 2B relay.",
            },
        ],
    },
    {
        id: "r2-gb-3b-hold",
        title: "Ground Ball to 3B - Hold Runner at 2B",
        category: "Scoring Position",
        subCategory: "Infield Grounder",
        tags: ["runner-on-2nd", "look-back", "3B-play", "throw-to-1B"],
        situation: {
            outs: 0,
            runners: ["2B"],
            batterHand: "R",
            hitType: "Sharp ground ball to 3B",
            description:
                "3B fields cleanly, feints/looks runner back to 2B bag, then fires strike across to 1B for the out.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Fielded by 3B",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Play at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 48,
                    y: 60,
                },
                role: "Back up 3B / clear lane",
                priority: "backup",
                notes: "Clear throwing lane between 3B and 1B.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Direct play",
                priority: "coverage",
                notes: 'Call "Look him back! Throw 1!"',
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Receive throw at 1B",
                priority: "primary",
                notes: "Set target at 1B bag, prepare for scoop.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag and give 3B a target to hold runner.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Field grounder, freeze runner, throw 1B",
                priority: "primary",
                notes: "Field ball, take hard visual check at runner on 2nd, pump fake if needed, fire to 1B.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 44,
                    y: 50,
                },
                role: "Pinch toward 2B bag",
                priority: "backup",
                notes: "Creep toward 2B bag behind runner to create tag threat.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 42,
                },
                role: "Back up 3B",
                priority: "backup",
                notes: "Charge toward 3B line to back up grounder.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 40,
                    y: 32,
                },
                role: "Back up infield",
                priority: "backup",
                notes: "Hold positioning.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 58,
                    y: 32,
                },
                role: "Back up infield",
                priority: "backup",
                notes: "Hold positioning.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 50,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint behind 1B bag in foul territory.",
            },
        ],
    },
    {
        id: "r2-gb-ss-look-1b",
        title: "Ground Ball to SS - Freeze Runner, Throw 1B",
        category: "Scoring Position",
        subCategory: "Infield Grounder",
        tags: ["runner-on-2nd", "look-back", "SS-play", "throw-to-1B"],
        situation: {
            outs: 0,
            runners: ["2B"],
            batterHand: "R",
            hitType: "Routine ground ball to Shortstop",
            description:
                "SS fields cleanly, checks runner at 2B with head snap, then fires firm throw to 1B.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 43,
                    y: 50,
                },
                label: "Fielded by SS",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Play at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 62,
                },
                role: "Clear throwing lane",
                priority: "backup",
                notes: "Duck and clear lane.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Direct play",
                priority: "coverage",
                notes: 'Call "Look 2, throw 1!"',
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Receive throw at 1B",
                priority: "primary",
                notes: "Anchor foot to 1B bag, stretch toward SS.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Hold 2B bag",
                priority: "coverage",
                notes: "Hold 2B bag to pin runner.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Protect 3B bag in case runner breaks.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 43,
                    y: 50,
                },
                role: "Field, freeze runner, throw 1B",
                priority: "primary",
                notes: "Field cleanly, make sharp glance at runner at 2B, crow-hop, deliver strike to 1B.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 40,
                },
                role: "Back up SS",
                priority: "backup",
                notes: "Charge toward SS.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Back up 2B bag",
                priority: "backup",
                notes: "Shade toward 2B bag.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 60,
                    y: 32,
                },
                role: "Back up 2B bag",
                priority: "backup",
                notes: "Shade toward 2B bag.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 50,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint behind 1B bag.",
            },
        ],
    },
    {
        id: "r2-gb-2b-throw-1b",
        title: "Ground Ball to 2B - Throw to 1B",
        category: "Scoring Position",
        subCategory: "Infield Grounder",
        tags: ["runner-on-2nd", "2B-play", "throw-to-1B", "runner-advances"],
        situation: {
            outs: 0,
            runners: ["2B"],
            batterHand: "L",
            hitType: "Ground ball to right side of infield",
            description:
                "2B fields cleanly, runner on 2nd advances to 3rd; 2B makes routine throw to 1B for the out.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 57,
                    y: 50,
                },
                label: "Fielded by 2B",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Play at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 52,
                    y: 60,
                },
                role: "Shade toward 1B",
                priority: "backup",
                notes: "Back up 1B in case of loose ball.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Direct play",
                priority: "coverage",
                notes: 'Call "Throw 1! Throw 1!"',
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Receive throw at 1B",
                priority: "primary",
                notes: "Catch ball for out, immediately look across to 3B to check runner.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 57,
                    y: 50,
                },
                role: "Field grounder and throw 1B",
                priority: "primary",
                notes: "Field under control, throw firmly to 1B; do not hesitate.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Prepare to receive throw from 1B if runner over-rounds 3B.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Back up 2B",
                priority: "backup",
                notes: "Shade toward 2B.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 62,
                    y: 32,
                },
                role: "Back up 2B",
                priority: "backup",
                notes: "Charge toward 2B.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 50,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint behind 1B bag in foul territory.",
            },
        ],
    },
    {
        id: "r2-gb-1b-hold",
        title: "Ground Ball to 1B - Unassisted Out, Hold Runner at 2B",
        category: "Scoring Position",
        subCategory: "Infield Grounder",
        tags: ["runner-on-2nd", "1B-play", "look-back", "scoring-position"],
        situation: {
            outs: 0,
            runners: ["2B"],
            batterHand: "R",
            hitType: "Sharp ground ball to First Base",
            description:
                "1B fields cleanly near bag, steps on 1B for unassisted out, feints throw to 2B to freeze runner.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.45,
                pos: {
                    x: 67,
                    y: 55,
                },
                label: "1B Fields Ball",
            },
            {
                step: 0.7,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "1B Tags Bag for Out",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "1B Holds Runner at 2B",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 60,
                    y: 58,
                },
                role: "Sprint to back up 1B",
                priority: "backup",
                notes: "Sprint toward 1B line to back up first baseman.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 52,
                    y: 74,
                },
                role: "Trail batter-runner",
                priority: "backup",
                notes: 'Trail runner up line, yell "Step on the bag!"',
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 67,
                    y: 55,
                },
                role: "Field ball and tag 1B bag",
                priority: "primary",
                notes: "Field cleanly, touch 1B bag for sure out, snap head around to 2B to freeze runner.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 64,
                    y: 48,
                },
                role: "Back up 1B",
                priority: "coverage",
                notes: "Move into shallow right to back up 1B.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Anchor 3B bag in case runner attempts advance.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag, ready for snap throw.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 42,
                },
                role: "Back up 3B",
                priority: "backup",
                notes: "Shade toward 3B line.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 35,
                },
                role: "Back up 2B",
                priority: "backup",
                notes: "Back up middle infield.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 62,
                    y: 35,
                },
                role: "Back up right side",
                priority: "backup",
                notes: "Angle toward right side.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 46,
                },
                role: "Back up 1B line",
                priority: "backup",
                notes: "Charge to back up first base line.",
            },
        ],
    },
    {
        id: "r2-single-lf-home",
        title: "Base Hit to LF - Play at Home",
        category: "Scoring Position",
        subCategory: "Base Hit",
        tags: ["runner-on-2nd", "play-at-home", "LF-single", "3B-cutoff"],
        situation: {
            outs: 0,
            runners: ["2B"],
            batterHand: "R",
            hitType: "Sharp single to Left Field; runner rounding 3B for home",
            description:
                "LF charges and fires home; 3B sets up cutoff to home plate, SS covers 3B, C covers plate, P backs up home.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 25,
                    y: 38,
                },
                label: "Fielded by LF",
            },
            {
                step: 0.7,
                pos: {
                    x: 40,
                    y: 68,
                },
                label: "Cutoff to Home",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Play at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint deep behind home plate in foul territory to back up throw.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "primary",
                notes: 'Position in front of plate, direct 3B cutoff ("Cut 2!" or "Let it go!"), prepare for tag.',
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Watch batter touch 1B, alert defense if batter attempts 2B.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to prevent batter from advancing.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 40,
                    y: 68,
                },
                role: "Cutoff to home",
                priority: "cutoff",
                notes: "Move in line between LF and home plate halfway down 3B line, hands high.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Rotate to cover 3B bag while 3B acts as cutoff.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 25,
                    y: 38,
                },
                role: "Field and fire home",
                priority: "primary",
                notes: "Charge hard, field on glove side, deliver low, powerful one-hop throw to C through 3B cutoff.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 32,
                    y: 32,
                },
                role: "Back up LF",
                priority: "backup",
                notes: "Sprint to back up LF.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 55,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 72,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold right field.",
            },
        ],
    },
    {
        id: "r2-single-lc-home",
        title: "Base Hit to LC - Play at Home",
        category: "Scoring Position",
        subCategory: "Base Hit",
        tags: ["runner-on-2nd", "play-at-home", "LC-single", "3B-cutoff"],
        situation: {
            outs: 0,
            runners: ["2B"],
            batterHand: "R",
            hitType: "Sharp line drive single into LC gap; runner scoring",
            description:
                "LC fields and fires home; 3B lines up cutoff to home, SS covers 3B, 2B covers 2B, P backs up home.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 38,
                    y: 30,
                },
                label: "Fielded by LC",
            },
            {
                step: 0.7,
                pos: {
                    x: 44,
                    y: 66,
                },
                label: "Cutoff to Home",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Play at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind home plate in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "primary",
                notes: "Position in front of plate, call cutoff commands to 3B.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to hold batter-runner.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 44,
                    y: 66,
                },
                role: "Cutoff to home",
                priority: "cutoff",
                notes: "Line up between LC fielder and home plate, hands high.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 30,
                    y: 32,
                },
                role: "Back up LC",
                priority: "backup",
                notes: "Sprint to back up LC.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 38,
                    y: 30,
                },
                role: "Field and throw home",
                priority: "primary",
                notes: "Field cleanly, deliver strong throw on a line through 3B cutoff to home.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 50,
                    y: 26,
                },
                role: "Back up LC",
                priority: "backup",
                notes: "Back up LC.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 70,
                    y: 38,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold right field.",
            },
        ],
    },
    {
        id: "r2-single-rc-home",
        title: "Base Hit to RC - Play at Home",
        category: "Scoring Position",
        subCategory: "Base Hit",
        tags: ["runner-on-2nd", "play-at-home", "RC-single", "1B-cutoff"],
        situation: {
            outs: 0,
            runners: ["2B"],
            batterHand: "L",
            hitType: "Solid single into RC gap; runner on 2nd tries to score",
            description:
                "RC fields cleanly, throws home; 1B cuts off throw halfway between RC and home, SS covers 3B, 2B covers 2B.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 62,
                    y: 30,
                },
                label: "Fielded by RC",
            },
            {
                step: 0.7,
                pos: {
                    x: 56,
                    y: 66,
                },
                label: "Cutoff to Home",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Play at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind home plate in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "primary",
                notes: "Direct 1B cutoff alignment, prepare for tag at plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 56,
                    y: 66,
                },
                role: "Cutoff to home",
                priority: "cutoff",
                notes: "Move in line between RC fielder and home plate, hands raised.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to hold batter-runner.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 42,
                    y: 50,
                },
                role: "Pinch toward middle",
                priority: "backup",
                notes: "Shade behind 2B bag in case of cutoff to 2B.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 38,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 50,
                    y: 26,
                },
                role: "Back up RC",
                priority: "backup",
                notes: "Sprint to back up RC.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 62,
                    y: 30,
                },
                role: "Field and throw home",
                priority: "primary",
                notes: "Field cleanly, hit 1B cutoff chest-high or throw through to home.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 70,
                    y: 32,
                },
                role: "Back up RC",
                priority: "backup",
                notes: "Back up RC.",
            },
        ],
    },
    {
        id: "r2-single-rf-home",
        title: "Base Hit to RF - Play at Home",
        category: "Scoring Position",
        subCategory: "Base Hit",
        tags: ["runner-on-2nd", "play-at-home", "RF-single", "1B-cutoff"],
        situation: {
            outs: 0,
            runners: ["2B"],
            batterHand: "L",
            hitType:
                "Sharp grounder or line drive single to RF; runner scoring",
            description:
                "RF charges and fires home; 1B sets up cutoff to home plate, 2B covers 2B bag, 3B covers 3B bag, P backs up home.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 74,
                    y: 38,
                },
                label: "Fielded by RF",
            },
            {
                step: 0.7,
                pos: {
                    x: 60,
                    y: 66,
                },
                label: "Cutoff to Home",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Play at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind home plate in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "primary",
                notes: 'Position in front of plate, direct 1B cutoff ("Cut 2!" or "Let it go!").',
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 60,
                    y: 66,
                },
                role: "Cutoff to home",
                priority: "cutoff",
                notes: "Line up between RF and home plate halfway down 1B line, hands high.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to hold batter-runner from taking extra base.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 44,
                    y: 50,
                },
                role: "Pinch toward 2B bag",
                priority: "backup",
                notes: "Shade behind 2B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 44,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 68,
                    y: 32,
                },
                role: "Back up RF",
                priority: "backup",
                notes: "Sprint to back up RF.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 38,
                },
                role: "Field and fire home",
                priority: "primary",
                notes: "Charge ball hard, make clean pickup, deliver strong one-hop strike home through 1B cutoff.",
            },
        ],
    },
    {
        id: "r2-fly-lf-tag-3b",
        title: "Fly Ball to LF - Tag-Up to 3B",
        category: "Scoring Position",
        subCategory: "Fly Ball / Tag",
        tags: ["runner-on-2nd", "tag-up", "LF-fly", "throw-to-3B"],
        situation: {
            outs: 0,
            runners: ["2B"],
            batterHand: "R",
            hitType: "Medium-deep fly ball to Left Field; runner tags from 2nd",
            description:
                "LF catches fly ball behind runner, fires strike to 3B bag; SS cuts if off line, P backs up 3B.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 25,
                    y: 30,
                },
                label: "Catch in LF",
            },
            {
                step: 1,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Play at 3B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 26,
                    y: 58,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Sprint behind 3B bag in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Stay at home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag and appeal tag if runner left early.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "primary",
                notes: "Straddle 3B bag, drop down for tag on runner sliding from 2B.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 30,
                    y: 46,
                },
                role: "Cutoff to 3B",
                priority: "cutoff",
                notes: "Line up between LF catch and 3B bag, let throw pass if on target.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 25,
                    y: 30,
                },
                role: "Catch fly and fire to 3B",
                priority: "primary",
                notes: "Catch with momentum forward, crow-hop, deliver firm strike to 3B bag.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 32,
                    y: 26,
                },
                role: "Back up LF catch",
                priority: "backup",
                notes: "Sprint to back up LF.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 55,
                    y: 28,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 72,
                    y: 38,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold right field.",
            },
        ],
    },
    {
        id: "r2-fly-lc-deep-tag",
        title: "Deep Fly to LC - Runner Tags to 3B",
        category: "Scoring Position",
        subCategory: "Fly Ball / Tag",
        tags: ["runner-on-2nd", "tag-up", "deep-fly", "LC-catch"],
        situation: {
            outs: 0,
            runners: ["2B"],
            batterHand: "R",
            hitType: "Deep fly ball to Left-Center near warning track",
            description:
                "LC catches deep fly; runner tags at 2B and advances to 3B. LC throws into SS cutoff at edge of grass.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 38,
                    y: 20,
                },
                label: "Deep Catch in LC",
            },
            {
                step: 0.7,
                pos: {
                    x: 36,
                    y: 44,
                },
                label: "Cutoff to 3B",
            },
            {
                step: 1,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Play at 3B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 26,
                    y: 58,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Sprint behind 3B bag in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Hold home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "primary",
                notes: "Anchor at 3B bag, prepare for high throw or tag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 36,
                    y: 44,
                },
                role: "Cutoff to 3B",
                priority: "cutoff",
                notes: "Go out to outfield grass, line up throw from LC to 3B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 24,
                },
                role: "Back up LC",
                priority: "backup",
                notes: "Pursue to back up LC.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 38,
                    y: 20,
                },
                role: "Catch deep fly and throw to SS",
                priority: "primary",
                notes: "Catch ball, turn quickly, fire strong throw into SS cutoff.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 48,
                    y: 22,
                },
                role: "Back up LC",
                priority: "backup",
                notes: "Back up LC.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 70,
                    y: 36,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold position.",
            },
        ],
    },
    {
        id: "r2-fly-rc-deep-tag",
        title: "Deep Fly to RC - Runner Tags to 3B",
        category: "Scoring Position",
        subCategory: "Fly Ball / Tag",
        tags: ["runner-on-2nd", "tag-up", "deep-fly", "RC-catch"],
        situation: {
            outs: 0,
            runners: ["2B"],
            batterHand: "L",
            hitType: "Deep fly ball to Right-Center; runner tags 2B to 3B",
            description:
                "RC catches deep fly; runner tags easily to 3B. Throw comes into SS cutoff to keep play under control.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 62,
                    y: 20,
                },
                label: "Deep Catch in RC",
            },
            {
                step: 0.7,
                pos: {
                    x: 46,
                    y: 46,
                },
                label: "Cutoff to 3B",
            },
            {
                step: 1,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Play at 3B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 26,
                    y: 58,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Sprint behind 3B bag.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Hold home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 54,
                    y: 46,
                },
                role: "Cutoff / trail",
                priority: "cutoff",
                notes: "Shade between RC and infield.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "primary",
                notes: "Straddle 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 46,
                    y: 46,
                },
                role: "Cutoff to 3B",
                priority: "cutoff",
                notes: "Line up between RC catch and 3B bag, take throw from RC.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 38,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 50,
                    y: 22,
                },
                role: "Back up RC",
                priority: "backup",
                notes: "Back up RC.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 62,
                    y: 20,
                },
                role: "Catch deep fly and fire to SS",
                priority: "primary",
                notes: "Make catch, set feet, throw strike to SS cutoff.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 72,
                    y: 24,
                },
                role: "Back up RC",
                priority: "backup",
                notes: "Back up RC.",
            },
        ],
    },
    {
        id: "r2-fly-rf-tag-3b",
        title: "Fly Ball to RF - Tag-Up to 3B",
        category: "Scoring Position",
        subCategory: "Fly Ball / Tag",
        tags: ["runner-on-2nd", "tag-up", "RF-fly", "cross-diamond-throw"],
        situation: {
            outs: 0,
            runners: ["2B"],
            batterHand: "L",
            hitType:
                "Medium-deep fly ball to Right Field; runner on 2nd tagging",
            description:
                "RF catches and uncorks throw across diamond toward 3B; SS acts as cutoff in front of 2B bag, 3B prepares for tag.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 75,
                    y: 30,
                },
                label: "Catch in RF",
            },
            {
                step: 1,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Play at 3B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 26,
                    y: 58,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Sprint behind 3B bag in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Stay at home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 54,
                    y: 48,
                },
                role: "Cover 2B area",
                priority: "coverage",
                notes: "Watch runner tag 2B, call early leaves.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "primary",
                notes: "Straddle 3B bag, give clear target to thrower/cutoff.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 48,
                    y: 50,
                },
                role: "Cutoff to 3B",
                priority: "cutoff",
                notes: "Line up between RF and 3B bag near pitcher mound, hands high.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 44,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Move behind 3B bag to back up throw from RF.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 44,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 68,
                    y: 28,
                },
                role: "Back up RF",
                priority: "backup",
                notes: "Back up RF.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 75,
                    y: 30,
                },
                role: "Catch fly and fire to 3B",
                priority: "primary",
                notes: "Catch ball on throwing side, plant and drive throw through SS cutoff toward 3B.",
            },
        ],
    },
    {
        id: "r3-gb-infield-in-home",
        title: "Infield In: Ground Ball to SS - Play at Home",
        category: "Scoring Position",
        subCategory: "Infield Grounder",
        tags: ["runner-on-3rd", "infield-in", "play-at-home", "tag-play"],
        situation: {
            outs: 0,
            runners: ["3B"],
            batterHand: "R",
            hitType: "Sharp ground ball to Shortstop playing in on the grass",
            description:
                "Infield playing shallow; SS fields grounder, fires immediate strike to Catcher at home plate for tag play.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 44,
                    y: 53,
                },
                label: "Fielded by SS",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Tag Play at Home",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind home plate in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Receive throw and apply tag",
                priority: "primary",
                notes: "Set up in front of plate, give low target, sweep tag incoming runner on 3B line.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 64,
                    y: 58,
                },
                role: "Infield in / cover 1B",
                priority: "coverage",
                notes: "Playing in on grass; be ready for snap throw to 1B if runner retreats.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 55,
                    y: 51,
                },
                role: "Infield in / cover 2B",
                priority: "coverage",
                notes: "Playing in on grass; cover 2B bag if needed.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 36,
                    y: 58,
                },
                role: "Infield in / cover 3B bag",
                priority: "coverage",
                notes: "Hold 3B bag to prevent runner from retreating safely.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 44,
                    y: 53,
                },
                role: "Field grounder and fire home",
                priority: "primary",
                notes: "Field out front on grass, make quick transfer, deliver low, firm strike to Catcher mask-to-chest.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 40,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 60,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 44,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold right field.",
            },
        ],
    },
    {
        id: "r3-gb-infield-back-1b",
        title: "Infield Back: Ground Ball to 2B - Throw to 1B",
        category: "Scoring Position",
        subCategory: "Infield Grounder",
        tags: ["runner-on-3rd", "infield-back", "concede-run", "throw-to-1B"],
        situation: {
            outs: 0,
            runners: ["3B"],
            batterHand: "L",
            hitType:
                "Routine ground ball to 2B; defense playing back for the sure out",
            description:
                "Up multiple runs or prioritizing out: 2B fields cleanly and throws to 1B for the guaranteed out while runner scores.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 57,
                    y: 50,
                },
                label: "Fielded by 2B",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Out at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 52,
                    y: 60,
                },
                role: "Clear middle lane",
                priority: "backup",
                notes: "Shade toward 1B line.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Receive runner crossing plate, keep eye on batter-runner.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Receive throw at 1B",
                priority: "primary",
                notes: "Anchor on bag, stretch toward 2B throw for sure out.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 57,
                    y: 50,
                },
                role: "Field grounder and throw 1B",
                priority: "primary",
                notes: "Field cleanly in center of body, deliver accurate throw to 1B; do not panic about runner scoring.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Back up 2B",
                priority: "backup",
                notes: "Shade toward 2B.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 62,
                    y: 32,
                },
                role: "Back up 2B",
                priority: "backup",
                notes: "Charge toward 2B.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 50,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint behind 1B bag.",
            },
        ],
    },
    {
        id: "r3-gb-infield-in-1b-home",
        title: "Infield In: Ground Ball to 1B - Play at Home",
        category: "Scoring Position",
        subCategory: "Infield Grounder",
        tags: ["runner-on-3rd", "infield-in", "1B-play", "play-at-home"],
        situation: {
            outs: 0,
            runners: ["3B"],
            batterHand: "R",
            hitType: "Ground ball to 1B playing in on grass",
            description:
                "Infield in: 1B fields cleanly on grass and fires strike to Catcher at Home Plate to tag out runner.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 64,
                    y: 60,
                },
                label: "1B Fields Ball",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Play at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 68,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind home plate to back up catcher.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 78,
                },
                role: "Receive throw and apply tag",
                priority: "primary",
                notes: "Block plate, receive throw on 1B side, apply sweep tag.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 64,
                    y: 60,
                },
                role: "Field and throw to home",
                priority: "primary",
                notes: "Field cleanly in on grass, set feet, fire chest-high strike to catcher.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Sprint to cover 1B bag in case runner retreats.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Hold 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover second base.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 42,
                },
                role: "Back up 3B",
                priority: "backup",
                notes: "Back up third base.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 40,
                    y: 32,
                },
                role: "Back up middle infield",
                priority: "backup",
                notes: "Shade toward second.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 60,
                    y: 32,
                },
                role: "Back up middle infield",
                priority: "backup",
                notes: "Shade toward second.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 72,
                    y: 46,
                },
                role: "Back up first base",
                priority: "backup",
                notes: "Sprint to back up 1B bag.",
            },
        ],
    },
    {
        id: "r3-fly-lf-tag-home",
        title: "Sacrifice Fly to LF - Play at Home Plate",
        category: "Scoring Position",
        subCategory: "Fly Ball / Tag",
        tags: ["runner-on-3rd", "sac-fly", "play-at-home", "LF-fly"],
        situation: {
            outs: 0,
            runners: ["3B"],
            batterHand: "R",
            hitType: "Medium fly ball to Left Field; runner tagging at 3B",
            description:
                "LF catches and unloads home; 3B sets up cutoff to home plate, C prepares for sweep tag, P backs up home.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 25,
                    y: 32,
                },
                label: "Catch in LF",
            },
            {
                step: 0.7,
                pos: {
                    x: 38,
                    y: 66,
                },
                label: "Cutoff to Home",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Play at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint deep behind home plate in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate and tag",
                priority: "primary",
                notes: "Set up in front of plate, give clear target, direct 3B cutoff, prepare for collision/tag.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to hold batter-runner.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 38,
                    y: 66,
                },
                role: "Cutoff to home",
                priority: "cutoff",
                notes: "Line up between LF catch and home plate, hands high.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 25,
                    y: 32,
                },
                role: "Catch and fire home",
                priority: "primary",
                notes: "Catch ball on throwing shoulder, deliver one-hop strike home through 3B cutoff.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 32,
                    y: 26,
                },
                role: "Back up LF catch",
                priority: "backup",
                notes: "Sprint to back up LF.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 55,
                    y: 28,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 72,
                    y: 38,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold right field.",
            },
        ],
    },
    {
        id: "r3-fly-lc-tag-home",
        title: "Sacrifice Fly to LC - Play at Home Plate",
        category: "Scoring Position",
        subCategory: "Fly Ball / Tag",
        tags: ["runner-on-3rd", "sac-fly", "play-at-home", "LC-fly"],
        situation: {
            outs: 0,
            runners: ["3B"],
            batterHand: "R",
            hitType:
                "Medium-deep fly ball to Left-Center; runner tagging at 3B",
            description:
                "LC catches fly and fires home; 3B lines up cutoff, SS covers 3B, C covers plate, P backs up home.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 38,
                    y: 25,
                },
                label: "Catch in LC",
            },
            {
                step: 0.7,
                pos: {
                    x: 42,
                    y: 66,
                },
                label: "Cutoff to Home",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Play at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind home plate in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate and tag",
                priority: "primary",
                notes: "Position in front of plate, guide 3B cutoff with loud commands.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 42,
                    y: 66,
                },
                role: "Cutoff to home",
                priority: "cutoff",
                notes: "Line up directly between LC and home plate, hands raised high.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 30,
                    y: 28,
                },
                role: "Back up LC catch",
                priority: "backup",
                notes: "Sprint to back up LC.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 38,
                    y: 25,
                },
                role: "Catch and throw home",
                priority: "primary",
                notes: "Make catch moving toward plate, crow-hop and throw strike home through 3B cutoff.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 50,
                    y: 24,
                },
                role: "Back up LC catch",
                priority: "backup",
                notes: "Back up LC.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 70,
                    y: 36,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold right field.",
            },
        ],
    },
    {
        id: "r3-fly-rc-tag-home",
        title: "Sacrifice Fly to RC - Play at Home Plate",
        category: "Scoring Position",
        subCategory: "Fly Ball / Tag",
        tags: ["runner-on-3rd", "sac-fly", "play-at-home", "RC-fly"],
        situation: {
            outs: 0,
            runners: ["3B"],
            batterHand: "L",
            hitType: "Medium fly ball to Right-Center; runner tagging at 3B",
            description:
                "RC catches fly and fires home; 1B acts as cutoff to home, C sets up for tag, P backs up home.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 62,
                    y: 25,
                },
                label: "Catch in RC",
            },
            {
                step: 0.7,
                pos: {
                    x: 56,
                    y: 66,
                },
                label: "Cutoff to Home",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Play at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind home plate in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate and tag",
                priority: "primary",
                notes: "Position in front of plate, guide 1B cutoff alignment.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 56,
                    y: 66,
                },
                role: "Cutoff to home",
                priority: "cutoff",
                notes: "Move in line between RC fielder and home plate, hands high.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to hold batter-runner.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 44,
                    y: 50,
                },
                role: "Pinch toward middle",
                priority: "backup",
                notes: "Shade behind 2B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 38,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 50,
                    y: 24,
                },
                role: "Back up RC catch",
                priority: "backup",
                notes: "Sprint to back up RC.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 62,
                    y: 25,
                },
                role: "Catch and fire home",
                priority: "primary",
                notes: "Catch ball on throwing side, deliver strong throw on a line through 1B cutoff.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 70,
                    y: 30,
                },
                role: "Back up RC catch",
                priority: "backup",
                notes: "Back up RC.",
            },
        ],
    },
    {
        id: "r3-fly-rf-tag-home",
        title: "Sacrifice Fly to RF - Play at Home Plate",
        category: "Scoring Position",
        subCategory: "Fly Ball / Tag",
        tags: ["runner-on-3rd", "sac-fly", "play-at-home", "RF-fly"],
        situation: {
            outs: 0,
            runners: ["3B"],
            batterHand: "L",
            hitType:
                "Medium-shallow fly ball to Right Field; runner tagging at 3B",
            description:
                "RF catches and fires home; 1B sets up cutoff to home plate, C sets up for tag, P backs up home.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 75,
                    y: 32,
                },
                label: "Catch in RF",
            },
            {
                step: 0.7,
                pos: {
                    x: 60,
                    y: 66,
                },
                label: "Cutoff to Home",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Play at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind home plate in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate and tag",
                priority: "primary",
                notes: "Set up in front of plate, guide 1B cutoff, prepare for tag.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 60,
                    y: 66,
                },
                role: "Cutoff to home",
                priority: "cutoff",
                notes: "Line up between RF catch and home plate, hands high.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to prevent batter from advancing.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 44,
                    y: 50,
                },
                role: "Hold middle",
                priority: "backup",
                notes: "Shade toward 2B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 44,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 68,
                    y: 28,
                },
                role: "Back up RF catch",
                priority: "backup",
                notes: "Sprint to back up RF.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 75,
                    y: 32,
                },
                role: "Catch and fire home",
                priority: "primary",
                notes: "Catch ball on throwing side, fire powerful one-hop strike home through 1B cutoff.",
            },
        ],
    },
    {
        id: "r12-gb-3b-step-tag",
        title: "Ground Ball to 3B - Step on 3B Bag, Throw to 1B",
        category: "Runners on 1st & 2nd",
        subCategory: "Infield Grounder",
        tags: ["runners-1st-2nd", "3B-unassisted", "force-out", "double-play"],
        situation: {
            outs: 0,
            runners: ["1B", "2B"],
            batterHand: "R",
            hitType: "Sharp ground ball right down the 3B line",
            description:
                "3B fields cleanly near bag, steps on 3B bag for lead force out, then fires strike to 1B for the double play.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Fielded & Step on 3B",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Play at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 62,
                },
                role: "Duck and clear lane",
                priority: "backup",
                notes: "Clear throwing lane between 3B and 1B.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Stay at plate and direct throw to 1B.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Receive throw at 1B",
                priority: "primary",
                notes: "Set up on 1B bag, present big target, stretch toward 3B.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag in case 3B throws to 2B.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Field, step on 3B bag, throw to 1B",
                priority: "primary",
                notes: "Field cleanly, step on 3B bag with right foot, plant and fire strike across diamond to 1B.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 40,
                    y: 52,
                },
                role: "Back up 3B",
                priority: "backup",
                notes: "Pinch toward 3B to back up grounder.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 44,
                },
                role: "Back up 3B line",
                priority: "backup",
                notes: "Charge toward 3B line.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 40,
                    y: 32,
                },
                role: "Back up infield",
                priority: "backup",
                notes: "Hold positioning.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 58,
                    y: 32,
                },
                role: "Back up infield",
                priority: "backup",
                notes: "Hold positioning.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 50,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint behind 1B bag.",
            },
        ],
    },
    {
        id: "r12-gb-ss-force-3b",
        title: "Ground Ball to Shortstop - Force Out at 3B",
        category: "Runners on 1st & 2nd",
        subCategory: "Infield Grounder",
        tags: ["runners-1st-2nd", "SS-to-3B", "lead-runner-out", "force-play"],
        situation: {
            outs: 0,
            runners: ["1B", "2B"],
            batterHand: "R",
            hitType: "Sharp ground ball to SS in the 5-6 hole",
            description:
                "SS fields moving right, plants and fires quick bullet to 3B covering 3B bag for the lead force out.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 40,
                    y: 51,
                },
                label: "Fielded by SS",
            },
            {
                step: 1,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Force at 3B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 48,
                    y: 60,
                },
                role: "Back up 3B throw",
                priority: "backup",
                notes: "Shade toward 3B line.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: 'Stay at home plate, call "3! 3!"',
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag in case 3B throws across to 1B.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag for potential back-pick.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag for force out",
                priority: "primary",
                notes: "Anchor right foot on 3B bag, present wide target to SS, catch ball cleanly for the force.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 40,
                    y: 51,
                },
                role: "Field grounder and throw to 3B",
                priority: "primary",
                notes: "Field in balance, make quick shuffle, deliver chest-high strike to 3B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 40,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Back up 3B bag in case of overthrow.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Back up middle",
                priority: "backup",
                notes: "Hold positioning.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 60,
                    y: 32,
                },
                role: "Back up 2B bag",
                priority: "backup",
                notes: "Shade toward 2B bag.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 72,
                    y: 44,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold right field.",
            },
        ],
    },
    {
        id: "r12-gb-2b-force-2b-1b",
        title: "Ground Ball to 2B - 4-6-3 Double Play",
        category: "Runners on 1st & 2nd",
        subCategory: "Double Play",
        tags: ["runners-1st-2nd", "4-6-3", "double-play", "force-play"],
        situation: {
            outs: 0,
            runners: ["1B", "2B"],
            batterHand: "L",
            hitType: "Routine ground ball to 2B",
            description:
                "2B fields cleanly, tosses to SS covering 2B bag, SS turns double play to 1B; lead runner advances to 3B.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 57,
                    y: 50,
                },
                label: "Fielded by 2B",
            },
            {
                step: 0.7,
                pos: {
                    x: 50,
                    y: 48,
                },
                label: "Force at 2B Bag",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Play at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 52,
                    y: 60,
                },
                role: "Clear middle lane",
                priority: "backup",
                notes: "Clear throwing lane between SS and 1B.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Stay at home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Receive relay at 1B",
                priority: "primary",
                notes: "Set feet on bag, give target to SS.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 57,
                    y: 50,
                },
                role: "Field grounder and feed SS",
                priority: "primary",
                notes: "Field out front, deliver firm underhand flip to SS chest.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag to hold advancing runner from 2B.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag, turn double play",
                priority: "primary",
                notes: "Catch flip across bag, touch bag, fire sidearm/overhand bullet to 1B.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Back up 2B bag",
                priority: "backup",
                notes: "Back up 2B bag.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 62,
                    y: 32,
                },
                role: "Back up 2B fielder",
                priority: "backup",
                notes: "Charge toward 2B.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 50,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint behind 1B bag.",
            },
        ],
    },
    {
        id: "r12-gb-p-force-3b",
        title: "Ground Ball to Pitcher - Force Out at 3B",
        category: "Runners on 1st & 2nd",
        subCategory: "Infield Grounder",
        tags: ["runners-1st-2nd", "P-to-3B", "lead-runner-out", "force-play"],
        situation: {
            outs: 0,
            runners: ["1B", "2B"],
            batterHand: "R",
            hitType: "Slow comebacker ground ball to Pitcher",
            description:
                "Pitcher fields cleanly, spins toward 3B, and fires chest-high strike to 3B covering 3B bag for the lead force out.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 50,
                    y: 61,
                },
                label: "Fielded by P",
            },
            {
                step: 1,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Force at 3B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 61,
                },
                role: "Field and throw to 3B",
                priority: "primary",
                notes: "Field cleanly, set left foot toward 3B, deliver firm, accurate chest throw to 3B bag.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Direct play",
                priority: "coverage",
                notes: 'Loudly call "3! 3! Third base!"',
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag in case runner retreats.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag for force out",
                priority: "primary",
                notes: "Get to 3B bag immediately, give wide chest target to pitcher, keep foot on bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 42,
                    y: 50,
                },
                role: "Back up 3B throw",
                priority: "backup",
                notes: "Pinch behind 3B bag to back up throw.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 42,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Sprint to back up 3B line.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 40,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 60,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 72,
                    y: 46,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold right field.",
            },
        ],
    },
    {
        id: "r12-gb-1b-step-tag",
        title: "Ground Ball to 1B - Step on 1B, Hold Runners",
        category: "Runners on 1st & 2nd",
        subCategory: "Infield Grounder",
        tags: ["runners-1st-2nd", "1B-play", "unassisted", "hold-runners"],
        situation: {
            outs: 0,
            runners: ["1B", "2B"],
            batterHand: "R",
            hitType: "Sharp ground ball to 1B near bag",
            description:
                "1B fields cleanly, touches 1B bag for sure out, checks runners advancing to 2B and 3B.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.45,
                pos: {
                    x: 67,
                    y: 55,
                },
                label: "1B Fields Ball",
            },
            {
                step: 0.7,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "1B Steps on Bag",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "1B Checks Runners",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 60,
                    y: 58,
                },
                role: "Back up 1B bag",
                priority: "backup",
                notes: "Sprint toward 1B line to back up first baseman.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 78,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Hold home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 67,
                    y: 55,
                },
                role: "Field ball and step on 1B bag",
                priority: "primary",
                notes: "Field cleanly, step on bag for sure out, immediately glance at advancing runners.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 64,
                    y: 48,
                },
                role: "Back up 1B",
                priority: "coverage",
                notes: "Move into shallow right field to back up 1B.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag for tag or throw.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover second base.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 42,
                },
                role: "Back up 3B",
                priority: "backup",
                notes: "Back up third base.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Back up 2B",
                priority: "backup",
                notes: "Back up second base.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 62,
                    y: 32,
                },
                role: "Back up right side",
                priority: "backup",
                notes: "Back up right side.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 44,
                },
                role: "Back up 1B line",
                priority: "backup",
                notes: "Charge down right field line to back up 1B.",
            },
        ],
    },
    {
        id: "r12-single-lf-home",
        title: "Base Hit to LF - Play at Home",
        category: "Runners on 1st & 2nd",
        subCategory: "Base Hit",
        tags: ["runners-1st-2nd", "play-at-home", "LF-single", "3B-cutoff"],
        situation: {
            outs: 0,
            runners: ["1B", "2B"],
            batterHand: "R",
            hitType: "Sharp single to LF; runner from 2nd rounding 3B hard",
            description:
                "LF charges and fires home; 3B sets up cutoff to home, SS covers 3B to hold runner from 1st, C covers plate, P backs up home.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 25,
                    y: 38,
                },
                label: "Fielded by LF",
            },
            {
                step: 0.7,
                pos: {
                    x: 40,
                    y: 68,
                },
                label: "Cutoff to Home",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Play at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind home plate in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate and tag",
                priority: "primary",
                notes: 'Position in front of plate, direct 3B cutoff ("Cut 3!" or "Let it go!").',
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to prevent batter from taking 2B.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 40,
                    y: 68,
                },
                role: "Cutoff to home",
                priority: "cutoff",
                notes: "Line up between LF and home plate halfway down 3B line, hands high.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag to receive cutoff throw if trail runner tries for 3B.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 25,
                    y: 38,
                },
                role: "Field and fire home",
                priority: "primary",
                notes: "Charge ball hard, deliver low, powerful one-hop throw to C through 3B cutoff.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 32,
                    y: 32,
                },
                role: "Back up LF",
                priority: "backup",
                notes: "Sprint to back up LF.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 55,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 72,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold right field.",
            },
        ],
    },
    {
        id: "r12-single-lc-play-3b",
        title: "Deep Single to LC - Play on Trail Runner at 3B",
        category: "Runners on 1st & 2nd",
        subCategory: "Base Hit",
        tags: ["runners-1st-2nd", "play-at-3B", "LC-single", "SS-cutoff"],
        situation: {
            outs: 0,
            runners: ["1B", "2B"],
            batterHand: "R",
            hitType: "Deep single into LC gap; lead runner scores easily",
            description:
                "Lead runner scores easily; defense concedes run to nail runner from 1st trying to reach 3B. LC fires to 3B through SS cutoff.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 38,
                    y: 30,
                },
                label: "Fielded by LC",
            },
            {
                step: 0.7,
                pos: {
                    x: 36,
                    y: 48,
                },
                label: "Cutoff to 3B",
            },
            {
                step: 1,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Play at 3B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 26,
                    y: 58,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Sprint behind 3B bag in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Hold home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to hold batter-runner.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "primary",
                notes: "Straddle 3B bag, call out to SS cutoff, prepare for tag on trail runner.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 36,
                    y: 48,
                },
                role: "Cutoff to 3B",
                priority: "cutoff",
                notes: "Line up between LC and 3B bag, hands high.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 30,
                    y: 32,
                },
                role: "Back up LC",
                priority: "backup",
                notes: "Sprint to back up LC.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 38,
                    y: 30,
                },
                role: "Field and throw to 3B",
                priority: "primary",
                notes: "Field cleanly, fire strike through SS cutoff to 3B bag.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 50,
                    y: 26,
                },
                role: "Back up LC",
                priority: "backup",
                notes: "Back up LC.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 70,
                    y: 38,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold right field.",
            },
        ],
    },
    {
        id: "r12-single-rc-play-3b",
        title: "Single to RC - Play at 3B on Trail Runner",
        category: "Runners on 1st & 2nd",
        subCategory: "Base Hit",
        tags: ["runners-1st-2nd", "play-at-3B", "RC-single", "SS-cutoff"],
        situation: {
            outs: 0,
            runners: ["1B", "2B"],
            batterHand: "L",
            hitType: "Single into Right-Center gap; lead runner scores",
            description:
                "RC fields single, throws through SS cutoff to 3B bag to catch runner advancing from 1st to 3rd.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 62,
                    y: 30,
                },
                label: "Fielded by RC",
            },
            {
                step: 0.7,
                pos: {
                    x: 44,
                    y: 50,
                },
                label: "Cutoff to 3B",
            },
            {
                step: 1,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Play at 3B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 26,
                    y: 58,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Sprint behind 3B bag in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Hold home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to hold batter-runner.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "primary",
                notes: "Straddle 3B bag, direct SS cutoff alignment.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 44,
                    y: 50,
                },
                role: "Cutoff to 3B",
                priority: "cutoff",
                notes: "Line up between RC and 3B bag near pitcher mound, hands high.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 40,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Move in to back up 3B.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 50,
                    y: 26,
                },
                role: "Back up RC",
                priority: "backup",
                notes: "Sprint to back up RC.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 62,
                    y: 30,
                },
                role: "Field and throw to 3B",
                priority: "primary",
                notes: "Field cleanly, hit SS cutoff chest-high toward 3B.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 70,
                    y: 32,
                },
                role: "Back up RC",
                priority: "backup",
                notes: "Back up RC.",
            },
        ],
    },
    {
        id: "r12-single-rf-home",
        title: "Hard Single to RF - Play at Home",
        category: "Runners on 1st & 2nd",
        subCategory: "Base Hit",
        tags: ["runners-1st-2nd", "play-at-home", "RF-single", "1B-cutoff"],
        situation: {
            outs: 0,
            runners: ["1B", "2B"],
            batterHand: "L",
            hitType:
                "Hard single hit directly at RF; runner from 2nd challenging home",
            description:
                "RF charges hard and fires home; 1B cuts off throw, C covers plate, 2B covers 2B, SS covers 3B.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 74,
                    y: 38,
                },
                label: "Fielded by RF",
            },
            {
                step: 0.7,
                pos: {
                    x: 60,
                    y: 66,
                },
                label: "Cutoff to Home",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Play at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind home plate in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate and tag",
                priority: "primary",
                notes: 'Position in front of plate, direct 1B cutoff ("Cut 2!" or "Let it go!").',
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 60,
                    y: 66,
                },
                role: "Cutoff to home",
                priority: "cutoff",
                notes: "Line up between RF and home plate halfway down 1B line, hands high.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to hold batter-runner from taking 2B.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag to hold runner advancing from 1st.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 42,
                    y: 50,
                },
                role: "Pinch toward middle",
                priority: "backup",
                notes: "Shade behind 2B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 44,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 68,
                    y: 32,
                },
                role: "Back up RF",
                priority: "backup",
                notes: "Sprint to back up RF.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 38,
                },
                role: "Field and fire home",
                priority: "primary",
                notes: "Charge ball hard, deliver low, powerful one-hop throw to C through 1B cutoff.",
            },
        ],
    },
    {
        id: "r12-fly-lf-tag-3b",
        title: "Deep Fly to LF - Tag-Up to 3B",
        category: "Runners on 1st & 2nd",
        subCategory: "Fly Ball / Tag",
        tags: ["runners-1st-2nd", "tag-up", "LF-fly", "throw-to-3B"],
        situation: {
            outs: 0,
            runners: ["1B", "2B"],
            batterHand: "R",
            hitType: "Deep fly ball to Left Field; runner on 2nd tagging",
            description:
                "LF catches deep fly and throws to 3B bag; SS acts as cutoff, 2B covers 2B bag to hold trail runner.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 24,
                    y: 24,
                },
                label: "Deep Catch in LF",
            },
            {
                step: 0.7,
                pos: {
                    x: 28,
                    y: 46,
                },
                label: "Cutoff to 3B",
            },
            {
                step: 1,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Play at 3B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 26,
                    y: 58,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Sprint behind 3B bag in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Stay at home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to prevent trail runner from advancing.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "primary",
                notes: "Straddle 3B bag, prepare for tag on sliding runner.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 28,
                    y: 46,
                },
                role: "Cutoff to 3B",
                priority: "cutoff",
                notes: "Line up between LF catch and 3B bag at edge of grass.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 24,
                    y: 24,
                },
                role: "Catch deep fly and throw to 3B",
                priority: "primary",
                notes: "Catch ball, turn and fire strong strike into SS cutoff toward 3B.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 32,
                    y: 24,
                },
                role: "Back up LF catch",
                priority: "backup",
                notes: "Back up LF.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 55,
                    y: 28,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 72,
                    y: 38,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold right field.",
            },
        ],
    },
    {
        id: "r12-fly-cf-tag-double",
        title: "Deep Fly to Center - Tag-Up Both Runners",
        category: "Runners on 1st & 2nd",
        subCategory: "Fly Ball / Tag",
        tags: ["runners-1st-2nd", "tag-up", "deep-center", "trail-advancement"],
        situation: {
            outs: 0,
            runners: ["1B", "2B"],
            batterHand: "R",
            hitType: "Deep fly ball to dead center field; both runners tag",
            description:
                "RC catches deep fly; throw comes into SS cutoff to keep play at 2B / 3B under control and prevent further advancement.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 52,
                    y: 20,
                },
                label: "Catch in Center",
            },
            {
                step: 0.7,
                pos: {
                    x: 48,
                    y: 44,
                },
                label: "Cutoff to SS",
            },
            {
                step: 1,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Play at 3B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 26,
                    y: 58,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Sprint behind 3B bag.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Hold home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to receive snap throw on trail runner.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "primary",
                notes: "Straddle 3B bag for tag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 48,
                    y: 44,
                },
                role: "Cutoff to 3B/2B",
                priority: "cutoff",
                notes: "Position at edge of dirt; receive throw from RC, make quick look to 3B then 2B.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 32,
                    y: 30,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 46,
                    y: 22,
                },
                role: "Back up RC catch",
                priority: "backup",
                notes: "Back up RC.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 52,
                    y: 20,
                },
                role: "Catch deep fly and throw to SS",
                priority: "primary",
                notes: "Catch, crow-hop, deliver firm strike into SS cutoff.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 68,
                    y: 26,
                },
                role: "Back up RC catch",
                priority: "backup",
                notes: "Back up RC.",
            },
        ],
    },
    {
        id: "r12-fly-rf-tag-adv",
        title: "Deep Fly to RF - Both Runners Advance",
        category: "Runners on 1st & 2nd",
        subCategory: "Fly Ball / Tag",
        tags: ["runners-1st-2nd", "tag-up", "RF-fly", "trail-advancement"],
        situation: {
            outs: 0,
            runners: ["1B", "2B"],
            batterHand: "L",
            hitType: "Deep fly ball to Right Field; both runners tagging",
            description:
                "RF catches deep fly, throws into 2B cutoff; lead runner reaches 3B easily, play is keeping trail runner at 1B/2B.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 78,
                    y: 22,
                },
                label: "Catch in Deep RF",
            },
            {
                step: 0.7,
                pos: {
                    x: 58,
                    y: 46,
                },
                label: "Cutoff to 2B",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 48,
                },
                label: "Play at 2B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 26,
                    y: 58,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Sprint behind 3B bag.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Hold home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 58,
                    y: 46,
                },
                role: "Cutoff from RF",
                priority: "cutoff",
                notes: "Go out toward RF grass to receive throw from RF.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "primary",
                notes: "Cover 2B bag to receive throw from 2B cutoff on trail runner.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 44,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 70,
                    y: 24,
                },
                role: "Back up RF catch",
                priority: "backup",
                notes: "Sprint to back up RF.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 78,
                    y: 22,
                },
                role: "Catch deep fly and throw to 2B cutoff",
                priority: "primary",
                notes: "Catch ball, turn and fire strike into 2B cutoff.",
            },
        ],
    },
    {
        id: "r13-gb-infield-in-home",
        title: "Infield In: Ground Ball to SS - Play at Home",
        category: "First & Third",
        subCategory: "Infield Grounder",
        tags: ["first-and-third", "infield-in", "play-at-home", "tag-play"],
        situation: {
            outs: 0,
            runners: ["1B", "3B"],
            batterHand: "R",
            hitType: "Sharp ground ball to SS playing on infield grass",
            description:
                "Infield shallow to prevent run; SS fields cleanly and delivers strike home to C for the tag on runner breaking from 3B.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 44,
                    y: 53,
                },
                label: "Fielded by SS",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Tag Play at Home",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind home plate in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Receive throw and apply tag",
                priority: "primary",
                notes: "Block the plate, present low target, sweep tag incoming runner.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 64,
                    y: 58,
                },
                role: "Infield in / cover 1B",
                priority: "coverage",
                notes: "Cover 1B bag in case runner from 1st wanders off.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 55,
                    y: 51,
                },
                role: "Infield in / cover 2B",
                priority: "coverage",
                notes: "Cover 2B bag for potential throw from C.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 36,
                    y: 58,
                },
                role: "Infield in / cover 3B",
                priority: "coverage",
                notes: "Cover 3B bag if runner tries to retreat.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 44,
                    y: 53,
                },
                role: "Field grounder and fire home",
                priority: "primary",
                notes: "Field out front, quick transfer, deliver firm low strike to Catcher.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 40,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 60,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 44,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold right field.",
            },
        ],
    },
    {
        id: "r13-gb-middle-dp",
        title: "Infield DP Depth: Ground Ball to 2B - 4-6-3 Double Play",
        category: "First & Third",
        subCategory: "Double Play",
        tags: ["first-and-third", "4-6-3", "concede-run", "double-play"],
        situation: {
            outs: 0,
            runners: ["1B", "3B"],
            batterHand: "L",
            hitType:
                "Routine ground ball to 2B; middle infield at double play depth",
            description:
                "Up multiple runs: defense trades 1 run for 2 outs. 2B flips to SS at 2B bag, SS turns double play to 1B while runner from 3B scores.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 57,
                    y: 50,
                },
                label: "Fielded by 2B",
            },
            {
                step: 0.7,
                pos: {
                    x: 50,
                    y: 48,
                },
                label: "Force at 2B Bag",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Out at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 52,
                    y: 60,
                },
                role: "Clear middle lane",
                priority: "backup",
                notes: "Stay out of throwing lane between SS and 1B.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Receive runner crossing plate, watch batter-runner.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Receive relay throw at 1B",
                priority: "primary",
                notes: "Set feet on 1B bag, stretch to beat runner.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 57,
                    y: 50,
                },
                role: "Field grounder and flip to SS",
                priority: "primary",
                notes: "Field in balance, firm underhand flip to SS chest.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag, turn double play",
                priority: "primary",
                notes: "Receive flip across bag, touch bag, fire sidearm/overhand bullet to 1B.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Back up 2B bag",
                priority: "backup",
                notes: "Back up second base.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 62,
                    y: 32,
                },
                role: "Back up 2B fielder",
                priority: "backup",
                notes: "Charge toward 2B.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 50,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint behind 1B bag in foul territory.",
            },
        ],
    },
    {
        id: "r13-gb-p-freeze-3b",
        title: "Comebacker to Pitcher - Freeze Runner at 3B, Throw 1B",
        category: "First & Third",
        subCategory: "Infield Grounder",
        tags: ["first-and-third", "comebacker", "freeze-runner", "throw-to-1B"],
        situation: {
            outs: 0,
            runners: ["1B", "3B"],
            batterHand: "R",
            hitType: "Sharp ground ball comebacker to Pitcher",
            description:
                "Pitcher fields cleanly, takes hard look at runner on 3B to freeze them, then fires strike to 1B for the out.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 50,
                    y: 61,
                },
                label: "Fielded by P",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Play at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 61,
                },
                role: "Field, freeze 3B runner, throw 1B",
                priority: "primary",
                notes: "Field ball, snap head toward 3B to freeze runner, then fire chest-high throw to 1B.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Direct play",
                priority: "coverage",
                notes: 'Call "Check 3! Throw 1!"',
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Receive throw at 1B",
                priority: "primary",
                notes: "Anchor on bag, give target to pitcher.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag in case runner from 1B wanders off.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Hold 3B bag to keep runner pinned.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 44,
                    y: 50,
                },
                role: "Hold middle",
                priority: "backup",
                notes: "Shade behind mound.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 40,
                    y: 30,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 60,
                    y: 30,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 50,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint behind 1B bag.",
            },
        ],
    },
    {
        id: "r13-single-lf-hold-trail",
        title: "Single to LF - Hold Trail Runner",
        category: "First & Third",
        subCategory: "Base Hit",
        tags: ["first-and-third", "single", "hold-trail", "cutoff-to-2B"],
        situation: {
            outs: 0,
            runners: ["1B", "3B"],
            batterHand: "R",
            hitType: "Sharp single to Left Field; runner on 3rd scores easily",
            description:
                "Run from 3rd scores; LF fields and fires through SS cutoff into 2B bag to prevent runner from 1st advancing to 3rd.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 26,
                    y: 38,
                },
                label: "Fielded by LF",
            },
            {
                step: 0.7,
                pos: {
                    x: 38,
                    y: 44,
                },
                label: "Cutoff to 2B",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 48,
                },
                label: "Play at 2B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 48,
                    y: 58,
                },
                role: "Back up throw",
                priority: "backup",
                notes: "Shade toward 2B bag.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Hold home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Verify batter touches 1B.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "primary",
                notes: "Cover 2B bag, prepare for tag on advancing runner.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 38,
                    y: 44,
                },
                role: "Cutoff to 2B",
                priority: "cutoff",
                notes: "Line up between LF and 2B bag, let throw pass if on target.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 38,
                },
                role: "Field and fire to 2B",
                priority: "primary",
                notes: "Charge ball, deliver firm strike to 2B bag through SS cutoff.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 32,
                    y: 32,
                },
                role: "Back up LF",
                priority: "backup",
                notes: "Back up LF.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 55,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 72,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold right field.",
            },
        ],
    },
    {
        id: "r13-single-rc-cutoff-2b",
        title: "Single to RC - Cutoff to 2B",
        category: "First & Third",
        subCategory: "Base Hit",
        tags: ["first-and-third", "single", "hold-trail", "cutoff-to-2B"],
        situation: {
            outs: 0,
            runners: ["1B", "3B"],
            batterHand: "L",
            hitType: "Solid single into Right-Center gap; run scores",
            description:
                "RC fields single; 2B acts as cutoff into 2B bag covered by SS to hold trail runner and keep batter at 1B.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 62,
                    y: 30,
                },
                label: "Fielded by RC",
            },
            {
                step: 0.7,
                pos: {
                    x: 56,
                    y: 41,
                },
                label: "Cutoff to 2B",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 48,
                },
                label: "Play at 2B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 52,
                    y: 58,
                },
                role: "Back up throw",
                priority: "backup",
                notes: "Back up 2B bag.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Hold home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 56,
                    y: 41,
                },
                role: "Cutoff to 2B",
                priority: "cutoff",
                notes: "Line up between RC and 2B bag, hands raised.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "primary",
                notes: "Cover 2B bag, direct 2B cutoff.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 38,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 50,
                    y: 26,
                },
                role: "Back up RC",
                priority: "backup",
                notes: "Sprint to back up RC.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 62,
                    y: 30,
                },
                role: "Field and throw to 2B",
                priority: "primary",
                notes: "Field cleanly, fire strike to 2B bag through 2B cutoff.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 70,
                    y: 32,
                },
                role: "Back up RC",
                priority: "backup",
                notes: "Back up RC.",
            },
        ],
    },
    {
        id: "r13-fly-rf-tag-home-cut-2b",
        title: "Sac Fly to RF - Cut Home, Snap Throw to 2B",
        category: "First & Third",
        subCategory: "Fly Ball / Tag",
        tags: ["first-and-third", "sac-fly", "cut-and-snap", "play-at-2B"],
        situation: {
            outs: 0,
            runners: ["1B", "3B"],
            batterHand: "L",
            hitType:
                "Medium fly ball to Right Field; runner on 3rd tags, runner on 1st attempts to advance",
            description:
                "RF fires toward home plate; knowing runner from 3rd will score easily, 1B cuts off throw and fires to 2B bag to nail advancing trail runner.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 75,
                    y: 34,
                },
                label: "Catch in RF",
            },
            {
                step: 0.7,
                pos: {
                    x: 60,
                    y: 66,
                },
                label: "Cutoff Interception",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 48,
                },
                label: "Tag at 2B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind home plate.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Direct cutoff",
                priority: "primary",
                notes: 'Call "Cut 2! Cut 2!" when runner from 3rd has clearly scored.',
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 60,
                    y: 66,
                },
                role: "Cut throw and snap to 2B",
                priority: "cutoff",
                notes: "Intercept throw from RF, pivot and fire bullet to 2B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 54,
                    y: 48,
                },
                role: "Back up 2B bag",
                priority: "backup",
                notes: "Shade behind 2B bag.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag for tag",
                priority: "primary",
                notes: "Cover 2B bag, catch snap throw from 1B, drop sweep tag on sliding trail runner.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 44,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 68,
                    y: 28,
                },
                role: "Back up RF catch",
                priority: "backup",
                notes: "Sprint to back up RF.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 75,
                    y: 34,
                },
                role: "Catch and fire toward home",
                priority: "primary",
                notes: "Make catch, fire strong throw through 1B cutoff.",
            },
        ],
    },
    {
        id: "r23-gb-infield-in-home",
        title: "Infield In: Ground Ball to 3B - Play at Home",
        category: "Scoring Position",
        subCategory: "Infield Grounder",
        tags: ["runners-2nd-3rd", "infield-in", "play-at-home", "tag-play"],
        situation: {
            outs: 0,
            runners: ["2B", "3B"],
            batterHand: "R",
            hitType: "Sharp ground ball to 3B playing in on grass",
            description:
                "Infield drawn in: 3B fields grounder, fires immediate strike to Catcher for tag at home plate.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 36,
                    y: 58,
                },
                label: "Fielded by 3B",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Tag at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind home plate in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Receive throw and apply tag",
                priority: "primary",
                notes: "Block plate, present low target, sweep tag incoming runner on 3B line.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 64,
                    y: 58,
                },
                role: "Infield in",
                priority: "coverage",
                notes: "Playing in on grass; cover 1B bag if runner retreats.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 55,
                    y: 51,
                },
                role: "Infield in / cover 2B",
                priority: "coverage",
                notes: "Cover 2B bag.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 36,
                    y: 58,
                },
                role: "Field grounder and fire home",
                priority: "primary",
                notes: "Field out front, quick transfer, fire low bullet to Catcher.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 40,
                    y: 52,
                },
                role: "Back up 3B / cover 3B bag",
                priority: "coverage",
                notes: "Drop back toward 3B bag to cover bag after throw home.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 40,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 60,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 44,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold right field.",
            },
        ],
    },
    {
        id: "r23-gb-infield-back-1b",
        title: "Infield Back: Ground Ball to SS - Throw to 1B",
        category: "Scoring Position",
        subCategory: "Infield Grounder",
        tags: ["runners-2nd-3rd", "infield-back", "concede-run", "throw-to-1B"],
        situation: {
            outs: 1,
            runners: ["2B", "3B"],
            batterHand: "R",
            hitType:
                "Routine ground ball to Shortstop; defense at normal depth",
            description:
                "With 1 out and a multi-run lead: SS fields cleanly and throws to 1B for the second out, conceding 1 run; 3B stays home to hold runner advancing from 2nd.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 43,
                    y: 50,
                },
                label: "Fielded by SS",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Out at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 62,
                },
                role: "Clear middle lane",
                priority: "backup",
                notes: "Clear throwing lane between SS and 1B.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Receive runner crossing plate, watch runner from 2B advancing to 3B.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Receive throw at 1B",
                priority: "primary",
                notes: "Anchor foot to 1B bag, stretch toward SS for the out.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Anchor at 3B bag to hold trailing runner from taking more than 3B.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 43,
                    y: 50,
                },
                role: "Field grounder and fire to 1B",
                priority: "primary",
                notes: "Field in balance, deliver accurate throw to 1B for the sure out.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 60,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 50,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint behind 1B bag in foul territory.",
            },
        ],
    },
    {
        id: "r23-single-lf-play-home",
        title: "Base Hit to LF - Play at Home on R2",
        category: "Scoring Position",
        subCategory: "Base Hit",
        tags: ["runners-2nd-3rd", "play-at-home", "LF-single", "3B-cutoff"],
        situation: {
            outs: 0,
            runners: ["2B", "3B"],
            batterHand: "R",
            hitType:
                "Sharp single to Left Field; R3 scores, R2 rounding 3B hard",
            description:
                "LF charges single and fires home; 3B sets up cutoff to home plate, C prepares for sweep tag on R2, P backs up home.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 25,
                    y: 38,
                },
                label: "Fielded by LF",
            },
            {
                step: 0.7,
                pos: {
                    x: 40,
                    y: 68,
                },
                label: "Cutoff to Home",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Play at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind home plate in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate and tag",
                priority: "primary",
                notes: 'Position in front of plate, guide 3B cutoff ("Cut 2!" or "Let it go!"), prepare for tag on R2.',
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to hold batter-runner.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 40,
                    y: 68,
                },
                role: "Cutoff to home",
                priority: "cutoff",
                notes: "Line up between LF and home plate halfway down 3B line, hands high.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Rotate to cover 3B bag while 3B acts as cutoff.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 25,
                    y: 38,
                },
                role: "Field and fire home",
                priority: "primary",
                notes: "Charge ball hard, make clean pickup, fire one-hop strike home through 3B cutoff.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 32,
                    y: 32,
                },
                role: "Back up LF",
                priority: "backup",
                notes: "Sprint to back up LF.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 55,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 72,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold right field.",
            },
        ],
    },
    {
        id: "r23-single-lc-cutoff-3b",
        title: "Base Hit to LC - Play at 3B on Batter",
        category: "Scoring Position",
        subCategory: "Base Hit",
        tags: ["runners-2nd-3rd", "play-at-3B", "LC-single", "SS-cutoff"],
        situation: {
            outs: 0,
            runners: ["2B", "3B"],
            batterHand: "R",
            hitType: "Solid line drive into LC gap; both runners score",
            description:
                "Both runners score easily; batter rounds 1B aggressively attempting 2B/3B. LC throws into 3B through SS cutoff.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 38,
                    y: 30,
                },
                label: "Fielded by LC",
            },
            {
                step: 0.7,
                pos: {
                    x: 36,
                    y: 48,
                },
                label: "Cutoff to 3B",
            },
            {
                step: 1,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Play at 3B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 26,
                    y: 58,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Sprint behind 3B bag in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Stay at home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag in case cutoff redirects throw to 2B.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "primary",
                notes: "Straddle 3B bag, direct SS cutoff, prepare for tag on batter.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 36,
                    y: 48,
                },
                role: "Cutoff to 3B",
                priority: "cutoff",
                notes: "Line up between LC and 3B bag, hands high.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 30,
                    y: 32,
                },
                role: "Back up LC",
                priority: "backup",
                notes: "Sprint to back up LC.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 38,
                    y: 30,
                },
                role: "Field and throw to 3B",
                priority: "primary",
                notes: "Field cleanly, fire strike to SS cutoff toward 3B.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 50,
                    y: 26,
                },
                role: "Back up LC",
                priority: "backup",
                notes: "Back up LC.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 70,
                    y: 38,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold right field.",
            },
        ],
    },
    {
        id: "r23-single-rf-play-home",
        title: "Base Hit to RF - Play at Home on R2",
        category: "Scoring Position",
        subCategory: "Base Hit",
        tags: ["runners-2nd-3rd", "play-at-home", "RF-single", "1B-cutoff"],
        situation: {
            outs: 0,
            runners: ["2B", "3B"],
            batterHand: "L",
            hitType: "Sharp single to Right Field; R3 scores, R2 rounding 3B",
            description:
                "RF fields single and unloads home; 1B sets up cutoff to home plate, C prepares for sweep tag, P backs up home.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 74,
                    y: 38,
                },
                label: "Fielded by RF",
            },
            {
                step: 0.7,
                pos: {
                    x: 60,
                    y: 66,
                },
                label: "Cutoff to Home",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Play at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind home plate in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate and tag",
                priority: "primary",
                notes: 'Position in front of plate, direct 1B cutoff ("Cut 2!" or "Let it go!").',
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 60,
                    y: 66,
                },
                role: "Cutoff to home",
                priority: "cutoff",
                notes: "Line up between RF and home plate halfway down 1B line, hands high.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to hold batter-runner.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 44,
                    y: 50,
                },
                role: "Hold middle",
                priority: "backup",
                notes: "Shade behind 2B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 44,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 68,
                    y: 32,
                },
                role: "Back up RF",
                priority: "backup",
                notes: "Sprint to back up RF.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 38,
                },
                role: "Field and fire home",
                priority: "primary",
                notes: "Charge ball hard, deliver low, powerful one-hop throw to C through 1B cutoff.",
            },
        ],
    },
    {
        id: "bl-gb-123-dp",
        title: "Bases Loaded: 1-2-3 Double Play",
        category: "Bases Loaded",
        subCategory: "Double Play",
        tags: [
            "bases-loaded",
            "1-2-3",
            "home-to-first",
            "double-play",
            "force-play",
        ],
        situation: {
            outs: 0,
            runners: ["1B", "2B", "3B"],
            batterHand: "R",
            hitType: "Sharp ground ball comebacker directly to Pitcher",
            description:
                "Pitcher fields comebacker, delivers quick underhand toss or chest throw home to Catcher for force out; Catcher steps inside and fires to 1B for the double play.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 50,
                    y: 61,
                },
                label: "Fielded by P",
            },
            {
                step: 0.7,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Force Out at Home",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Play at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 61,
                },
                role: "Field comebacker and throw home",
                priority: "primary",
                notes: "Field cleanly, deliver firm chest-high feed directly to Catcher on home plate.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Force at home, turn throw to 1B",
                priority: "primary",
                notes: "Keep foot on home plate for force, catch feed, step inside diamond to clear runner, fire strike to 1B.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Receive relay throw at 1B",
                priority: "primary",
                notes: "Hold 1B bag, present large chest target to Catcher.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Hold 3B base.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 44,
                    y: 50,
                },
                role: "Back up middle",
                priority: "backup",
                notes: "Shade behind mound.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 40,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 60,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 50,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint behind 1B bag.",
            },
        ],
    },
    {
        id: "bl-gb-523-dp",
        title: "Bases Loaded: 5-2-3 Double Play",
        category: "Bases Loaded",
        subCategory: "Double Play",
        tags: [
            "bases-loaded",
            "5-2-3",
            "home-to-first",
            "double-play",
            "force-play",
        ],
        situation: {
            outs: 0,
            runners: ["1B", "2B", "3B"],
            batterHand: "R",
            hitType: "Sharp ground ball to 3B playing even with bag",
            description:
                "3B fields cleanly, fires home to Catcher for the force out; Catcher pivots and fires strike to 1B for the double play.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Fielded by 3B",
            },
            {
                step: 0.7,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Force Out at Home",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Play at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 62,
                },
                role: "Clear throwing lane",
                priority: "backup",
                notes: "Duck and clear 3B-to-home throwing lane.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Force at home, fire to 1B",
                priority: "primary",
                notes: "Foot on plate, catch 3B throw, clear runner lane, fire bullet to 1B.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Receive relay throw at 1B",
                priority: "primary",
                notes: "Anchor foot to 1B bag, stretch to beat batter-runner.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Field grounder and fire home",
                priority: "primary",
                notes: "Field out front, plant right foot, deliver accurate chest-high strike to Catcher.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 40,
                    y: 52,
                },
                role: "Back up 3B fielder",
                priority: "backup",
                notes: "Pinch behind 3B.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 42,
                },
                role: "Back up 3B",
                priority: "backup",
                notes: "Charge toward 3B line.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 40,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 60,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 50,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint behind 1B bag.",
            },
        ],
    },
    {
        id: "bl-gb-623-dp",
        title: "Bases Loaded: 6-2-3 Double Play",
        category: "Bases Loaded",
        subCategory: "Double Play",
        tags: [
            "bases-loaded",
            "6-2-3",
            "home-to-first",
            "double-play",
            "force-play",
        ],
        situation: {
            outs: 0,
            runners: ["1B", "2B", "3B"],
            batterHand: "R",
            hitType: "Sharp ground ball to Shortstop",
            description:
                "SS fields cleanly on the infield dirt, fires home to Catcher for force out; Catcher pivots and fires to 1B for the double play.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 43,
                    y: 51,
                },
                label: "Fielded by SS",
            },
            {
                step: 0.7,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Force Out at Home",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Play at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 46,
                    y: 62,
                },
                role: "Clear throwing lane",
                priority: "backup",
                notes: "Clear SS-to-home throwing lane.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Force at home, fire to 1B",
                priority: "primary",
                notes: "Anchor on plate, catch SS throw, step inside, fire across diamond to 1B.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Receive relay throw at 1B",
                priority: "primary",
                notes: "Anchor foot to 1B bag, stretch toward Catcher.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 43,
                    y: 51,
                },
                role: "Field grounder and fire home",
                priority: "primary",
                notes: "Field in balance, make quick crow-hop, deliver firm strike to Catcher chest.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 40,
                },
                role: "Back up SS",
                priority: "backup",
                notes: "Charge toward SS.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 60,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 50,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint behind 1B bag.",
            },
        ],
    },
    {
        id: "bl-gb-423-dp",
        title: "Bases Loaded: 4-2-3 Double Play",
        category: "Bases Loaded",
        subCategory: "Double Play",
        tags: [
            "bases-loaded",
            "4-2-3",
            "home-to-first",
            "double-play",
            "force-play",
        ],
        situation: {
            outs: 0,
            runners: ["1B", "2B", "3B"],
            batterHand: "L",
            hitType: "Sharp ground ball to 2B playing shallow",
            description:
                "2B fields cleanly, delivers accurate chest-high throw to Catcher for force at home; Catcher clears runner and throws to 1B.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 57,
                    y: 51,
                },
                label: "Fielded by 2B",
            },
            {
                step: 0.7,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Force Out at Home",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Play at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 54,
                    y: 62,
                },
                role: "Clear throwing lane",
                priority: "backup",
                notes: "Clear 2B-to-home lane.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Force at home, fire to 1B",
                priority: "primary",
                notes: "Anchor on plate, receive feed from 2B, step into infield, fire bullet to 1B.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Receive relay throw at 1B",
                priority: "primary",
                notes: "Anchor foot to bag, present target to Catcher.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 57,
                    y: 51,
                },
                role: "Field grounder and throw home",
                priority: "primary",
                notes: "Field cleanly, make quick transfer, throw chest-high strike to Catcher on plate.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 62,
                    y: 32,
                },
                role: "Back up 2B fielder",
                priority: "backup",
                notes: "Charge toward 2B.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 50,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint behind 1B bag.",
            },
        ],
    },
    {
        id: "bl-gb-323-dp",
        title: "Bases Loaded: 3-2-3 Double Play",
        category: "Bases Loaded",
        subCategory: "Double Play",
        tags: [
            "bases-loaded",
            "3-2-3",
            "home-to-first",
            "double-play",
            "force-play",
        ],
        situation: {
            outs: 0,
            runners: ["1B", "2B", "3B"],
            batterHand: "L",
            hitType: "Sharp ground ball to 1B off the bag",
            description:
                "1B fields cleanly, fires home to Catcher for force at the plate; Catcher fires back to 1B (or P covering 1B) for double play.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 68,
                    y: 54,
                },
                label: "Fielded by 1B",
            },
            {
                step: 0.7,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Force Out at Home",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 56,
                },
                label: "Play at 1B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 65,
                    y: 56,
                },
                role: "Sprint to cover 1B bag",
                priority: "primary",
                notes: "Sprint to 1B bag in case 1B cannot recover in time to receive Catcher throw.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Force at home, fire to 1B",
                priority: "primary",
                notes: "Catch feed on plate, step out to clear runner, fire strike to 1B bag.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 68,
                    y: 54,
                },
                role: "Field grounder and throw home",
                priority: "primary",
                notes: "Field ball, pivot and fire firm strike to Catcher, then hustle back to 1B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 58,
                    y: 50,
                },
                role: "Back up 1B fielder",
                priority: "backup",
                notes: "Trail behind 1B on grounder.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 62,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 76,
                    y: 48,
                },
                role: "Back up 1B bag",
                priority: "backup",
                notes: "Sprint behind 1B bag.",
            },
        ],
    },
    {
        id: "bl-single-lf-cutoff-home",
        title: "Bases Loaded: Single to LF - Play at Home",
        category: "Bases Loaded",
        subCategory: "Base Hit",
        tags: ["bases-loaded", "single", "play-at-home", "3B-cutoff"],
        situation: {
            outs: 0,
            runners: ["1B", "2B", "3B"],
            batterHand: "R",
            hitType:
                "Sharp single to Left Field; R3 scores, R2 rounding 3B hard",
            description:
                "LF fields cleanly and fires home; 3B sets up cutoff to home plate, C prepares for sweep tag, P backs up home.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 25,
                    y: 38,
                },
                label: "Fielded by LF",
            },
            {
                step: 0.7,
                pos: {
                    x: 40,
                    y: 68,
                },
                label: "Cutoff to Home",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Play at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind home plate in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate and tag",
                priority: "primary",
                notes: 'Set up in front of plate, direct 3B cutoff ("Cut 3!" or "Let it go!").',
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to hold batter-runner.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 40,
                    y: 68,
                },
                role: "Cutoff to home",
                priority: "cutoff",
                notes: "Line up between LF and home plate halfway down 3B line, hands high.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Rotate to cover 3B bag while 3B acts as cutoff.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 25,
                    y: 38,
                },
                role: "Field and fire home",
                priority: "primary",
                notes: "Charge ball hard, make clean pickup, fire one-hop strike home through 3B cutoff.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 32,
                    y: 32,
                },
                role: "Back up LF",
                priority: "backup",
                notes: "Sprint to back up LF.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 55,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 72,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold right field.",
            },
        ],
    },
    {
        id: "bl-single-lc-cutoff-home",
        title: "Bases Loaded: Single to LC - Play at Home",
        category: "Bases Loaded",
        subCategory: "Base Hit",
        tags: ["bases-loaded", "single", "play-at-home", "3B-cutoff"],
        situation: {
            outs: 0,
            runners: ["1B", "2B", "3B"],
            batterHand: "R",
            hitType:
                "Sharp line drive single into LC gap; R3 scores, R2 rounding 3B",
            description:
                "LC fields and fires home; 3B lines up cutoff to home, SS covers 3B, 2B covers 2B, C covers plate, P backs up home.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 38,
                    y: 30,
                },
                label: "Fielded by LC",
            },
            {
                step: 0.7,
                pos: {
                    x: 44,
                    y: 66,
                },
                label: "Cutoff to Home",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Play at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind home plate in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate and tag",
                priority: "primary",
                notes: "Position in front of plate, guide 3B cutoff alignment.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 44,
                    y: 66,
                },
                role: "Cutoff to home",
                priority: "cutoff",
                notes: "Line up directly between LC and home plate, hands raised high.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 30,
                    y: 32,
                },
                role: "Back up LC",
                priority: "backup",
                notes: "Sprint to back up LC.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 38,
                    y: 30,
                },
                role: "Field and throw home",
                priority: "primary",
                notes: "Field cleanly, deliver strong throw on a line through 3B cutoff to home.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 50,
                    y: 26,
                },
                role: "Back up LC",
                priority: "backup",
                notes: "Back up LC.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 70,
                    y: 38,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold right field.",
            },
        ],
    },
    {
        id: "bl-single-rc-cutoff-home",
        title: "Bases Loaded: Single to RC - Play at Home",
        category: "Bases Loaded",
        subCategory: "Base Hit",
        tags: ["bases-loaded", "single", "play-at-home", "1B-cutoff"],
        situation: {
            outs: 0,
            runners: ["1B", "2B", "3B"],
            batterHand: "L",
            hitType:
                "Solid single into RC gap; R3 scores, R2 attempts to score",
            description:
                "RC fields single, throws home; 1B cuts off throw halfway between RC and home, SS covers 3B, 2B covers 2B.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 62,
                    y: 30,
                },
                label: "Fielded by RC",
            },
            {
                step: 0.7,
                pos: {
                    x: 56,
                    y: 66,
                },
                label: "Cutoff to Home",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Play at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind home plate in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate and tag",
                priority: "primary",
                notes: "Direct 1B cutoff alignment, prepare for tag at plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 56,
                    y: 66,
                },
                role: "Cutoff to home",
                priority: "cutoff",
                notes: "Move in line between RC fielder and home plate, hands raised.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to hold batter-runner.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 42,
                    y: 50,
                },
                role: "Hold middle",
                priority: "backup",
                notes: "Shade behind 2B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 28,
                    y: 38,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 50,
                    y: 26,
                },
                role: "Back up RC",
                priority: "backup",
                notes: "Sprint to back up RC.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 62,
                    y: 30,
                },
                role: "Field and throw home",
                priority: "primary",
                notes: "Field cleanly, hit 1B cutoff chest-high or throw through to home.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 70,
                    y: 32,
                },
                role: "Back up RC",
                priority: "backup",
                notes: "Back up RC.",
            },
        ],
    },
    {
        id: "bl-single-rf-cutoff-home",
        title: "Bases Loaded: Single to RF - Play at Home",
        category: "Bases Loaded",
        subCategory: "Base Hit",
        tags: ["bases-loaded", "single", "play-at-home", "1B-cutoff"],
        situation: {
            outs: 0,
            runners: ["1B", "2B", "3B"],
            batterHand: "L",
            hitType:
                "Sharp grounder or line drive single to RF; runner challenging home",
            description:
                "RF charges and fires home; 1B sets up cutoff to home plate, 2B covers 2B bag, 3B covers 3B bag, P backs up home.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 74,
                    y: 38,
                },
                label: "Fielded by RF",
            },
            {
                step: 0.7,
                pos: {
                    x: 60,
                    y: 66,
                },
                label: "Cutoff to Home",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Play at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind home plate in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate and tag",
                priority: "primary",
                notes: 'Position in front of plate, direct 1B cutoff ("Cut 2!" or "Let it go!").',
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 60,
                    y: 66,
                },
                role: "Cutoff to home",
                priority: "cutoff",
                notes: "Line up between RF and home plate halfway down 1B line, hands high.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to hold batter-runner.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 44,
                    y: 50,
                },
                role: "Hold middle",
                priority: "backup",
                notes: "Shade behind 2B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 44,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 68,
                    y: 32,
                },
                role: "Back up RF",
                priority: "backup",
                notes: "Sprint to back up RF.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 38,
                },
                role: "Field and fire home",
                priority: "primary",
                notes: "Charge ball hard, make clean pickup, deliver strong one-hop strike home through 1B cutoff.",
            },
        ],
    },
    {
        id: "bl-fly-lf-sac-home",
        title: "Bases Loaded: Sac Fly to LF - Play at Home",
        category: "Bases Loaded",
        subCategory: "Fly Ball / Tag",
        tags: ["bases-loaded", "sac-fly", "play-at-home", "LF-fly"],
        situation: {
            outs: 0,
            runners: ["1B", "2B", "3B"],
            batterHand: "R",
            hitType: "Medium fly ball to Left Field; R3 tagging at 3B",
            description:
                "LF catches and unloads home to challenge R3; 3B sets up cutoff to home, SS covers 3B, 2B covers 2B, C covers plate.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 25,
                    y: 32,
                },
                label: "Catch in LF",
            },
            {
                step: 0.7,
                pos: {
                    x: 38,
                    y: 66,
                },
                label: "Cutoff to Home",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Play at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint deep behind home plate in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate and tag",
                priority: "primary",
                notes: "Set up in front of plate, give clear target, direct 3B cutoff.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to prevent trail runners from advancing.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 38,
                    y: 66,
                },
                role: "Cutoff to home",
                priority: "cutoff",
                notes: "Line up between LF catch and home plate, hands high.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 25,
                    y: 32,
                },
                role: "Catch and fire home",
                priority: "primary",
                notes: "Catch ball on throwing shoulder, deliver one-hop strike home through 3B cutoff.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 32,
                    y: 26,
                },
                role: "Back up LF catch",
                priority: "backup",
                notes: "Sprint to back up LF.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 55,
                    y: 28,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 72,
                    y: 38,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold right field.",
            },
        ],
    },
    {
        id: "bl-fly-cf-sac-double-tag",
        title: "Bases Loaded: Deep Fly to Center - Cutoff to Infield",
        category: "Bases Loaded",
        subCategory: "Fly Ball / Tag",
        tags: ["bases-loaded", "deep-center", "sac-fly", "trail-advancement"],
        situation: {
            outs: 0,
            runners: ["1B", "2B", "3B"],
            batterHand: "R",
            hitType: "Deep fly ball to center field; R3 scores on sac fly",
            description:
                "RC catches deep fly; R3 tags and scores easily. RC fires into SS cutoff at edge of dirt to prevent R2 and R1 from tagging and advancing.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 52,
                    y: 22,
                },
                label: "Catch in Center",
            },
            {
                step: 0.7,
                pos: {
                    x: 48,
                    y: 46,
                },
                label: "Cutoff to SS",
            },
            {
                step: 1,
                pos: {
                    x: 34,
                    y: 56,
                },
                label: "Hold at 3B Bag",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Shade behind home plate.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Receive runner crossing plate, direct SS cutoff.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 56,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to hold R1 from advancing.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "primary",
                notes: "Anchor at 3B bag to receive cutoff throw if R2 tries to advance.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 48,
                    y: 46,
                },
                role: "Cutoff from center",
                priority: "cutoff",
                notes: "Position at edge of outfield grass, catch throw from RC, immediately look R2 back to 2B.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 32,
                    y: 30,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 46,
                    y: 22,
                },
                role: "Back up RC catch",
                priority: "backup",
                notes: "Back up RC.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 52,
                    y: 22,
                },
                role: "Catch deep fly and throw to SS",
                priority: "primary",
                notes: "Catch ball, crow-hop, deliver firm strike into SS cutoff.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 68,
                    y: 26,
                },
                role: "Back up RC catch",
                priority: "backup",
                notes: "Back up RC.",
            },
        ],
    },
    {
        id: "bl-fly-rf-sac-home",
        title: "Bases Loaded: Sac Fly to RF - Play at Home",
        category: "Bases Loaded",
        subCategory: "Fly Ball / Tag",
        tags: ["bases-loaded", "sac-fly", "play-at-home", "RF-fly"],
        situation: {
            outs: 0,
            runners: ["1B", "2B", "3B"],
            batterHand: "L",
            hitType: "Medium-deep fly ball to Right Field; R3 tagging at 3B",
            description:
                "RF catches and fires home; 1B sets up cutoff to home plate, C prepares for sweep tag, P backs up home.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 75,
                    y: 32,
                },
                label: "Catch in RF",
            },
            {
                step: 0.7,
                pos: {
                    x: 60,
                    y: 66,
                },
                label: "Cutoff to Home",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Play at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint deep behind home plate in foul territory.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Cover home plate and tag",
                priority: "primary",
                notes: "Position in front of plate, guide 1B cutoff, prepare for tag on R3.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 60,
                    y: 66,
                },
                role: "Cutoff to home",
                priority: "cutoff",
                notes: "Line up between RF catch and home plate, hands high.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 50,
                    y: 48,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to hold trail runners.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 56,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag to hold R2 from tagging.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 44,
                    y: 50,
                },
                role: "Hold middle",
                priority: "backup",
                notes: "Shade behind 2B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 44,
                    y: 32,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold center field.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 68,
                    y: 28,
                },
                role: "Back up RF catch",
                priority: "backup",
                notes: "Sprint to back up RF.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 75,
                    y: 32,
                },
                role: "Catch and fire home",
                priority: "primary",
                notes: "Catch ball on throwing side, deliver low, powerful one-hop throw to C through 1B cutoff.",
            },
        ],
    },
    {
        id: "bases-empty-popup-c",
        title: "Pop-Up Behind Home Plate - Catcher Clean Catch",
        category: "Bases Empty",
        subCategory: "Infield Grounder",
        tags: ["pop-up", "catcher", "foul-territory", "bases-empty"],
        situation: {
            outs: 0,
            runners: [],
            batterHand: "R",
            hitType: "High pop-up in foul territory behind home plate",
            description:
                "Catcher tracks pop fly behind the plate, finds fence/backstop, and secures out.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Foul Tip / High Pop",
            },
            {
                step: 0.4,
                pos: {
                    x: 50,
                    y: 84,
                },
                label: "Apex of Pop-Up",
            },
            {
                step: 0.7,
                pos: {
                    x: 50,
                    y: 87,
                },
                label: "Descent",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 88,
                },
                label: "Caught by Catcher",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 74,
                },
                role: "Point to pop-up",
                priority: "backup",
                notes: "Remove mask/cap and point up to guide Catcher.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 88,
                },
                role: "Track and catch pop fly",
                priority: "primary",
                notes: "Toss mask, locate ball with back to infield, make catch.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 62,
                    y: 78,
                },
                role: "Communicate fence distance",
                priority: "backup",
                notes: "Call out room to the backstop.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 58,
                    y: 56,
                },
                role: "Hold position",
                priority: "coverage",
                notes: "Hold infield depth.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 38,
                    y: 78,
                },
                role: "Communicate fence distance",
                priority: "backup",
                notes: "Communicate room and back up catch.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 42,
                    y: 56,
                },
                role: "Hold position",
                priority: "coverage",
                notes: "Hold infield depth.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 25,
                    y: 35,
                },
                role: "Hold left field",
                priority: "backup",
                notes: "Hold position.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 30,
                },
                role: "Hold left center",
                priority: "backup",
                notes: "Hold position.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 58,
                    y: 30,
                },
                role: "Hold right center",
                priority: "backup",
                notes: "Hold position.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 75,
                    y: 35,
                },
                role: "Hold right field",
                priority: "backup",
                notes: "Hold position.",
            },
        ],
    },
    {
        id: "r1-bunt-c-throw-1b",
        title: "Bunt to Catcher - Fire to 1B for Out",
        category: "Runner on 1st",
        subCategory: "Infield Grounder",
        tags: ["bunt", "catcher", "throw-to-1b", "runner-on-1st"],
        situation: {
            outs: 0,
            runners: ["1B"],
            batterHand: "L",
            hitType: "Soft sacrifice bunt spinning out in front of home plate",
            description:
                "Catcher pounces on rolling bunt, plants right foot, and delivers strike to 1B covered by 2B.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Bunt Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 52,
                    y: 75,
                },
                label: "Fielded by C",
            },
            {
                step: 0.7,
                pos: {
                    x: 60,
                    y: 69,
                },
                label: "Throw to 1B",
            },
            {
                step: 1,
                pos: {
                    x: 68,
                    y: 64,
                },
                label: "Out at 1B",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 48,
                    y: 68,
                },
                role: "Charge and clear",
                priority: "backup",
                notes: "Charge bunt line, clear lane if C fields.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 52,
                    y: 75,
                },
                role: "Pounce on bunt and fire to 1B",
                priority: "primary",
                notes: "Field ball with both hands, set feet, throw inside baseline to 1B.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 64,
                    y: 68,
                },
                role: "Charge bunt",
                priority: "backup",
                notes: "Crash on bunt line; 2B covers bag behind.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 68,
                    y: 64,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Sprint to cover 1B bag and receive throw from C.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 32,
                    y: 64,
                },
                role: "Hold 3B bag",
                priority: "coverage",
                notes: "Hold 3B in case R1 rounds 2B aggressively.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 50,
                    y: 50,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B on the sacrifice bunt.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Back up 3B line.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 44,
                    y: 32,
                },
                role: "Shift center",
                priority: "backup",
                notes: "Back up 2B.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 62,
                    y: 35,
                },
                role: "Shift middle",
                priority: "backup",
                notes: "Shift to shallow RC.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 55,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint in down foul line to back up throw from C to 1B.",
            },
        ],
    },
    {
        id: "r2-gb-p-look-back-1b",
        title: "Comebacker to Pitcher - Look Back Runner at 2B, Out at 1B",
        category: "Scoring Position",
        subCategory: "Infield Grounder",
        tags: [
            "ground-ball",
            "pitcher",
            "look-back",
            "scoring-position",
            "runner-on-2nd",
        ],
        situation: {
            outs: 0,
            runners: ["2B"],
            batterHand: "R",
            hitType: "Hard comebacker right back up the middle to the mound",
            description:
                "Pitcher snags grounder, turns and freezes runner on 2B, then fires to 1B for the secure out.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 50,
                    y: 64,
                },
                label: "Fielded by P",
            },
            {
                step: 0.7,
                pos: {
                    x: 59,
                    y: 64,
                },
                label: "Throw to 1B",
            },
            {
                step: 1,
                pos: {
                    x: 68,
                    y: 64,
                },
                label: "Out at 1B",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 64,
                },
                role: "Field comebacker, check R2, throw 1B",
                priority: "primary",
                notes: "Snag grounder, pump-fake/freeze R2 on 2B, deliver chest-high throw to 1B.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 80,
                },
                role: "Direct play",
                priority: "coverage",
                notes: "Yell 'One! One! Check second!' to guide P.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 68,
                    y: 64,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Provide big target on 1B bag, catch throw.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 53,
                    y: 52,
                },
                role: "Hold R2 at second",
                priority: "coverage",
                notes: "Hold R2 on 2B bag.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 32,
                    y: 64,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Anchor 3B in case R2 breaks for third.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 48,
                    y: 52,
                },
                role: "Hold 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag behind R2.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Back up 3B",
                priority: "backup",
                notes: "Shift in to back up 3B.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 44,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Back up middle.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 60,
                    y: 34,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold middle right.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 54,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint in to back up throw from P to 1B.",
            },
        ],
    },
    {
        id: "r3-gb-p-freeze-3b-home",
        title: "Infield In: Comebacker to Pitcher - Play at Home",
        category: "Scoring Position",
        subCategory: "Infield Grounder",
        tags: [
            "comebacker",
            "pitcher",
            "play-at-home",
            "infield-in",
            "runner-on-3rd",
        ],
        situation: {
            outs: 1,
            runners: ["3B"],
            batterHand: "R",
            hitType:
                "Sharp bouncing grounder back to pitcher with infield playing in",
            description:
                "Pitcher gloves comebacker, immediately sets and fires home to Catcher to tag advancing R3.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 50,
                    y: 63,
                },
                label: "Fielded by P",
            },
            {
                step: 0.7,
                pos: {
                    x: 50,
                    y: 71,
                },
                label: "Throw to Home",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 79,
                },
                label: "Tag at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 63,
                },
                role: "Field and fire home",
                priority: "primary",
                notes: "Field cleanly, immediate fast throw to Catcher right on home plate.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 79,
                },
                role: "Block plate and apply tag",
                priority: "primary",
                notes: "Drop down, secure throw from P, apply tag on runner sliding home.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 66,
                    y: 65,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Remain at 1B for secondary play.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 56,
                    y: 58,
                },
                role: "Pinch infield",
                priority: "coverage",
                notes: "Playing in on the grass.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 66,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Trail R3 and cover 3B bag for rundown if runner halts.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 44,
                    y: 58,
                },
                role: "Pinch infield",
                priority: "coverage",
                notes: "Playing in on the grass.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 25,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Back up 3B line.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold middle depth.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 58,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold middle depth.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 45,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold position.",
            },
        ],
    },
    {
        id: "r3-squeeze-c-tag-home",
        title: "Safety Squeeze to Catcher - Tag Runner at Home Plate",
        category: "Scoring Position",
        subCategory: "Infield Grounder",
        tags: ["squeeze", "catcher", "play-at-home", "runner-on-3rd"],
        situation: {
            outs: 1,
            runners: ["3B"],
            batterHand: "L",
            hitType: "Soft squeeze bunt pushed right in front of home plate",
            description:
                "Catcher charges out from behind plate, barehands rolling bunt, and sweeps tag onto sliding runner.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Bunt Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 49,
                    y: 76,
                },
                label: "Barehanded by C",
            },
            {
                step: 0.7,
                pos: {
                    x: 50,
                    y: 77,
                },
                label: "Tag Move",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Tag at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 49,
                    y: 68,
                },
                role: "Charge bunt",
                priority: "backup",
                notes: "Crash down third base line, assist Catcher.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 49,
                    y: 76,
                },
                role: "Barehand bunt and tag R3",
                priority: "primary",
                notes: "Attack bunt quickly, barehand ball, spin and sweep two-handed tag on R3.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 68,
                    y: 64,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Cover 1B in case batter tries to take 2B.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 56,
                    y: 56,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 33,
                    y: 65,
                },
                role: "Charge third baseline",
                priority: "backup",
                notes: "Charge on squeeze.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 44,
                    y: 54,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Sprint to cover 3B bag behind charging 3B.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Back up 3B",
                priority: "backup",
                notes: "Back up 3B bag.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold depth.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 58,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold depth.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 45,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold depth.",
            },
        ],
    },
    {
        id: "r12-bunt-c-force-3b",
        title: "Bunt to Catcher - Quick Turn, Force Out at 3B",
        category: "Runners on 1st & 2nd",
        subCategory: "Infield Grounder",
        tags: ["bunt", "catcher", "force-at-3b", "runners-on-1st-and-2nd"],
        situation: {
            outs: 0,
            runners: ["1B", "2B"],
            batterHand: "R",
            hitType: "Bunt tapped directly out along the third baseline",
            description:
                "Catcher pounces on bunt, plants toward third, and delivers a laser to 3B for the lead force out.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Bunt Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 47,
                    y: 74,
                },
                label: "Fielded by C",
            },
            {
                step: 0.7,
                pos: {
                    x: 39,
                    y: 69,
                },
                label: "Throw to 3B",
            },
            {
                step: 1,
                pos: {
                    x: 32,
                    y: 64,
                },
                label: "Force Out at 3B",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 48,
                    y: 68,
                },
                role: "Charge and call play",
                priority: "backup",
                notes: "Yell 'Three! Three!' to Catcher.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 47,
                    y: 74,
                },
                role: "Field bunt and throw to 3B",
                priority: "primary",
                notes: "Field ball aggressively, open hips to third, fire strike to 3B bag.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 68,
                    y: 64,
                },
                role: "Hold 1B bag",
                priority: "coverage",
                notes: "Cover 1B bag.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 54,
                    y: 54,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag on force play.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 32,
                    y: 64,
                },
                role: "Anchor 3B bag for force",
                priority: "coverage",
                notes: "Hold 3B bag, give target, catch throw for force out on R2.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 42,
                    y: 54,
                },
                role: "Back up 3B bag",
                priority: "backup",
                notes: "Sprint behind 3B bag for backup.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 24,
                    y: 48,
                },
                role: "Back up 3B throw",
                priority: "backup",
                notes: "Sprint in down left foul line to back up throw from C to 3B.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold position.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 58,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold position.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 48,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold position.",
            },
        ],
    },
    {
        id: "r13-gb-1b-step-freeze-3b",
        title: "Ground Ball to 1B - Step on 1B, Freeze Runner at 3B",
        category: "First & Third",
        subCategory: "Infield Grounder",
        tags: ["ground-ball", "1B", "step-on-1b", "first-and-third"],
        situation: {
            outs: 0,
            runners: ["1B", "3B"],
            batterHand: "L",
            hitType: "Sharp grounder hit directly to first base",
            description:
                "1B fields grounder, steps on 1B bag for sure out, then spins immediately toward home to freeze R3.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 67,
                    y: 65,
                },
                label: "Fielded by 1B",
            },
            {
                step: 0.7,
                pos: {
                    x: 68,
                    y: 64,
                },
                label: "Step on 1B Bag",
            },
            {
                step: 1,
                pos: {
                    x: 66,
                    y: 65,
                },
                label: "Freeze R3 / Hold 2B",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 52,
                    y: 70,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint to back up throw to Catcher.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 79,
                },
                role: "Anchor home plate",
                priority: "coverage",
                notes: "Call out R3 position to 1B, protect home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 68,
                    y: 64,
                },
                role: "Field, step on 1B, check R3",
                priority: "primary",
                notes: "Field ball cleanly, step on 1B bag, cock arm toward 3B/home to freeze runner.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 54,
                    y: 54,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag for potential throw on trailing runner R1.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 32,
                    y: 64,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag, prepare for rundown if R3 gets hung up.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 44,
                    y: 54,
                },
                role: "Back up 2B bag",
                priority: "backup",
                notes: "Move to back up 2B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Back up 3B",
                priority: "backup",
                notes: "Back up 3B bag.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold depth.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 58,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold depth.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 52,
                },
                role: "Back up 1B line",
                priority: "backup",
                notes: "Back up 1B bag.",
            },
        ],
    },
    {
        id: "r13-gb-3b-freeze-throw-1b",
        title: "Ground Ball to 3B - Check Runner at 3B, Throw to 1B",
        category: "First & Third",
        subCategory: "Infield Grounder",
        tags: ["ground-ball", "3B", "check-runner", "first-and-third"],
        situation: {
            outs: 0,
            runners: ["1B", "3B"],
            batterHand: "R",
            hitType: "Hard grounder directly to third base",
            description:
                "3B fields ball cleanly, looks R3 back toward 3B bag, then fires across the diamond to 1B for the out.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 33,
                    y: 65,
                },
                label: "Fielded by 3B",
            },
            {
                step: 0.7,
                pos: {
                    x: 50,
                    y: 64,
                },
                label: "Throw Across Diamond",
            },
            {
                step: 1,
                pos: {
                    x: 68,
                    y: 64,
                },
                label: "Out at 1B",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 48,
                    y: 72,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind home plate in case R3 breaks late.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 79,
                },
                role: "Direct 3B and protect home",
                priority: "coverage",
                notes: "Yell 'One! One! He is holding!' and guard home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 68,
                    y: 64,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Stretch and catch throw from 3B.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 54,
                    y: 54,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Hold 2B bag.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 33,
                    y: 65,
                },
                role: "Field, freeze R3, fire to 1B",
                priority: "primary",
                notes: "Field ball cleanly, look right into R3's eyes to force runner back, then fire to 1B.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 42,
                    y: 54,
                },
                role: "Back up 3B / 2B",
                priority: "backup",
                notes: "Pinch toward 3B to support rundown if needed.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 25,
                    y: 42,
                },
                role: "Back up 3B",
                priority: "backup",
                notes: "Back up 3B bag.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold depth.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 58,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold depth.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 75,
                    y: 52,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint in to back up throw from 3B to 1B.",
            },
        ],
    },
    {
        id: "r13-bunt-c-hold-3b-throw-1b",
        title: "Bunt to Catcher - Hold Runner at 3B, Throw to 1B",
        category: "First & Third",
        subCategory: "Infield Grounder",
        tags: ["bunt", "catcher", "first-and-third", "throw-to-1b"],
        situation: {
            outs: 0,
            runners: ["1B", "3B"],
            batterHand: "R",
            hitType:
                "Soft bunt in front of home plate with runners on 1st & 3rd",
            description:
                "Catcher pounces on bunt, looks R3 back toward 3B, then fires to 1B for the secure out.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Bunt Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 51,
                    y: 75,
                },
                label: "Fielded by C",
            },
            {
                step: 0.7,
                pos: {
                    x: 60,
                    y: 69,
                },
                label: "Throw to 1B",
            },
            {
                step: 1,
                pos: {
                    x: 68,
                    y: 64,
                },
                label: "Out at 1B",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 48,
                    y: 70,
                },
                role: "Charge and back up home",
                priority: "backup",
                notes: "Charge bunt, then cover home plate if C moves far.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 51,
                    y: 75,
                },
                role: "Field, check 3B, throw to 1B",
                priority: "primary",
                notes: "Field ball, quick head-fake toward 3B to freeze R3, then fire strike to 1B.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 68,
                    y: 64,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag to receive throw from C.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 54,
                    y: 54,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B on trailing runner.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 32,
                    y: 64,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Hold 3B bag to tag R3 if runner attempts retreat.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 44,
                    y: 54,
                },
                role: "Shift toward 2B",
                priority: "backup",
                notes: "Support middle infield.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Back up 3B",
                priority: "backup",
                notes: "Back up 3B bag.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold depth.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 58,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold depth.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 52,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint in to back up throw from C to 1B.",
            },
        ],
    },
    {
        id: "bl-gb-c-force-home-1b",
        title: "Dribbler to Catcher - Step on Home Plate, Fire to 1B for Double Play",
        category: "Bases Loaded",
        subCategory: "Double Play",
        tags: [
            "double-play",
            "catcher",
            "force-at-home",
            "bases-loaded",
            "2-3-dp",
        ],
        situation: {
            outs: 0,
            runners: ["1B", "2B", "3B"],
            batterHand: "R",
            hitType: "Tapped dribbler spinning directly in front of home plate",
            description:
                "Catcher fields dribbler, steps backward on home plate for force on R3, then fires to 1B for the 2-3 double play.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 50,
                    y: 76,
                },
                label: "Fielded by C",
            },
            {
                step: 0.7,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Step on Home (Out #1)",
            },
            {
                step: 1,
                pos: {
                    x: 68,
                    y: 64,
                },
                label: "Throw to 1B (Out #2)",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 68,
                },
                role: "Charge and clear lane",
                priority: "backup",
                notes: "Charge, then clear throwing lane to 1B.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 76,
                },
                role: "Field, step on home, fire to 1B",
                priority: "primary",
                notes: "Field ball cleanly, step on home plate for force on R3, then throw strike to 1B.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 68,
                    y: 64,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Provide big target inside baseline to complete double play.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 54,
                    y: 54,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 32,
                    y: 64,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 44,
                    y: 54,
                },
                role: "Back up 2B / 3B",
                priority: "backup",
                notes: "Pinch toward middle.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold center depth.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 58,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold center depth.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 52,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint in to back up throw from C to 1B.",
            },
        ],
    },
    {
        id: "r13-single-lc-cutoff-2b",
        title: "Single to LC - Field Cleanly, Hit 2B Cutoff",
        category: "First & Third",
        subCategory: "Base Hit",
        tags: ["single", "left-center", "cutoff-to-2b", "first-and-third"],
        situation: {
            outs: 0,
            runners: ["1B", "3B"],
            batterHand: "R",
            hitType:
                "Line drive single into left-center gap (R3 scores easily)",
            description:
                "LC fields single cleanly and hits 2B cutoff (SS) to prevent trailing runner R1 from advancing to 3B.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 40,
                    y: 38,
                },
                label: "Fielded by LC",
            },
            {
                step: 0.7,
                pos: {
                    x: 46,
                    y: 48,
                },
                label: "Cutoff by SS",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 50,
                },
                label: "Hold at 2B",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 42,
                    y: 66,
                },
                role: "Back up 3B",
                priority: "backup",
                notes: "Move in line to back up 3B in case play redirects.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 79,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Cover home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 68,
                    y: 64,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag, watch batter touch 1B.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 54,
                    y: 52,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag and receive throw from SS.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 32,
                    y: 64,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag to hold R1 from taking third.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 46,
                    y: 48,
                },
                role: "Cutoff to 2B / 3B",
                priority: "cutoff",
                notes: "Line up between LC and 2B/3B, cut and fire.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 30,
                    y: 38,
                },
                role: "Back up LC",
                priority: "backup",
                notes: "Sprint across to back up LC field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 40,
                    y: 38,
                },
                role: "Field cleanly and hit cutoff",
                priority: "primary",
                notes: "Field ball on throwing side, quick accurate throw to SS.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 52,
                    y: 36,
                },
                role: "Back up LC",
                priority: "backup",
                notes: "Back up LC from right side.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold right field depth.",
            },
        ],
    },
    {
        id: "r13-single-rf-cutoff-2b",
        title: "Single to RF - Quick Field and Throw to 2B Cutoff",
        category: "First & Third",
        subCategory: "Base Hit",
        tags: ["single", "right-field", "cutoff-to-2b", "first-and-third"],
        situation: {
            outs: 0,
            runners: ["1B", "3B"],
            batterHand: "L",
            hitType: "Sharp single through the right side into right field",
            description:
                "RF fields single on a charge, throws low line drive into 2B cutoff (2B) to hold R1 at second.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 72,
                    y: 42,
                },
                label: "Fielded by RF",
            },
            {
                step: 0.7,
                pos: {
                    x: 60,
                    y: 50,
                },
                label: "Cutoff by 2B",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 50,
                },
                label: "Hold at 2B",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 48,
                    y: 66,
                },
                role: "Back up 3B",
                priority: "backup",
                notes: "Shift in position to back up 3B.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 79,
                },
                role: "Cover home plate",
                priority: "coverage",
                notes: "Hold home plate.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 68,
                    y: 64,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Ensure batter touches 1B.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 60,
                    y: 50,
                },
                role: "Cutoff to 2B",
                priority: "cutoff",
                notes: "Line up between RF and 2B bag, catch and fire into second.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 32,
                    y: 64,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Anchor 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 50,
                    y: 50,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag to receive cutoff throw.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 25,
                    y: 40,
                },
                role: "Hold position",
                priority: "backup",
                notes: "Hold left field depth.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 45,
                    y: 35,
                },
                role: "Shift middle",
                priority: "backup",
                notes: "Shift toward middle.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 65,
                    y: 38,
                },
                role: "Back up RF",
                priority: "backup",
                notes: "Sprint behind RF to back up play.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 72,
                    y: 42,
                },
                role: "Charge single and throw to 2B cutoff",
                priority: "primary",
                notes: "Charge hard, scoop cleanly, hit 2B chest-high on the cutoff.",
            },
        ],
    },
    {
        id: "r2-bunt-c-throw-1b",
        title: "Bunt to Catcher - Fire to 1B, Hold Runner at 2B",
        category: "Scoring Position",
        subCategory: "Infield Grounder",
        tags: ["bunt", "catcher", "runner-on-2nd", "scoring-position"],
        situation: {
            outs: 0,
            runners: ["2B"],
            batterHand: "R",
            hitType:
                "Soft bunt rolling out along first baseline with runner on second",
            description:
                "Catcher pounces on bunt, checks runner advancing toward third, fires to 1B for out.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Bunt Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 52,
                    y: 74,
                },
                label: "Fielded by C",
            },
            {
                step: 0.7,
                pos: {
                    x: 60,
                    y: 69,
                },
                label: "Throw to 1B",
            },
            {
                step: 1,
                pos: {
                    x: 68,
                    y: 64,
                },
                label: "Out at 1B",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 48,
                    y: 68,
                },
                role: "Charge bunt",
                priority: "backup",
                notes: "Crash on third base line.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 52,
                    y: 74,
                },
                role: "Field and throw to 1B",
                priority: "primary",
                notes: "Field ball, quick look at R2, fire inside baseline to 1B.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 68,
                    y: 64,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Receive throw from Catcher.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 54,
                    y: 54,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 32,
                    y: 64,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Anchor 3B bag to tag R2 if attempting advance.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 44,
                    y: 54,
                },
                role: "Back up 3B",
                priority: "backup",
                notes: "Back up 3B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 25,
                    y: 40,
                },
                role: "Back up 3B",
                priority: "backup",
                notes: "Back up 3B line.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Hold center",
                priority: "backup",
                notes: "Hold middle depth.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 58,
                    y: 32,
                },
                role: "Hold center",
                priority: "backup",
                notes: "Hold middle depth.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 52,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Sprint in to back up throw to 1B.",
            },
        ],
    },
    {
        id: "r3-gb-infield-in-3b-home",
        title: "Infield In: Ground Ball to 3B - Play at Home Plate",
        category: "Scoring Position",
        subCategory: "Infield Grounder",
        tags: [
            "ground-ball",
            "3B",
            "play-at-home",
            "infield-in",
            "runner-on-3rd",
        ],
        situation: {
            outs: 0,
            runners: ["3B"],
            batterHand: "R",
            hitType: "Sharp ground ball to 3B with infield playing in",
            description:
                "3B gloves grounder cleanly on grass, steps toward plate, and fires a strike to Catcher for tag.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 34,
                    y: 66,
                },
                label: "Fielded by 3B",
            },
            {
                step: 0.7,
                pos: {
                    x: 42,
                    y: 72,
                },
                label: "Throw to Home",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 79,
                },
                label: "Tag at Home",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 48,
                    y: 72,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind Catcher to back up throw.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 79,
                },
                role: "Receive throw and apply tag",
                priority: "primary",
                notes: "Block plate, secure throw from 3B, tag R3 sliding home.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 68,
                    y: 64,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Hold 1B bag for secondary out.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 56,
                    y: 56,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Hold 2B bag.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 34,
                    y: 66,
                },
                role: "Field and fire home",
                priority: "primary",
                notes: "Field ball on the infield grass, deliver low accurate throw to Catcher.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 40,
                    y: 60,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag in case R3 halts and retreats.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 25,
                    y: 42,
                },
                role: "Back up 3B",
                priority: "backup",
                notes: "Back up 3B line.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold depth.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 58,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold depth.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 48,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold depth.",
            },
        ],
    },
    {
        id: "r23-gb-1b-unassisted",
        title: "Ground Ball to 1B - Unassisted Out, Freeze Runners",
        category: "Scoring Position",
        subCategory: "Infield Grounder",
        tags: ["ground-ball", "1B", "second-and-third", "scoring-position"],
        situation: {
            outs: 0,
            runners: ["2B", "3B"],
            batterHand: "L",
            hitType: "Ground ball hit directly to first baseman",
            description:
                "1B fields grounder near foul line, steps on 1B bag, and fakes throw to freeze runners at 2B and 3B.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 67,
                    y: 65,
                },
                label: "Fielded by 1B",
            },
            {
                step: 0.7,
                pos: {
                    x: 68,
                    y: 64,
                },
                label: "Step on 1B Bag",
            },
            {
                step: 1,
                pos: {
                    x: 65,
                    y: 65,
                },
                label: "Hold Runners",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 52,
                    y: 70,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint to back up throw home.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 79,
                },
                role: "Protect home plate",
                priority: "coverage",
                notes: "Guard plate, communicate runner status.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 68,
                    y: 64,
                },
                role: "Field, step on 1B, freeze R3",
                priority: "primary",
                notes: "Field cleanly, step on bag for sure out, spin and check R3 at third.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 54,
                    y: 54,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Hold 2B bag.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 32,
                    y: 64,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 44,
                    y: 54,
                },
                role: "Back up 3B",
                priority: "backup",
                notes: "Back up 3B.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Back up 3B line",
                priority: "backup",
                notes: "Back up 3B.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold depth.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 58,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold depth.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 52,
                },
                role: "Back up 1B",
                priority: "backup",
                notes: "Back up 1B bag.",
            },
        ],
    },
    {
        id: "r23-gb-2b-throw-1b",
        title: "Infield Back: Ground Ball to 2B - Concede Run, Out at 1B",
        category: "Scoring Position",
        subCategory: "Infield Grounder",
        tags: ["ground-ball", "2B", "concede-run", "second-and-third"],
        situation: {
            outs: 0,
            runners: ["2B", "3B"],
            batterHand: "R",
            hitType:
                "Routine grounder to second baseman with infield playing back for the out",
            description:
                "2B fields grounder at depth, concedes run from third, and fires to 1B for the sure out.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 58,
                    y: 58,
                },
                label: "Fielded by 2B",
            },
            {
                step: 0.7,
                pos: {
                    x: 63,
                    y: 61,
                },
                label: "Throw to 1B",
            },
            {
                step: 1,
                pos: {
                    x: 68,
                    y: 64,
                },
                label: "Out at 1B",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 68,
                },
                role: "Back up home",
                priority: "backup",
                notes: "Back up home plate.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 79,
                },
                role: "Cover home",
                priority: "coverage",
                notes: "Receive runner at home.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 68,
                    y: 64,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Stretch and catch throw from 2B.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 58,
                    y: 58,
                },
                role: "Field and throw to 1B",
                priority: "primary",
                notes: "Field cleanly, make easy throw to 1B for the out.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 32,
                    y: 64,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B bag to hold R2 from taking third.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 46,
                    y: 54,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold position.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold position.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 58,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold position.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 50,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Back up throw to 1B.",
            },
        ],
    },
    {
        id: "r23-gb-p-freeze-home",
        title: "Comebacker to Pitcher - Look Back R3, Throw to 1B",
        category: "Scoring Position",
        subCategory: "Infield Grounder",
        tags: ["comebacker", "pitcher", "second-and-third", "scoring-position"],
        situation: {
            outs: 0,
            runners: ["2B", "3B"],
            batterHand: "R",
            hitType: "Sharp bouncing comebacker to the pitcher's mound",
            description:
                "Pitcher snares comebacker, feints toward third to lock R3 on the base, and throws to 1B for out.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 50,
                    y: 63,
                },
                label: "Fielded by P",
            },
            {
                step: 0.7,
                pos: {
                    x: 59,
                    y: 64,
                },
                label: "Throw to 1B",
            },
            {
                step: 1,
                pos: {
                    x: 68,
                    y: 64,
                },
                label: "Out at 1B",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 50,
                    y: 63,
                },
                role: "Field, freeze R3, fire to 1B",
                priority: "primary",
                notes: "Snag ball, fake toward 3B to stop R3, fire to 1B.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 79,
                },
                role: "Protect home plate",
                priority: "coverage",
                notes: "Direct pitcher and guard home.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 68,
                    y: 64,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Receive throw at 1B.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 54,
                    y: 54,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 32,
                    y: 64,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Hold 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 44,
                    y: 54,
                },
                role: "Back up 3B",
                priority: "backup",
                notes: "Back up 3B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold depth.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold depth.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 58,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold depth.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 52,
                },
                role: "Back up 1B throw",
                priority: "backup",
                notes: "Back up throw to 1B.",
            },
        ],
    },
    {
        id: "r23-squeeze-c-tag-home",
        title: "Squeeze Bunt to Catcher - Tag Runner at Home Plate",
        category: "Scoring Position",
        subCategory: "Infield Grounder",
        tags: ["squeeze", "catcher", "second-and-third", "scoring-position"],
        situation: {
            outs: 1,
            runners: ["2B", "3B"],
            batterHand: "L",
            hitType:
                "Bunt tapped in front of plate with runners on second and third",
            description:
                "Catcher charges out, scoops ball with bare hand, and applies tag on R3 sliding home.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Bunt Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 49,
                    y: 76,
                },
                label: "Fielded by C",
            },
            {
                step: 0.7,
                pos: {
                    x: 50,
                    y: 77,
                },
                label: "Tag Move",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Tag at Home Plate",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 49,
                    y: 68,
                },
                role: "Charge bunt",
                priority: "backup",
                notes: "Crash on third base line.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 49,
                    y: 76,
                },
                role: "Barehand and tag R3",
                priority: "primary",
                notes: "Attack ball, sweep tag on R3.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 68,
                    y: 64,
                },
                role: "Cover 1B bag",
                priority: "coverage",
                notes: "Cover 1B.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 54,
                    y: 54,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 33,
                    y: 65,
                },
                role: "Charge squeeze",
                priority: "backup",
                notes: "Crash on third line.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 42,
                    y: 54,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Cover 3B behind charging 3B.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Back up 3B",
                priority: "backup",
                notes: "Back up 3B.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 42,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold depth.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 58,
                    y: 32,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold depth.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 48,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold depth.",
            },
        ],
    },
    {
        id: "r23-single-rc-play-home",
        title: "Base Hit to RC - Play at Home on R2",
        category: "Scoring Position",
        subCategory: "Base Hit",
        tags: ["single", "right-center", "play-at-home", "second-and-third"],
        situation: {
            outs: 0,
            runners: ["2B", "3B"],
            batterHand: "R",
            hitType:
                "Sharp single into right-center (R3 scores easily, R2 attempts home)",
            description:
                "RC fields clean single and throws through 1B cutoff to Catcher to challenge R2 trying to score.",
        },
        ballTimeline: [
            {
                step: 0,
                pos: {
                    x: 50,
                    y: 78,
                },
                label: "Hit Contact",
            },
            {
                step: 0.4,
                pos: {
                    x: 62,
                    y: 38,
                },
                label: "Fielded by RC",
            },
            {
                step: 0.7,
                pos: {
                    x: 56,
                    y: 62,
                },
                label: "Cutoff by 1B",
            },
            {
                step: 1,
                pos: {
                    x: 50,
                    y: 79,
                },
                label: "Play at Home",
            },
        ],
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                target: {
                    x: 48,
                    y: 74,
                },
                role: "Back up home plate",
                priority: "backup",
                notes: "Sprint behind Catcher.",
            },
            {
                posId: "C",
                label: "Catcher",
                target: {
                    x: 50,
                    y: 79,
                },
                role: "Block plate and apply tag on R2",
                priority: "primary",
                notes: "Receive one-hop throw, tag R2.",
            },
            {
                posId: "1B",
                label: "First Base",
                target: {
                    x: 56,
                    y: 62,
                },
                role: "Cutoff to Home",
                priority: "cutoff",
                notes: "Line up between RC and home plate.",
            },
            {
                posId: "2B",
                label: "Second Base",
                target: {
                    x: 54,
                    y: 52,
                },
                role: "Cover 2B bag",
                priority: "coverage",
                notes: "Cover 2B.",
            },
            {
                posId: "3B",
                label: "Third Base",
                target: {
                    x: 32,
                    y: 64,
                },
                role: "Cover 3B bag",
                priority: "coverage",
                notes: "Hold 3B bag.",
            },
            {
                posId: "SS",
                label: "Shortstop",
                target: {
                    x: 46,
                    y: 50,
                },
                role: "Back up 2B",
                priority: "backup",
                notes: "Back up 2B bag.",
            },
            {
                posId: "LF",
                label: "Left Field",
                target: {
                    x: 26,
                    y: 40,
                },
                role: "Hold depth",
                priority: "backup",
                notes: "Hold left field.",
            },
            {
                posId: "LC",
                label: "Left Center",
                target: {
                    x: 46,
                    y: 36,
                },
                role: "Back up RC",
                priority: "backup",
                notes: "Sprint to back up RC.",
            },
            {
                posId: "RC",
                label: "Right Center",
                target: {
                    x: 62,
                    y: 38,
                },
                role: "Field and throw to home cutoff",
                priority: "primary",
                notes: "Charge, scoop cleanly, deliver low strike to 1B cutoff.",
            },
            {
                posId: "RF",
                label: "Right Field",
                target: {
                    x: 74,
                    y: 40,
                },
                role: "Back up RC",
                priority: "backup",
                notes: "Back up RC.",
            },
        ],
    },
];

/**
 * Retrieves a defensive play by its unique identifier.
 *
 * @param {string} id - Unique slug identifier of the play (e.g. "bases-empty-gb-ss").
 * @returns {Object|null} The matching play object, or null if not found.
 */
export function getPlayById(id) {
    if (!id || typeof id !== "string") return null;
    return DEFENSIVE_PLAYS.find((play) => play.id === id) || null;
}

/**
 * Filters and retrieves all defensive plays belonging to a specified category.
 *
 * @param {string} category - Category name (e.g. "Bases Empty", "Runner on 1st", "Scoring Position").
 * @returns {Array<Object>} Array of matching defensive play objects.
 */
export function getPlaysByCategory(category) {
    if (!category || typeof category !== "string") return [];
    return DEFENSIVE_PLAYS.filter((play) => play.category === category);
}

/**
 * Returns aggregate metrics and category/sub-category breakdowns for all defensive plays.
 *
 * @returns {{
 *   total: number,
 *   byCategory: Record<string, number>,
 *   bySubCategory: Record<string, number>
 * }} Playbook statistics object.
 */
export function getPlayStats() {
    const total = DEFENSIVE_PLAYS.length;
    const byCategory = {};
    const bySubCategory = {};

    for (const play of DEFENSIVE_PLAYS) {
        byCategory[play.category] = (byCategory[play.category] || 0) + 1;
        bySubCategory[play.subCategory] =
            (bySubCategory[play.subCategory] || 0) + 1;
    }

    return {
        total,
        byCategory,
        bySubCategory,
    };
}
