/**
 * Centralized Codeforces Visual Grammar Utilities for Kernious
 * Defines rating tier colors, verdict status colors, and formatters.
 */

// Rating Tier Color Resolver (CF Official Legend)
export function getRatingInfo(rating) {
  if (rating === null || rating === undefined || rating === 0) {
    return { name: 'Unrated', className: 'user-gray', hex: '#808080' };
  }
  if (rating < 1200) {
    return { name: 'Newbie', className: 'user-gray', hex: '#808080' };
  }
  if (rating < 1400) {
    return { name: 'Pupil', className: 'user-green', hex: '#008000' };
  }
  if (rating < 1600) {
    return { name: 'Specialist', className: 'user-cyan', hex: '#03a89e' };
  }
  if (rating < 1900) {
    return { name: 'Expert', className: 'user-blue', hex: '#0000ff' };
  }
  if (rating < 2200) {
    return { name: 'Candidate Master', className: 'user-violet', hex: '#aa00aa' };
  }
  if (rating < 2400) {
    return { name: 'Master', className: 'user-orange', hex: '#ff8c00' };
  }
  return { name: 'Grandmaster', className: 'user-red', hex: '#ff0000' };
}

// Verdict Status Badge Formatter
export function getVerdictBadge(verdict) {
  switch (verdict) {
    case 'OK':
    case 'Accepted':
      return { label: 'Accepted', className: 'verdict-accepted' };
    case 'WA':
    case 'Wrong Answer':
      return { label: 'Wrong Answer', className: 'verdict-wa' };
    case 'TLE':
    case 'Time Limit Exceeded':
      return { label: 'Time Limit Exceeded', className: 'verdict-tle' };
    case 'MLE':
    case 'Memory Limit Exceeded':
      return { label: 'Memory Limit Exceeded', className: 'verdict-mle' };
    case 'RTE':
    case 'Runtime Error':
      return { label: 'Runtime Error', className: 'verdict-rte' };
    default:
      return { label: verdict || 'Tested', className: 'verdict-default' };
  }
}
