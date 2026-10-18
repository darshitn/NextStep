import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCurriculumDataset, getPublishedCurriculum } from '../src/services/curriculumRegistry.js';

const report = validateCurriculumDataset();

if (!report.valid) {
  console.error('❌ Curriculum validation FAILED:');
  for (const err of report.errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

const published = getPublishedCurriculum();

const dirname = path.dirname(fileURLToPath(import.meta.url));
const clientFixturePath = path.resolve(dirname, '../../client/src/fixtures/curriculum.json');
fs.writeFileSync(clientFixturePath, JSON.stringify(published, null, 2) + '\n', 'utf8');

console.log('✅ Curriculum validation PASSED & synced to client/src/fixtures/curriculum.json');
console.log(JSON.stringify({
  valid: report.valid,
  counts: report.counts,
  publishedTopicIds: published.topics.map((t) => t.id)
}, null, 2));
