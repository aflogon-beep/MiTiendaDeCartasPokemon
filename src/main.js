// Arranque del juego. La mayor parte del código sigue en legacy.js mientras se separa en módulos (R2).
import * as legacy from "./legacy.js";
import * as util from "./core/util.js";
import * as rng from "./core/rng.js";
import * as constants from "./core/constants.js";
import * as cardsCache from "./core/cards/cache.js";
import * as cardsPrices from "./core/cards/prices.js";
import * as cardsSets from "./core/cards/sets.js";
import * as cardsApi from "./core/cards/api.js";
import * as state from "./core/state.js";
import * as save from "./core/save.js";
import { installTestHooks } from "./debug.js";

installTestHooks(state.G, [util, rng, constants, cardsCache, cardsPrices, cardsSets, cardsApi, state, save], legacy.__get, legacy.__set);
