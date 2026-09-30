/**
 * Color scale utility: maps a probability (0-1) to a color.
 * Green (safe) → Yellow (moderate) → Red (high risk)
 */

export function probabilityToColor(probability) {
  const p = Math.max(0, Math.min(1, probability));

  let r, g, b;
  if (p < 0.5) {
    // Green (#22c55e) → Yellow (#eab308)
    const t = p / 0.5;
    r = Math.round(34 + (234 - 34) * t);
    g = Math.round(197 + (179 - 197) * t);
    b = Math.round(94 + (8 - 94) * t);
  } else {
    // Yellow (#eab308) → Red (#ef4444)
    const t = (p - 0.5) / 0.5;
    r = Math.round(234 + (239 - 234) * t);
    g = Math.round(179 - 179 * t);
    b = Math.round(8 + (68 - 8) * t);
  }

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function probabilityToHex(probability) {
  return parseInt(probabilityToColor(probability).replace('#', ''), 16);
}

export function getRiskLevel(probability) {
  if (probability < 0.3) return { label: 'Low Risk', color: '#22c55e' };
  if (probability < 0.6) return { label: 'Moderate Risk', color: '#eab308' };
  return { label: 'High Risk', color: '#ef4444' };
}

export function getStatusColor(status) {
  if (status === 'Stenotic' || status === 'CAD') return '#ef4444';
  return '#22c55e';
}
