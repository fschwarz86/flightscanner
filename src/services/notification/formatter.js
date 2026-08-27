const DEFAULT_ICON = 15302;

const AIRLINE_ICONS = {
  "Lufthansa": 24591,
  "Swiss International Air Lines": 24604,
  "British Airways": 24607,
  "Turkish Airlines": 24629,
  "Scandinavian Airlines System": 24608,
  "KLM Royal Dutch Airlines": 24528,
  "Iberia": 24590,
  "Emirates": 54545,
  "Air France": 52241,
  "ITA Airways": 24605,
  "Eurowings": 58999,
  "Discover Airlines": 24591
};

const CALLSIGN_PREFIX_ICONS = {
  // ICAO (3-letter)
  "DLH": 24591,
  "SWR": 24604,
  "BAW": 24607,
  "THY": 24629,
  "SAS": 24608,
  "KLM": 24528,
  "IBE": 24590,
  "UAE": 54545,
  "AFR": 52241,
  "ITY": 24605,
  "EWG": 58999,
  "EWE": 58999,
  "OCN": 24591,

  // IATA (2-letter)
  "LH": 24591,
  "LX": 24604,
  "BA": 24607,
  "TK": 24629,
  "SK": 24608,
  "KL": 24528,
  "IB": 24590,
  "EK": 54545,
  "AF": 52241,
  "AZ": 24605,
  "EW": 58999,
  "4Y": 24591
};

/**
 * Returns the Awtrix icon ID corresponding to the flight's airline or callsign/flight number prefix.
 * @param {Object} flightData
 * @returns {number}
 */
function getAirlineIcon(flightData = {}) {
  const airline = (flightData.airline || "").trim();
  const iataCode = (flightData.flightNumberIata || flightData.callsignIata || "").trim().toUpperCase();
  const callsign = (flightData.callsign || "").trim().toUpperCase();

  // 1. Direct airline name match
  if (airline && AIRLINE_ICONS[airline]) {
    return AIRLINE_ICONS[airline];
  }

  // 2. Partial airline name match
  for (const [key, iconId] of Object.entries(AIRLINE_ICONS)) {
    if (airline && airline.toLowerCase().includes(key.toLowerCase())) {
      return iconId;
    }
  }

  // 3. IATA 2-letter prefix match (e.g. "LH123" -> "LH", "EW40" -> "EW")
  if (iataCode.length >= 2) {
    const iataPrefix = iataCode.slice(0, 2);
    if (CALLSIGN_PREFIX_ICONS[iataPrefix]) {
      return CALLSIGN_PREFIX_ICONS[iataPrefix];
    }
  }

  // 4. Callsign 3-letter ICAO prefix match (e.g. "DLH123" -> "DLH")
  if (callsign.length >= 3) {
    const icaoPrefix = callsign.slice(0, 3);
    if (CALLSIGN_PREFIX_ICONS[icaoPrefix]) {
      return CALLSIGN_PREFIX_ICONS[icaoPrefix];
    }
  }

  // 5. Callsign 2-letter fallback match
  if (callsign.length >= 2) {
    const shortPrefix = callsign.slice(0, 2);
    if (CALLSIGN_PREFIX_ICONS[shortPrefix]) {
      return CALLSIGN_PREFIX_ICONS[shortPrefix];
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
  AIRLINE_ICONS,
  CALLSIGN_PREFIX_ICONS
};
