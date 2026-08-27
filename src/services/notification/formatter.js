const DEFAULT_ICON = 15302;

/**
 * Unified Airline Registry.
 *
 * Each entry maps an Awtrix icon ID to:
 * - `names`: Array of airline names/aliases (case-insensitive matching)
 * - `codes`: Array of 2-letter IATA and 3-letter ICAO airline/callsign prefixes
 *
 * To add a new airline, simply add a single object entry here.
 */
const AIRLINE_REGISTRY = [
  {
    icon: 24591,
    names: ["Lufthansa", "Lufthansa Cargo", "Lufthansa CityLine", "Discover Airlines"],
    codes: ["LH", "DLH", "GEC", "CLH", "4Y", "OCN"]
  },
  {
    icon: 74959,
    names: ["Brussels Airlines"],
    codes: ["SN", "BEL"]
  },
  {
    icon: 74955,
    names: ["Austrian Airlines"],
    codes: ["OS", "AUA"]
  },
  {
    icon: 58999,
    names: ["Eurowings", "Eurowings Europe"],
    codes: ["EW", "EWG", "EWE"]
  },
  {
    icon: 24604,
    names: ["Swiss International Air Lines", "Swiss Global Air Lines", "Swiss"],
    codes: ["LX", "SWR"]
  },
  {
    icon: 24607,
    names: ["British Airways", "BA CityFlyer"],
    codes: ["BA", "BAW", "CFE"]
  },
  {
    icon: 52241,
    names: ["Air France", "Hop!"],
    codes: ["AF", "AFR", "HOP"]
  },
  {
    icon: 24528,
    names: ["KLM Royal Dutch Airlines", "KLM Cityhopper", "KLM"],
    codes: ["KL", "KLM", "KLC"]
  },
  {
    icon: 24629,
    names: ["Turkish Airlines", "Pegasus Airlines", "SunExpress", "AJet", "AnadoluJet"],
    codes: ["TK", "THY", "PC", "PGT", "XQ", "SXS", "VF", "TKJ"]
  },
  {
    icon: 24608,
    names: ["Scandinavian Airlines System", "Scandinavian Airlines", "SAS", "Finnair", "Widerøe"],
    codes: ["SK", "SAS", "DY", "D8", "AY", "FIN", "WF", "WIF"]
  },
  {
    icon: 52217,
    names: ["Norwegian"],
    codes: ["NAX", "NSZ"]
  },
  {
    icon: 69625,
    names: ["Finnair"],
    codes: ["AY", "FIN"]
  },
  {
    icon: 74963,
    names: ["Iberia", "Iberia Express"],
    codes: ["IB", "IBE", "IBS"]
  },
  {
    icon: 70948,
    names: ["Vueling"],
    codes: ["VY", "VLG"]
  },
  {
    icon: 74983,
    names: ["TAP Air Portugal"],
    codes: ["TP", "TAP"]
  },
  {
    icon: 54545,
    names: ["Emirates"],
    codes: ["EK", "UAE"]
  },
  {
    icon: 24605,
    names: ["ITA Airways", "Alitalia"],
    codes: ["AZ", "ITY"]
  },
  {
    icon: 74926,
    names: ["Ryanair", "Malta Air", "Buzz", "Lauda Europe"],
    codes: ["FR", "RYR", "MAY", "RYS", "LDA"]
  },
  {
    icon: 74940,
    names: ["easyJet", "easyJet Europe", "easyJet Switzerland"],
    codes: ["U2", "EZY", "EJU", "EZS"]
  },
  {
    icon: 74943,
    names: ["Wizz Air", "Wizz Air UK", "Wizz Air Malta"],
    codes: ["W6", "WZZ", "WUK", "WMT"]
  },
  {
    icon: 77081,
    names: ["Condor"],
    codes: ["DE", "CFG"]
  }
];

// Pre-compiled fast lookup tables
const NAME_ICON_MAP = new Map();
const CODE_ICON_MAP = new Map();

for (const entry of AIRLINE_REGISTRY) {
  for (const name of entry.names || []) {
    NAME_ICON_MAP.set(name.toLowerCase(), entry.icon);
  }
  for (const code of entry.codes || []) {
    CODE_ICON_MAP.set(code.toUpperCase(), entry.icon);
  }
}

// Backwards compatibility mappings
const AIRLINE_ICONS = Object.fromEntries(NAME_ICON_MAP.entries());
const CALLSIGN_PREFIX_ICONS = Object.fromEntries(CODE_ICON_MAP.entries());

/**
 * Returns the Awtrix icon ID corresponding to the flight's airline or callsign/flight number prefix.
 * @param {Object} flightData
 * @param {Array} [registry=AIRLINE_REGISTRY]
 * @returns {number}
 */
