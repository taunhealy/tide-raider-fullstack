import { LogService } from '../src/services/logService';

async function main() {
  const result = await LogService.getLogEntriesWithFilters({
    id: '68561cf3-0e31-4252-a3c2-bc04ab70230c'
  });
  
  console.log('Result:', JSON.stringify(result, null, 2));
}

main().catch(console.error);
