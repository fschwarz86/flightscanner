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
  "OCN": 24591
};

/**
 * Returns the Awtrix icon ID corresponding to the flight's airline or callsign prefix.
 * @param {Object} flightData
 * @returns {number}
 */
function getAirlineIcon(flightData = {}) {
  const airline = (flightData.airline || "").trim();
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

  // 3. Callsign 3-letter ICAO prefix match
  if (callsign.length >= 3) {
    const prefix = callsign.slice(0, 3);
    if (CALLSIGN_PREFIX_ICONS[prefix]) {
      return CALLSIGN_PREFIX_ICONS[prefix];
    }
  }

  return DEFAULT_ICON;
}

/**
 * Formats notification text in German based on available route and aircraft details.
 * @param {Object} flightData
 * @returns {string}
 */
function formatNotificationText(flightData = {}) {
  const airline = flightData.airline && flightData.airline !== "Unbekannte Fluggesellschaft" ? flightData.airline : "";
  const callsign = flightData.callsign && flightData.callsign !== "Unbekannt" ? flightData.callsign : "";
  const origin = flightData.origin && flightData.origin !== "Unbekannt" ? flightData.origin : "";
  const destination = flightData.destination && flightData.destination !== "Unbekannt" ? flightData.destination : "";
  const aircraft = flightData.aircraft && flightData.aircraft !== "Unbekannt" ? flightData.aircraft : "";

  const flightLabel = airline ? `${airline} Flug ${callsign}`.trim() : (callsign ? `Flug ${callsign}` : "Flug");
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
