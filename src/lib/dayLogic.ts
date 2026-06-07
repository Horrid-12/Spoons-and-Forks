export const getLogicalDayString = (timestamp: number, dayStartHour: number): string => {
  const date = new Date(timestamp);
  if (date.getHours() < dayStartHour) {
    date.setDate(date.getDate() - 1);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getReadableDay = (dayString: string): string => {
  const [y, m, d] = dayString.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};
