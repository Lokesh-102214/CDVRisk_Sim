/**
 * Shared vessel configuration — single source of truth for LAD, LCX, RCA
 * Used by HeartModel, VesselCard, Dashboard, and all vessel-related components.
 */
export const VESSELS = {
  LAD: {
    key: 'LAD',
    fullName: 'Left Anterior Descending',
    supplies: 'Front of the heart, left ventricle, interventricular septum',
    index: 1,
    description: 'The LAD artery is the largest coronary artery and supplies blood to the front and bottom of the left ventricle and the front of the septum.',
  },
  LCX: {
    key: 'LCX',
    fullName: 'Left Circumflex',
    supplies: 'Side and back of the heart, left atrium',
    index: 2,
    description: 'The LCX artery branches off the left coronary artery and wraps around the heart muscle, supplying blood to the side and back.',
  },
  RCA: {
    key: 'RCA',
    fullName: 'Right Coronary Artery',
    supplies: 'Right ventricle, bottom of both ventricles',
    index: 3,
    description: 'The RCA supplies blood to the right ventricle, right atrium, SA node, and AV node.',
  },
};

export const VESSEL_KEYS = Object.keys(VESSELS);

/**
 * Anatomical artery paths (local coordinates relative to the GLTF model).
 * Traced perfectly along the surface of the heart using the Coordinate Picker.
 */
export const CORONARY_PATHS = {
  LAD: [
    [0.4006, 0.0088, 0.3210],
    [0.3052, -0.0148, 0.6481],
    [0.3130, -0.0468, 0.6912],
    [0.2560, -0.0799, 0.7342],
    [0.2344, -0.1447, 0.7919],
  ],
  LCX: [
    [0.4546, -0.1299, 0.2200],
    [0.4714, -0.1716, 0.3368],
    [0.4642, -0.2187, 0.4167],
  ],
  RCA: [
    [-0.0603, 0.1498, 0.2501],
    [-0.1313, 0.1019, 0.2699],
    [-0.1943, -0.0183, 0.3157],
    [-0.2007, -0.1518, 0.3227],
    [-0.1483, -0.3239, 0.2888],
  ],
};

/**
 * Normalize raw vessel predictions from the API into a stable map.
 * @param {Array} vessels - Array of { vessel, probability } from API
 * @returns {{ LAD: number|null, LCX: number|null, RCA: number|null }}
 */
export function normalizeVesselPredictions(vessels) {
  const result = { LAD: null, LCX: null, RCA: null };
  for (const item of vessels ?? []) {
    const vessel = String(item.vessel).trim().toUpperCase();
    if (vessel in result) {
      const prob = Number(item.probability);
      result[vessel] = Number.isFinite(prob)
        ? Math.max(0, Math.min(1, prob))
        : null;
    }
  }
  return result;
}
