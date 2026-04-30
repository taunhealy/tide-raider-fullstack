
const dateStr = '2026-04-24';
const dateObj = new Date(dateStr);
console.log('Date object:', dateObj.toString());
console.log('ISO String:', dateObj.toISOString());
console.log('Split ISO:', dateObj.toISOString().split('T')[0]);
