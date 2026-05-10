function pad(value) {
  return String(value).padStart(2, "0");
}

function todayString(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function getWeekStart(date = new Date()) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - day + 1);
  return todayString(copy);
}

function isThisWeek(dateText, now = new Date()) {
  return dateText >= getWeekStart(now) && dateText <= todayString(now);
}

module.exports = {
  todayString,
  monthKey,
  isThisWeek
};
