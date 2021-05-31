enum Color {
  BLUE = "blue",
  RED = "red",
  YELLOW = "yellow",
  GREEN = "green",
  BLACK = "black",
  PURPLE = "purple",
  ORANGE = "orange",
  PINK = "pink",
  NEUTRAL = "neutral",
  BRONZE = "bronze",
}

export enum Phase {
  ACTION = "action",
  END = "end", // specifically, *game* end.
  PRODUCTION = "production",
  RESEARCH = "research",
  INITIALDRAFTING = "initial_drafting",
  DRAFTING = "drafting",
  PRELUDES = "preludes",
  SOLAR = "solar",
  INTERGENERATION = "intergeneration",
}

interface IAward {
  player_name?: string;
  scores?: Array<{ playerColor?: string; playerScore?: number }>;
  award?: {
    name?: string;
    description?: string;
  };
}

interface SerializedClaimedMilestone {
  name?: string;
  playerId?: PlayerId;
}

enum ResourceType {
  ANIMAL = "Animal",
  MICROBE = "Microbe",
  FIGHTER = "Fighter",
  SCIENCE = "Science",
  FLOATER = "Floater",
  ASTEROID = "Asteroid",
  PRESERVATION = "Preservation",
  CAMP = "Camp",
  DISEASE = "Disease",
  RESOURCE_CUBE = "Resource cube",
  DATA = "Data",
  SYNDICATE_FLEET = "Syndicate Fleet",
}

interface SerializedColony {
  colonies?: Array<PlayerId>;
  description?: string;
  name?: ColonyName;
  isActive?: boolean;
  resourceType?: ResourceType;
  trackPosition?: number;
  visitor?: undefined | PlayerId;
}

enum ColonyName {
  CALLISTO = "Callisto",
  CERES = "Ceres",
  ENCELADUS = "Enceladus",
  EUROPA = "Europa",
  GANYMEDE = "Ganymede",
  IO = "Io",
  LUNA = "Luna",
  MIRANDA = "Miranda",
  PLUTO = "Pluto",
  TITAN = "Titan",
  TRITON = "Triton",

  // Community
  // If you add a community colony, also update GameSetup.includesCommunityColonies
  IAPETUS = "Iapetus",
  MERCURY = "Mercury",
  HYGIEA = "Hygiea",
  TITANIA = "Titania",
  VENUS = "Venus",
  LEAVITT = "Leavitt",
  PALLAS = "Pallas",
}

type CardName = string;

type Tags = string;

type Resources = string;

interface SerializedCard {
  allTags?: Array<Tags>;
  bonusResource?: Resources;
  isDisabled?: boolean;
  name?: CardName;
  resourceCount?: number;
  targetCards?: Array<SerializedRobotCard>;
}

interface SerializedRobotCard {
  card?: SerializedCard;
  resourceCount?: number;
}

interface SerializedTimer {
  sumElapsed?: number;
  startedAt?: number;
  running?: boolean;
  afterFirstAction?: boolean;
  lastStoppedAt?: number;
}

interface SerializedPlayer {
  actionsTakenThisRound?: number;
  beginner?: boolean;
  canUseHeatAsMegaCredits?: boolean;
  cardCost?: number;
  cardDiscount?: number;
  colonyTradeDiscount?: number;
  colonyTradeOffset?: number;
  colonyVictoryPoints?: number;
  color?: Color;
  corporationCard?: SerializedCard;
  corporationInitialActionDone?: boolean;
  dealtCorporationCards?: Array<CardName>;
  dealtPreludeCards?: Array<CardName>;
  dealtProjectCards?: Array<CardName>;
  draftedCards?: Array<CardName>;
  energy?: number;
  energyProduction?: number;
  fleetSize?: number;
  handicap?: number;
  hasIncreasedTerraformRatingThisGeneration?: boolean;
  hasTurmoilScienceTagBonus?: boolean;
  heat?: number;
  heatProduction?: number;
  id?: string;
  lastCardPlayed?: CardName;
  megaCreditProduction?: number;
  megaCredits?: number;
  name?: string;
  needsToDraft?: boolean;
  needsToResearch?: boolean;
  oceanBonus?: number;
  pickedCorporationCard?: CardName;
  plantProduction?: number;
  plants?: number;
  plantsNeededForGreenery?: number;
  playedCards?: Array<SerializedCard>;
  politicalAgendasActionUsedCount?: number;
  preludeCardsInHand?: Array<CardName>;
  removedFromPlayCards?: Array<CardName>;
  removingPlayers?: Array<PlayerId>;
  scienceTagCount?: number;
  steel?: number;
  steelProduction?: number;
  steelValue?: number;
  terraformRating?: number;
  terraformRatingAtGenerationStart?: number;
  timer?: SerializedTimer;
  titanium?: number;
  titaniumProduction?: number;
  titaniumValue?: number;
  tradesThisTurn?: number;
  turmoilPolicyActionUsed?: boolean;
}

