
const displayDate = new Date('2026-04-13T00:00:00.000Z');
const todayMidnight = new Date('2026-05-14T00:00:00.000Z');

console.log(`Display Date: ${displayDate.toISOString()}`);
console.log(`Today Midnight: ${todayMidnight.toISOString()}`);
console.log(`displayDate < todayMidnight: ${displayDate < todayMidnight}`);

if (displayDate < todayMidnight) {
  console.log('Skipping...');
} else {
  console.log('NOT skipping!');
}
