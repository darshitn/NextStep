import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  // Render supplies this public Git revision; no configuration values or secrets
  // are exposed. It lets the release audit distinguish a live build from an old one.
  const revision = process.env.RENDER_GIT_COMMIT;
  if (revision && /^[a-f0-9]{40}$/i.test(revision)) res.set('X-NextStep-Revision', revision);
  res.status(200).json({
    ok: true,
    service: 'nextstep-api',
    apiVersion: 1
  });
});

export default router;
