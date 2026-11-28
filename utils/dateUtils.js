/**
 * CCA DocTrack - Philippine Time & Calendar Utilities (Asia/Manila)
 * Christ Centered Academy of Lipa City Inc.
 * 
 * Ensures consistent handling of Philippine standard time (UTC+8) across
 * request submissions, status updates, calendar schedules, and audit records.
 */

const PHILIPPINE_TIMEZONE = 'Asia/Manila';

/**
 * Returns current date/time parts in Asia/Manila timezone
 */
function getPhilippineDateParts(date = new Date()) {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: PHILIPPINE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(d);
  const partMap = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  return {
    year: partMap.year,
    month: partMap.month,
    day: partMap.day,
    hour: partMap.hour,
    minute: partMap.minute,
    second: partMap.second
  };
}

/**
 * Returns the current calendar date string in YYYY-MM-DD format (Asia/Manila)
 */
function getPhilippineDateString(date = new Date()) {
  const parts = getPhilippineDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/**
 * Returns ISO-like timestamp string with Asia/Manila offset (+08:00)
 */
function getPhilippineTimestamp(date = new Date()) {
  const parts = getPhilippineDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+08:00`;
}

/**
 * Formats a date or timestamp string into institutional Philippine display format:
 * Example: "November 28, 2026 – 11:45 PM"
 */
function formatPhilippineDateTime(date) {
  if (!date) return '--';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);

  const datePart = d.toLocaleDateString('en-US', {
    timeZone: PHILIPPINE_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const timePart = d.toLocaleTimeString('en-US', {
    timeZone: PHILIPPINE_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return `${datePart} – ${timePart}`;
}

/**
 * Formats a calendar date (date-only) without shifting viewports:
 * Example: "November 28, 2026"
 */
function formatPhilippineDate(date) {
  if (!date) return '--';
  // If YYYY-MM-DD format, parse components explicitly to avoid UTC shift
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
    const [y, m, d] = date.trim().split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d, 4, 0, 0)); // Noon UTC+8 is safe
    return dateObj.toLocaleDateString('en-US', {
      timeZone: PHILIPPINE_TIMEZONE,
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);

  return d.toLocaleDateString('en-US', {
    timeZone: PHILIPPINE_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Calculates estimated release date based on working days (Monday-Friday)
 * and excludes registered school/national holidays.
 * 
 * @param {string|Date} startDate - Initial submission date (YYYY-MM-DD or Date)
 * @param {number} processingDays - Number of working days needed (default: 2)
 * @param {Array<string>} holidays - Array of holiday date strings (YYYY-MM-DD)
 * @returns {string} Estimated release date string (YYYY-MM-DD)
 */
function calculateEstimatedReleaseDate(startDate, processingDays = 2, holidays = []) {
  let [year, month, day] = (typeof startDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(startDate))
    ? startDate.substring(0, 10).split('-').map(Number)
    : [
        parseInt(getPhilippineDateParts().year, 10),
        parseInt(getPhilippineDateParts().month, 10),
        parseInt(getPhilippineDateParts().day, 10)
      ];

  let current = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  let addedDays = 0;
  const holidaySet = new Set(holidays);

  while (addedDays < processingDays) {
    current.setUTCDate(current.getUTCDate() + 1);
    const dayOfWeek = current.getUTCDay(); // 0 = Sun, 6 = Sat

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // Check holiday
    const yStr = current.getUTCFullYear();
    const mStr = String(current.getUTCMonth() + 1).padStart(2, '0');
    const dStr = String(current.getUTCDate()).padStart(2, '0');
    const dateStr = `${yStr}-${mStr}-${dStr}`;

    if (holidaySet.has(dateStr)) continue;

    addedDays++;
  }

  const resY = current.getUTCFullYear();
  const resM = String(current.getUTCMonth() + 1).padStart(2, '0');
  const resD = String(current.getUTCDate()).padStart(2, '0');
  return `${resY}-${resM}-${resD}`;
}

/**
 * Generates an unpredictable pickup verification code:
 * Format: "CCA-PK-XXXXXX" (e.g., CCA-PK-8D2F9A)
 */
function generatePickupCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CCA-PK-${code}`;
}

/**
 * Generates a human-readable unique tracking number:
 * Format: "CCA-REQ-XXXX" (e.g., CCA-REQ-0042)
 */
function formatRequestNumber(id) {
  const num = parseInt(id, 10) || 1;
  return `CCA-REQ-${String(num).padStart(4, '0')}`;
}

module.exports = {
  PHILIPPINE_TIMEZONE,
  getPhilippineDateParts,
  getPhilippineDateString,
  getPhilippineTimestamp,
  formatPhilippineDateTime,
  formatPhilippineDate,
  calculateEstimatedReleaseDate,
  addPhilippineWorkingDays: calculateEstimatedReleaseDate,
  generatePickupCode,
  formatRequestNumber
};
