const SL_TZ = 'Asia/Colombo';

/**
 * Format any date value for display in Sri Lanka Time (Asia/Colombo, UTC+5:30)
 * @param {string|Date} val - date value
 * @param {boolean} dateOnly - if true, omit time
 */
export function fmtSLT(val, dateOnly = false) {
  if (!val) return '-';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    if (dateOnly) {
      return d.toLocaleDateString('en-GB', {
        timeZone: SL_TZ,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
    return d.toLocaleString('en-GB', {
      timeZone: SL_TZ,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

/**
 * Returns current time as a naive datetime-local string in SLT (YYYY-MM-DDTHH:mm)
 * Use this for comparing with values stored from datetime-local inputs (which are in SLT)
 */
export function nowSLTString() {
  const SLT_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
  const slt = new Date(Date.now() + SLT_OFFSET_MS);
  return slt.toISOString().slice(0, 16);
}

/**
 * Convert any UTC ISO string to a naive SLT datetime-local string (YYYY-MM-DDTHH:mm)
 * Use this to compare UTC-stored timestamps (e.g. last_call_datetime) with
 * naive SLT strings (e.g. sales_follow_up_datetime from datetime-local inputs)
 */
export function toSLTString(isoStr) {
  if (!isoStr) return '';
  const SLT_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
  const slt = new Date(new Date(isoStr).getTime() + SLT_OFFSET_MS);
  return slt.toISOString().slice(0, 16);
}