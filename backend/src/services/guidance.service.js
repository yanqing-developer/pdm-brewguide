export function buildGuidance({ usedMemory, hasUserCoords }) {
  const questions = [];

  const preferredTypes = usedMemory?.preferredTypes ?? [];
  const nameKeywords = usedMemory?.nameKeywords ?? [];
  const radiusKm = usedMemory?.radiusKm;

  if (!Array.isArray(preferredTypes) || preferredTypes.length === 0) {
    questions.push("Any preferred brewery types (e.g., micro, brewpub, taproom)?");
  }

  if (!Array.isArray(nameKeywords) || nameKeywords.length === 0) {
    questions.push('Any name keywords you like (e.g., "garden", "craft", "bier")?');
  }

  if (!hasUserCoords) {
    questions.push("Share your current location (lat/lon) to prioritize nearby places?");
  } else if (typeof radiusKm === "number" && (radiusKm <= 1 || radiusKm >= 5)) {
    questions.push("Want to adjust your radius (e.g., 2–3 km) for better coverage?");
  } else {
    questions.push("Do you prefer closer places first, or higher-quality listings (with websites) first?");
  }

  const suggestedActions = [
    { action: "save", endpoint: "/api/actions/save", payload: { brewery_id: "<id>" } },
    { action: "dismiss", endpoint: "/api/actions/dismiss", payload: { brewery_id: "<id>" } },
    { action: "similar", endpoint: "/api/actions/similar", payload: { brewery_id: "<id>" } }
  ];

  return { nextQuestions: questions.slice(0, 3), suggestedActions };
};