interface SerializedFundedAward {
  name?: string;
  playerId?: PlayerId;
}

interface IMilestone {
  player_name?: string;
  milestone?: {
    name?: string;
    description?: string;
  };
}

type GameId = string;

type PlayerId = string;

interface LogMessage {
  timestamp?: Date;
  message?: string;
  data?: Array<{ value?: string }>;
  // When set, this message is private for the specifed player.
  // Always filter messages so they're not sent to the wrong player.
  playerId?: PlayerId;
}

export interface GameState {
  activePlayer?: PlayerId;
  awards?: Array<IAward>;
  claimedMilestones?: Array<SerializedClaimedMilestone>;
  colonies?: Array<SerializedColony>;
  donePlayers?: Array<PlayerId>;
  draftedPlayers?: Array<PlayerId>;
  draftRound?: number;
  first?: SerializedPlayer | PlayerId;
  fundedAwards?: Array<SerializedFundedAward>;
  gameAge?: number;
  gameLog?: Array<LogMessage>;
  generation?: number;
  id?: GameId;
  initialDraftIteration?: number;
  lastSaveId?: number;
  milestones?: Array<IMilestone>;
  monsInsuranceOwner?: PlayerId;
  oceans?: number;
  oxygenLevel?: number;
  passedPlayers?: Array<PlayerId>;
  phase?: Phase;
  players?: Array<SerializedPlayer>;
  researchedPlayers?: Array<PlayerId>;
  seed?: number;
  someoneHasRemovedOtherPlayersPlants?: boolean;
  syndicatePirateRaider?: PlayerId;
  temperature?: number;
  undoCount?: number;
  venusScaleLevel?: number;
}

export interface ApiResponse {
  game?: GameState;
  actionsTakenThisRound?: number;
  actionsThisGeneration?: Array<CardName>;
  beginner?: boolean;
  canUseHeatAsMegaCredits?: boolean;
  cardCost?: number;
  cardDiscount?: number;
  cardsInHand?: Array<CardName>;
  colonyTradeDiscount?: number;
  colonyTradeOffset?: number;
  colonyVictoryPoints?: number;
  color?: Color;
  corporationCard?: SerializedCard;
  corporationInitialActionDone?: boolean;
  dealtCorporationCards?: Array<CardName>;
  dealtPreludeCards?: Array<CardName>;
  dealtProjectCards?: Array<CardName>;
  draftedCards?: Array<CardName>;
  energy?: number;
  energyProduction?: number;
  fleetSize?: number;
  handicap?: number;
  hasIncreasedTerraformRatingThisGeneration?: boolean;
  hasTurmoilScienceTagBonus?: boolean;
  heat?: number;
  heatProduction?: number;
  id?: string;
  isActive?: boolean;
  lastCardPlayed?: CardName;
  megaCreditProduction?: number;
  megaCredits?: number;
  name?: string;
  needsToDraft?: boolean;
  needsToResearch?: boolean;
  oceanBonus?: number;
  pickedCorporationCard?: CardName;
  plantProduction?: number;
  plants?: number;
  plantsNeededForGreenery?: number;
  playedCards?: Array<SerializedCard>;
  players?: Array<SerializedPlayer>;
  politicalAgendasActionUsedCount?: number;
  preludeCardsInHand?: Array<CardName>;
  removedFromPlayCards?: Array<CardName>;
  removingPlayers?: Array<PlayerId>;
  scienceTagCount?: number;
  steel?: number;
  steelProduction?: number;
  steelValue?: number;
  terraformRating?: number;
  terraformRatingAtGenerationStart?: number;
  timer?: SerializedTimer;
  titanium?: number;
  titaniumProduction?: number;
  titaniumValue?: number;
  tradesThisTurn?: number;
  turmoilPolicyActionUsed?: boolean;
}
