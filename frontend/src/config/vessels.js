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
 * These define the CatmullRomCurve3 used for TubeGeometry overlays.
 */
export const CORONARY_PATHS = {
  LAD: [
    [0.01, 0.04, 0.05],
    [0.005, 0.02, 0.07],
    [0.0, -0.01, 0.08],
    [-0.005, -0.04, 0.07],
    [-0.01, -0.07, 0.06],
    [-0.015, -0.10, 0.04],
  ],
  LCX: [
    [0.01, 0.04, 0.05],
    [0.03, 0.02, 0.04],
    [0.05, 0.0, 0.02],
    [0.06, -0.02, -0.01],
    [0.05, -0.04, -0.03],
  ],
  RCA: [
    [-0.03, 0.04, 0.03],
    [-0.05, 0.02, 0.04],
    [-0.07, 0.0, 0.03],
    [-0.08, -0.03, 0.01],
    [-0.07, -0.06, -0.01],
    [-0.05, -0.09, -0.02],
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
