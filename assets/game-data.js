/* =========================================================================
   THE CONFEDERATION PROBLEM  —  Shared Game Data
   Classic script (no modules) so it also works from a local file:// copy.
   Everything hangs off window.AOC.
   ========================================================================= */
(function () {
  "use strict";

  /* ----------------------------------------------------------------------
     TAGS
     Every resolution is tagged. Every bot state has an opinion about every
     tag. A bot's vote is the dot product of the two. This keeps bot behavior
     predictable enough that students can learn to negotiate with them.
     ---------------------------------------------------------------------- */
  var TAGS = [
    "taxation",         // does this take money out of state pockets?
    "national_power",   // does this make Congress stronger?
    "state_sovereignty",// does this protect a state's right to decide for itself?
    "trade_regulation", // does this touch who controls trade?
    "military",         // does this pay for soldiers or defense?
    "debt_honor",       // does this pay what we already promised?
    "north_economy",    // helps northern shipping/manufacturing
    "south_economy",    // helps southern farming/plantations
    "small_state",      // helps states with little land or few people
    "west_expansion"    // touches western land claims
  ];

  /* ----------------------------------------------------------------------
     THE THIRTEEN STATES
     share      = percent of a land-value requisition (Resolution 1)
     popShare   = percent of a population requisition (Resolution 4)
     treasury   = starting money
     motto      = the one line shown on the projector so students can read
                  a bot's personality before they negotiate with it
     ---------------------------------------------------------------------- */
  var STATES = [
    {
      name: "Virginia", abbr: "VA", region: "South", size: "Large",
      share: 16, popShare: 19, treasury: 400000,
      motto: "The biggest state. Owns huge western land claims and does not want to give them up.",
      background: "You are the largest and richest state. Your land claims stretch west past the Ohio River. Because you are big, every tax based on land or people costs you the most. Other states are jealous of your power and suspicious of your western claims.",
      objective: "Protect your western land. Look like a leader, but do not let the small states drain your treasury.",
      factions: [
        { name: "Tidewater Planters", wants: "Keep taxes low. We already carry the heaviest load." },
        { name: "Western Settlers", wants: "Defend the frontier and keep the Mississippi River open." }
      ],
      bot: {
        weights: { taxation: -4, national_power: 2, state_sovereignty: 5, trade_regulation: 1, military: 3, debt_honor: 5, north_economy: 0, south_economy: 6, small_state: -3, west_expansion: 8 },
        stubbornness: 0.7, absenceChance: 0.02, prideInNation: 0.55
      }
    },
    {
      name: "Massachusetts", abbr: "MA", region: "North", size: "Large",
      share: 13, popShare: 12, treasury: 325000,
      motto: "Shipping and trade. Already taxing its own farmers hard to pay off war debt.",
      background: "Your merchants and ships are the heart of your economy. You borrowed heavily during the war, and you are taxing your own farmers hard to pay it back. Those farmers are angry, and some of them are veterans who still have not been paid.",
      objective: "Protect trade and shipping. Keep your farmers from exploding.",
      factions: [
        { name: "Boston Merchants", wants: "Free trade between states and a country that pays its debts." },
        { name: "Western Farmers", wants: "Stop taxing us. We are losing our farms to the courts." }
      ],
      bot: {
        weights: { taxation: -2, national_power: 3, state_sovereignty: 2, trade_regulation: 6, military: 4, debt_honor: 7, north_economy: 7, south_economy: -1, small_state: -1, west_expansion: 0 },
        stubbornness: 0.5, absenceChance: 0.03, prideInNation: 0.7
      }
    },
    {
      name: "Pennsylvania", abbr: "PA", region: "Middle", size: "Large",
      share: 12, popShare: 11, treasury: 300000,
      motto: "Philadelphia is the nation's biggest city. Wants a country that actually works.",
      background: "Philadelphia is the largest city in the country and the home of Congress. Your merchants, farmers, and ironworkers all depend on trade moving smoothly. You are one of the few states that usually pays what Congress asks.",
      objective: "Keep the country together and keep trade flowing through your city.",
      factions: [
        { name: "Philadelphia Merchants", wants: "A stable country with good credit and open roads." },
        { name: "Frontier Farmers", wants: "Protection from raids and lower taxes." }
      ],
      bot: {
        weights: { taxation: -2, national_power: 5, state_sovereignty: 1, trade_regulation: 6, military: 3, debt_honor: 6, north_economy: 6, south_economy: 1, small_state: 0, west_expansion: 2 },
        stubbornness: 0.4, absenceChance: 0.03, prideInNation: 0.8
      }
    },
    {
      name: "New York", abbr: "NY", region: "Middle", size: "Large",
      share: 9, popShare: 8, treasury: 225000,
      motto: "Controls the best port in America and taxes everything that passes through it.",
      background: "You control the finest harbor on the continent. Almost everything shipped to New Jersey and Connecticut passes through your port, and you tax all of it. That tax money pays your bills. If Congress ever got the power to tax imports, you would lose your best source of income.",
      objective: "Protect your port income. Never let Congress take over trade taxes.",
      factions: [
        { name: "Port Officials", wants: "Keep our tariffs. They pay for our whole government." },
        { name: "Hudson Valley Landowners", wants: "Stay out of other people's wars and debts." }
      ],
      bot: {
        weights: { taxation: -5, national_power: -3, state_sovereignty: 7, trade_regulation: -8, military: 1, debt_honor: 4, north_economy: 5, south_economy: 0, small_state: -4, west_expansion: 1 },
        stubbornness: 0.85, absenceChance: 0.02, prideInNation: 0.35,
        redLines: ["import_tax"]
      }
    },
    {
      name: "Maryland", abbr: "MD", region: "Middle", size: "Medium",
      share: 8, popShare: 8, treasury: 200000,
      motto: "Has no western land. Furious that Virginia claims an empire out west.",
      background: "Your borders are fixed. You cannot grow west, but Virginia claims land all the way to the Mississippi. You refused to sign the Articles of Confederation for years over exactly this. You believe western land was won by everyone's soldiers and should belong to everyone.",
      objective: "Stop the big states from building western empires.",
      factions: [
        { name: "Chesapeake Traders", wants: "Fair trade rules and a working country." },
        { name: "Land Company Investors", wants: "Force Virginia to give up the west." }
      ],
      bot: {
        weights: { taxation: -3, national_power: 4, state_sovereignty: 2, trade_regulation: 4, military: 2, debt_honor: 4, north_economy: 2, south_economy: 3, small_state: 6, west_expansion: -9 },
        stubbornness: 0.6, absenceChance: 0.05, prideInNation: 0.6
      }
    },
    {
      name: "Connecticut", abbr: "CT", region: "North", size: "Medium",
      share: 8, popShare: 7, treasury: 200000,
      motto: "Getting squeezed by New York's port taxes and tired of it.",
      background: "Your farmers and traders have to send goods through New York, and New York taxes them every time. You are losing money to a neighbor. You also have a violent land dispute with Pennsylvania in the Wyoming Valley.",
      objective: "Break New York's grip on trade without handing your power to Congress.",
      factions: [
        { name: "River Merchants", wants: "End New York's tariffs. They are robbing us." },
        { name: "Town Meetings", wants: "No new taxes from anybody, including Congress." }
      ],
      bot: {
        weights: { taxation: -4, national_power: 1, state_sovereignty: 5, trade_regulation: 7, military: 2, debt_honor: 4, north_economy: 5, south_economy: 0, small_state: 4, west_expansion: 2 },
        stubbornness: 0.6, absenceChance: 0.05, prideInNation: 0.5
      }
    },
    {
      name: "North Carolina", abbr: "NC", region: "South", size: "Medium",
      share: 8, popShare: 10, treasury: 200000,
      motto: "Rural, spread out, and deeply suspicious of any government far away.",
      background: "Your state is mostly small farms spread over a long distance. You have very little cash money. Settlers in your western territory have already tried to break away and form their own state. You do not trust distant governments, and Congress feels very distant.",
      objective: "Pay as little as possible. Keep control of your own territory.",
      factions: [
        { name: "Backcountry Farmers", wants: "No taxes. We barely have coins to begin with." },
        { name: "Coastal Planters", wants: "Protect our exports and our land claims." }
      ],
      bot: {
        weights: { taxation: -6, national_power: -3, state_sovereignty: 7, trade_regulation: 1, military: 2, debt_honor: 2, north_economy: -2, south_economy: 6, small_state: 1, west_expansion: 4 },
        stubbornness: 0.75, absenceChance: 0.10, prideInNation: 0.3
      }
    },
    {
      name: "South Carolina", abbr: "SC", region: "South", size: "Medium",
      share: 7, popShare: 6, treasury: 175000,
      motto: "Rice and indigo exports. Sees every northern plan as a trick to take southern money.",
      background: "Your wealth comes from rice and indigo grown on plantations and shipped overseas. Anything that raises the cost of shipping or of imported goods hurts you directly. You are convinced the northern states use Congress to move southern money north.",
      objective: "Block northern economic schemes. Protect your export trade.",
      factions: [
        { name: "Lowcountry Planters", wants: "Free export trade and no interference." },
        { name: "Charleston Merchants", wants: "Cheap imported goods and open ports." }
      ],
      bot: {
        weights: { taxation: -7, national_power: -4, state_sovereignty: 8, trade_regulation: -2, military: 3, debt_honor: 2, north_economy: -4, south_economy: 8, small_state: 0, west_expansion: 2 },
        stubbornness: 0.8, absenceChance: 0.06, prideInNation: 0.3
      }
    },
    {
      name: "New Jersey", abbr: "NJ", region: "Middle", size: "Small",
      share: 6, popShare: 6, treasury: 150000,
      motto: "Trapped between two port cities that both tax it. Calls itself a barrel tapped at both ends.",
      background: "You have no major port of your own. Goods coming to you pass through New York or Philadelphia, and both of them tax you on the way. People call your state a barrel tapped at both ends. You are desperate for national trade rules because you cannot win this fight alone.",
      objective: "Get national trade rules. You are being strangled by your neighbors.",
      factions: [
        { name: "Farmers", wants: "Stop the tariffs that eat our profits." },
        { name: "Assembly Leaders", wants: "Any national rule that stops New York." }
      ],
      bot: {
        weights: { taxation: -3, national_power: 5, state_sovereignty: 0, trade_regulation: 9, military: 1, debt_honor: 3, north_economy: 3, south_economy: 0, small_state: 7, west_expansion: 0 },
        stubbornness: 0.35, absenceChance: 0.05, prideInNation: 0.65
      }
    },
    {
      name: "New Hampshire", abbr: "NH", region: "North", size: "Small",
      share: 4, popShare: 4, treasury: 100000,
      motto: "Small, poor, and far from Philadelphia. Its delegates often just do not show up.",
      background: "You are a small northern state with timber, fishing, and not much cash. Philadelphia is a long, expensive trip. Your state legislature does not always bother to send delegates, and sometimes cannot afford to pay them.",
      objective: "Survive. Do not spend money you do not have.",
      factions: [
        { name: "Timber and Fishing Interests", wants: "Protect our coast and our trade." },
        { name: "Town Farmers", wants: "Keep our money at home." }
      ],
      bot: {
        weights: { taxation: -5, national_power: 0, state_sovereignty: 4, trade_regulation: 3, military: 1, debt_honor: 3, north_economy: 4, south_economy: 0, small_state: 5, west_expansion: 0 },
        stubbornness: 0.5, absenceChance: 0.28, prideInNation: 0.45
      }
    },
    {
      name: "Georgia", abbr: "GA", region: "South", size: "Small",
      share: 3, popShare: 3, treasury: 75000,
      motto: "The frontier state. Wants soldiers, not roads, and will trade its vote for defense.",
      background: "You are the newest, smallest, and most exposed state. Spain holds Florida on your southern border and disputes your western boundary. You face constant conflict on your frontier. You need soldiers far more than you need anything else Congress talks about.",
      objective: "Get military help for your frontier. Vote for anyone who protects you.",
      factions: [
        { name: "Frontier Militia", wants: "Soldiers and forts, right now." },
        { name: "Savannah Planters", wants: "Low taxes and open export trade." }
      ],
      bot: {
        weights: { taxation: -5, national_power: -1, state_sovereignty: 5, trade_regulation: 0, military: 10, debt_honor: 1, north_economy: -2, south_economy: 5, small_state: 4, west_expansion: 3 },
        stubbornness: 0.45, absenceChance: 0.12, prideInNation: 0.35
      }
    },
    {
      name: "Rhode Island", abbr: "RI", region: "North", size: "Small",
      share: 3, popShare: 3, treasury: 75000,
      motto: "Will not give up the power to tax. Killed the national import tax in real life in 1782.",
      background: "You are the smallest state, and you guard your independence fiercely. You make real money from your own port taxes. In 1782 your state, alone, blocked a national import tax that all twelve other states had approved. You did not blink then and you will not blink now.",
      objective: "Never let Congress get the power to tax. You are the last line of defense.",
      factions: [
        { name: "Newport Merchants", wants: "Keep our own port taxes. They fund everything." },
        { name: "Country Party", wants: "No outside government touches our money. Ever." }
      ],
      bot: {
        weights: { taxation: -10, national_power: -10, state_sovereignty: 10, trade_regulation: -6, military: -1, debt_honor: 0, north_economy: 3, south_economy: 0, small_state: 6, west_expansion: 0 },
        stubbornness: 0.97, absenceChance: 0.04, prideInNation: 0.15,
        redLines: ["import_tax", "amendment"]
      }
    },
    {
      name: "Delaware", abbr: "DE", region: "Middle", size: "Small",
      share: 3, popShare: 3, treasury: 75000,
      motto: "Tiny, with one equal vote. Knows its vote is worth more than its size and will sell it.",
      background: "You are one of the smallest states in the country, but under the Articles you get exactly one vote, the same as Virginia. That vote is the most valuable thing you own. You have learned to trade it for whatever your state needs.",
      objective: "Use your one vote to get the best deal you can. Equal voting is everything.",
      factions: [
        { name: "Wilmington Traders", wants: "Whatever keeps goods cheap and moving." },
        { name: "Assembly", wants: "Protect equal voting for small states, at all costs." }
      ],
      bot: {
        weights: { taxation: -3, national_power: 1, state_sovereignty: 3, trade_regulation: 4, military: 1, debt_honor: 3, north_economy: 2, south_economy: 1, small_state: 9, west_expansion: -4 },
        stubbornness: 0.18, absenceChance: 0.06, prideInNation: 0.5
      }
    }
  ];

  /* ----------------------------------------------------------------------
     THE FOUR RESOLUTIONS
     Each one isolates a different structural weakness, and they build on
     each other. Round 4's crisis is paid for out of the treasury that
     Round 1's broken promises drained.
     ---------------------------------------------------------------------- */
  var RESOLUTIONS = [
    {
      id: "debt",
      ifPasses: "Congress sends the request out to all thirteen states. Then every state decides on its own whether to actually send the money. No court can make them and no president can collect it.",
      ifFails: "Congress does not even ask. France is told that no payment is coming. American credit in Europe collapses, and every merchant here who borrows from abroad pays for it.",
      narration: {
        dateline: "Philadelphia \u00b7 January 1786",
        lines: [
          "The letter from Paris came this morning. It is extremely polite, and it is a threat.",
          "France lent us millions to win our war. French ships sealed the bay at Yorktown. French soldiers died in our fields. The loan came due two years ago, and we have not sent them one dollar.",
          "You are the Congress of the United States. Look around the room. There is no president in it. There is no court. There is no treasury with money in it. There are thirteen delegations and a bill nobody here can pay.",
          "Congress may ask the states for money. Congress may not make them send it.",
          "The floor is open."
        ]
      },
      number: 1,
      title: "Paying the War Debt",
      subtitle: "A requisition of $1,000,000",
      voteRule: "nine",         // 9 of 13 needed
      compliance: true,          // states privately decide whether to actually pay
      complianceBasis: "share",  // apportioned by land value
      complianceTotal: 1000000,
      civicBias: 4.4,
      teaches: "Congress had no power to tax.",
      // Plain-language framing for students
      brief: "The war is over, but the bills are not paid. We borrowed millions from France and Spain to win our independence. Now they want their money back, and Congress does not have it.",
      detail: "Congress cannot tax anybody. The only thing it can do is ask the states for money. That request is called a requisition. Each state's share is based on the value of its land. Congress is asking for $1,000,000 total.\n\nHere is the important part: a requisition is a request, not a bill. There is no national court to sue you and no president to send anyone after you. If your state votes yes and then does not pay, nothing happens to you.",
      question: "Should Congress send this requisition to the states?",
      yesCase: "If we do not pay, no country in the world will ever lend to us again. Our word is worthless. Our merchants lose credit everywhere.",
      noCase: "This share is unfair to my state. Let the states that borrowed the most pay the most. My people have already given enough.",
      glossary: ["requisition", "credit"],
      tags: { taxation: 4, national_power: 3, debt_honor: 9, state_sovereignty: -2, north_economy: 2, south_economy: 0, small_state: 0, military: 0, trade_regulation: 0, west_expansion: 0 },
      failText: "Congress does not even send the request. France is told there will be no payment at all this year.",
      passText: "The requisition is approved. Now each state decides, on its own, whether to actually send the money."
    },
    {
      id: "trade",
      ifPasses: "Congress sends every state a polite request to drop its tariffs on other states. New York does not have to listen, and Congress has no way to make it. The trade war does not actually stop.",
      ifFails: "The trade war spreads. More states start taxing their neighbors' goods to get even, prices rise everywhere, and states begin treating each other like foreign countries.",
      narration: {
        dateline: "New York Harbor \u00b7 March 1786",
        lines: [
          "A farmer in New Jersey loaded a wagon with grain and drove it to the docks. New York taxed him for crossing. He paid, sold his grain for less than it cost him to grow, and went home angry.",
          "New Jersey struck back last week. There is a lighthouse out on Sandy Hook that New York built and New York owns, and it stands on Jersey sand. New Jersey has started taxing it.",
          "Understand what you are looking at. This is not two countries fighting. These are two American states, and they are doing this to each other on purpose, and the men who did it were cheered at home.",
          "Congress may ask them to stop. Asking is the entire power Congress has here.",
          "The floor is open."
        ]
      },
      number: 2,
      title: "The Trade War",
      subtitle: "A resolution asking states to stop taxing each other",
      voteRule: "nine",
      compliance: false,
      teaches: "Congress had no power to regulate trade between states.",
      brief: "The states are treating each other like foreign countries. New York taxes every shipment that passes through its port on the way to New Jersey and Connecticut. New Jersey struck back by taxing a lighthouse New York owns on the Jersey shore.",
      detail: "Trade between states is breaking down. States are putting taxes, called tariffs, on each other's goods. Prices are rising and merchants are furious.\n\nCongress has no power over trade at all. It cannot order New York to stop. The most it can do is pass a resolution politely asking every state to drop its tariffs on other states.\n\nEven if this passes with all thirteen votes, it is still only a request.",
      question: "Should Congress ask the states to stop taxing each other's goods?",
      yesCase: "We are supposed to be one country. If we keep taxing each other, we will all be poor together.",
      noCase: "Our port is our property. The taxes we collect there pay for our government. No outside body tells us what to do with our own harbor.",
      glossary: ["tariff", "resolution"],
      tags: { taxation: -1, national_power: 4, trade_regulation: 9, state_sovereignty: -4, north_economy: 3, south_economy: 1, small_state: 5, debt_honor: 0, military: 0, west_expansion: 0 },
      failText: "The trade war continues and gets worse. More states begin taxing their neighbors.",
      passText: "The resolution passes. It is a polite request, and Congress cannot enforce it."
    },
    {
      id: "impost",
      ifPasses: "The Articles are amended. Congress collects its own money for the first time and stops depending on the states. In real life this never happened.",
      ifFails: "Nothing changes. Congress stays broke and goes on begging. Any single state that wants to block a fix can keep blocking it forever.",
      narration: {
        dateline: "Philadelphia \u00b7 July 1786",
        lines: [
          "Five years of asking. Five years of writing to the states for money and watching most of it never arrive.",
          "There is one way out and every delegate in this room already knows it. Give Congress a tax of its own. Five dollars on every hundred dollars of foreign goods that crosses a dock. Small, steady, and ours \u2014 so that we never have to beg again.",
          "But this changes the Articles themselves, and Article Thirteen is not vague about what that costs.",
          "Not nine states. Not twelve.",
          "All thirteen. Every delegation in this room. Any one of you can end this by folding your arms and saying nothing.",
          "Look around and decide who that is going to be."
        ]
      },
      number: 3,
      title: "The Import Tax Amendment",
      subtitle: "A 5% tax on imported goods — requires all 13 states",
      voteRule: "unanimous",     // 13 of 13
      compliance: false,
      teaches: "Changing the Articles required all thirteen states to agree.",
      brief: "Begging the states for money has failed. There is one real fix: give Congress its own source of income. The proposal is a 5% tax on goods imported from other countries, collected by Congress.",
      detail: "This would finally give Congress money of its own. It would not have to ask anymore. Debts could be paid, soldiers could be supplied, and the country would have real credit.\n\nBut this changes the Articles of Confederation themselves. Under Article XIII, an amendment requires the agreement of every single state. Not nine. All thirteen.\n\nOne state voting no kills it. That is not a rule of this game. That is how it actually worked.",
      question: "Should the Articles be amended to give Congress a 5% import tax?",
      yesCase: "Asking has failed for six straight years. This is the only plan that has ever been proposed that would actually work.",
      noCase: "We just fought a war against a government that taxed us from far away. Give Congress the power to tax and we will have traded one master for another.",
      glossary: ["amendment", "impost", "credit"],
      special: "import_tax",     // triggers red lines on NY and RI
      isAmendment: true,
      tags: { taxation: 8, national_power: 9, trade_regulation: 6, state_sovereignty: -9, debt_honor: 6, north_economy: 2, south_economy: -1, small_state: 2, military: 2, west_expansion: 0 },
      failText: "The amendment fails. Congress will remain without money of its own.",
      passText: "Against every expectation, all thirteen states agreed. This did not happen in real life."
    },
    {
      id: "shays",
      ifPasses: "Congress asks the states for money and volunteers. Then each state decides whether to actually send them. The rebels are not waiting for anyone to make up their mind.",
      ifFails: "Congress does nothing at all. The rebels reach the arsenal at Springfield, and every state government in the country watches to see whether armed men can simply walk in and take one.",
      narration: {
        dateline: "Springfield, Massachusetts \u00b7 January 1787",
        lines: [
          "Daniel Shays fought at Bunker Hill. He fought at Saratoga. He was wounded, he was decorated, and he was never paid.",
          "He came home to a farm and a stack of debts. When the courts started taking farms from men like him, he stopped asking politely. Tonight he is marching on Springfield with more than a thousand armed men, and they are going for the guns inside the federal arsenal.",
          "Massachusetts cannot stop him. Massachusetts has no money left.",
          "Congress has no army. Congress cannot draft a single soldier. All Congress can do is ask you, again, for money and men.",
          "Before you answer, look at what is actually in the national treasury tonight: {treasury}.",
          "The floor is open."
        ]
      },
      number: 4,
      title: "Shays' Rebellion",
      subtitle: "An emergency: $500,000 and troops",
      voteRule: "nine",
      compliance: true,
      complianceBasis: "popShare",
      complianceTotal: 500000,
      civicBias: 4.0,
      teaches: "Congress had no army and no president to act in an emergency.",
      brief: "Armed farmers in western Massachusetts have shut down the courts. They are led by Daniel Shays, a captain who fought at Bunker Hill and was never paid. Thousands of them are now marching on the federal arsenal at Springfield to seize its weapons.",
      detail: "Massachusetts cannot stop them. The state has no money left. Congress has no standing army and no power to draft one. There is no president to give an order.\n\nAll Congress can do is ask the states for $500,000 and volunteer soldiers, split up by population. And then ask again that they actually send it.\n\nCheck the national treasury before you vote. Whatever the states did not pay in Resolution 1 is not there now.",
      question: "Should Congress request emergency money and troops?",
      yesCase: "If armed men can shut down a state government and nobody stops them, then no government here is safe. Yours is next.",
      noCase: "This is Massachusetts's problem. Those farmers were pushed into it by their own state's taxes. Why should our people bleed and pay for it?",
      glossary: ["arsenal", "standing army"],
      tags: { taxation: 5, national_power: 6, military: 9, state_sovereignty: -3, debt_honor: 3, north_economy: 3, south_economy: -1, small_state: 0, trade_regulation: 0, west_expansion: 0 },
      failText: "Congress does nothing. The rebellion is put down only because private Boston merchants pay for an army out of their own pockets.",
      passText: "The request is approved. Now the states decide whether to actually send money and men."
    }
  ];

  /* ----------------------------------------------------------------------
     GLOSSARY — plain definitions, shown on tap
     ---------------------------------------------------------------------- */
  var GLOSSARY = {
    requisition: "A formal request for money from Congress to the states. Not a tax. States could ignore it, and usually did.",
    credit: "Your reputation for paying back what you borrow. Bad credit means nobody will lend to you again.",
    tariff: "A tax on goods coming in from somewhere else. Under the Articles, states put tariffs on each other.",
    resolution: "A formal decision by Congress. Under the Articles, most resolutions were requests, because Congress had no way to enforce them.",
    amendment: "A change to the Articles of Confederation. Article XIII required all thirteen states to approve one.",
    impost: "An old word for a tax on imported goods. The failed import tax plans of 1781 and 1783 were both called the impost.",
    arsenal: "A storehouse of guns and gunpowder.",
    "standing army": "A permanent army kept ready in peacetime. Congress was not allowed to have one.",
    quorum: "The minimum number of states that must be present for Congress to do business. Under the Articles, nine states had to be present to decide anything important.",
    sovereignty: "The right to rule yourself without anyone above you. Article II said each state kept its sovereignty."
  };

  /* ----------------------------------------------------------------------
     THE SIX WEAKNESSES — used in the debrief
     ---------------------------------------------------------------------- */
  var WEAKNESSES = [
    { key: "tax",       title: "Congress could not tax",            text: "Congress could only ask states for money. States paid about one-sixth of what was asked between 1781 and 1786." },
    { key: "trade",     title: "Congress could not control trade",  text: "States taxed each other's goods like foreign countries. Congress could not stop them." },
    { key: "executive", title: "There was no president",            text: "Nobody had the job of carrying out the laws Congress passed. A vote was the end of the process, not the beginning." },
    { key: "courts",    title: "There were no national courts",     text: "When two states fought, there was no judge who could settle it. Pennsylvania and Connecticut shot at each other over the Wyoming Valley." },
    { key: "amend",     title: "Amendments needed all 13 states",   text: "Any single state could block any fix. Rhode Island alone killed the import tax in 1782. New York alone killed it again in 1786." },
    { key: "army",      title: "Congress had no army",              text: "Congress could not draft soldiers. During Shays' Rebellion it authorized troops and then could not pay for a single one." }
  ];

  /* ----------------------------------------------------------------------
     REAL-HISTORY FOOTNOTES — shown after each round, so students learn
     that the outcome they just produced is the outcome that happened.
     ---------------------------------------------------------------------- */
  var HISTORY_NOTES = {
    debt: "In real life, Congress asked the states for about $15 million between 1781 and 1786. It received about $2.5 million. That is roughly one dollar for every six requested. The United States defaulted on its loans from France.",
    trade: "In real life, New York really did tax goods bound for New Jersey and Connecticut, and New Jersey really did tax the New York lighthouse at Sandy Hook. Congress asked states to stop. They did not stop. This trade chaos is a direct reason the Constitutional Convention was called.",
    impost: "In real life this was tried twice. In 1782, twelve states approved the import tax and Rhode Island alone rejected it. In 1786, the plan was tried again and New York alone rejected it. Both times, one state out of thirteen was enough.",
    shays: "In real life, Congress authorized 1,340 troops in October 1786 and asked the states to pay for them. The states sent almost nothing. The rebellion was finally stopped in February 1787 by a private army paid for by Boston merchants. Three months later, the Constitutional Convention opened in Philadelphia."
  };

  window.AOC = {
    TAGS: TAGS,
    STATES: STATES,
    RESOLUTIONS: RESOLUTIONS,
    GLOSSARY: GLOSSARY,
    WEAKNESSES: WEAKNESSES,
    HISTORY_NOTES: HISTORY_NOTES,
    byName: function (n) { for (var i = 0; i < STATES.length; i++) if (STATES[i].name === n) return STATES[i]; return null; },
    resolutionById: function (id) { for (var i = 0; i < RESOLUTIONS.length; i++) if (RESOLUTIONS[i].id === id) return RESOLUTIONS[i]; return null; }
  };
})();