function getAirlineIcon(flightData = {}, registry = AIRLINE_REGISTRY) {
  const airline = (flightData.airline || "").trim().toLowerCase();
  const iataCode = (flightData.flightNumberIata || flightData.callsignIata || "").trim().toUpperCase();
  const callsign = (flightData.callsign || "").trim().toUpperCase();

  const isDefault = registry === AIRLINE_REGISTRY;

  // 1. Direct / exact airline name match
  if (airline) {
    if (isDefault && NAME_ICON_MAP.has(airline)) {
      return NAME_ICON_MAP.get(airline);
    }
    for (const entry of registry) {
      if ((entry.names || []).some(n => n.toLowerCase() === airline)) {
        return entry.icon;
      }
    }
  }

  // 2. IATA 2-letter prefix match (e.g. "LH123" -> "LH", "EW40" -> "EW")
  if (iataCode.length >= 2) {
    const iataPrefix = iataCode.slice(0, 2);
    if (isDefault && CODE_ICON_MAP.has(iataPrefix)) {
      return CODE_ICON_MAP.get(iataPrefix);
    }
    for (const entry of registry) {
      if ((entry.codes || []).some(c => c.toUpperCase() === iataPrefix)) {
        return entry.icon;
      }
    }
  }

  // 3. Callsign 3-letter ICAO prefix match (e.g. "DLH123" -> "DLH")
  if (callsign.length >= 3) {
    const icaoPrefix = callsign.slice(0, 3);
    if (isDefault && CODE_ICON_MAP.has(icaoPrefix)) {
      return CODE_ICON_MAP.get(icaoPrefix);
    }
    for (const entry of registry) {
      if ((entry.codes || []).some(c => c.toUpperCase() === icaoPrefix)) {
        return entry.icon;
      }
    }
  }

  // 4. Callsign 2-letter fallback match (e.g. "LH123" -> "LH")
  if (callsign.length >= 2) {
    const shortPrefix = callsign.slice(0, 2);
    if (isDefault && CODE_ICON_MAP.has(shortPrefix)) {
      return CODE_ICON_MAP.get(shortPrefix);
    }
    for (const entry of registry) {
      if ((entry.codes || []).some(c => c.toUpperCase() === shortPrefix)) {
        return entry.icon;
      }
    }
  }

  // 5. Partial substring airline name match
  if (airline) {
    for (const entry of registry) {
      for (const name of entry.names || []) {
        const lower = name.toLowerCase();
        if (airline.includes(lower) || lower.includes(airline)) {
          return entry.icon;
        }
      }
    }
  }

  return DEFAULT_ICON;
}

/**
 * Formats notification text in German based on available route and aircraft details.
 * Prefers IATA flight number if available (e.g., "LH123" instead of "DLH123").
 * @param {Object} flightData
 * @returns {string}
 */
function formatNotificationText(flightData = {}) {
  const airline = flightData.airline && flightData.airline !== "Unbekannte Fluggesellschaft" ? flightData.airline : "";
  const flightCode = (flightData.flightNumberIata || flightData.callsignIata || flightData.callsign || "").trim();
  const displayCallsign = flightCode && flightCode !== "Unbekannt" ? flightCode : "";
  const origin = flightData.origin && flightData.origin !== "Unbekannt" ? flightData.origin : "";
  const destination = flightData.destination && flightData.destination !== "Unbekannt" ? flightData.destination : "";
  const aircraft = (flightData.aircraft && flightData.aircraft !== "Unbekannt")
    ? flightData.aircraft
    : (flightData.aircraftIcao && flightData.aircraftIcao !== "Unbekannt" ? flightData.aircraftIcao : "");

  const flightLabel = airline ? `${airline} Flug ${displayCallsign}`.trim() : (displayCallsign ? `Flug ${displayCallsign}` : "Flug");
  const aircraftTag = aircraft ? ` (${aircraft})` : "";

  if (origin && (origin === "Hamburg (HAM)" || origin === "HAM" || origin.toLowerCase().includes("hamburg"))) {
    return `${flightLabel}${aircraftTag} -> ${destination || "Unbekannt"}`;
  }

  if (origin && destination) {
    return `${flightLabel}${aircraftTag} ${origin} -> ${destination}`;
  }

  if (origin) {
    return `${flightLabel}${aircraftTag} <- ${origin}`;
  }

  if (destination) {
    return `${flightLabel}${aircraftTag} -> ${destination}`;
  }

  if (!origin && !destination && !airline) {
    if (aircraft) {
      return `${flightLabel}${aircraftTag}`;
    }
    return `${flightLabel} (keine Daten)`;
  }

  return `${flightLabel}${aircraftTag} im Anflug`;
}

/**
 * Builds standard Awtrix matrix notification payload.
 * @param {Object} flightData
 * @param {Object} options
 * @returns {Object}
 */
function formatNotificationPayload(flightData, options = {}) {
  const icon = options.icon || getAirlineIcon(flightData);
  const repeat = options.repeat !== undefined ? options.repeat : 3;
  const speed = options.speed !== undefined ? options.speed : 50;
  const text = options.text || formatNotificationText(flightData);

  return {
    icon: String(icon),
    repeat: repeat,
    scroll: {
      speed: speed
    },
    text: text
  };
}

module.exports = {
  getAirlineIcon,
  formatNotificationText,
  formatNotificationPayload,
  DEFAULT_ICON,
  AIRLINE_REGISTRY,
  AIRLINE_ICONS,
  CALLSIGN_PREFIX_ICONS
};
