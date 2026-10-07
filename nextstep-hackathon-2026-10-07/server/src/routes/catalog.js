import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const router = Router();

const dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.resolve(dirname, '../../data/dsa-starter.json');
const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

export { catalogData };

router.get('/', (req, res) => {
  res.status(200).json({
    data: catalogData
  });
});

export default router;
