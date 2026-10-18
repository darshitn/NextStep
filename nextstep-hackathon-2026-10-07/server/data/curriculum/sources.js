/**
 * NextStep Source Attribution & Provenance Ledger
 *
 * Every lesson, interactive exercise, and external practice problem reference
 * in the NextStep curriculum links to a verified source entry below.
 *
 * Review & Provenance Rules:
 * - No scraped proprietary problem statements, editorials, or hidden test cases.
 * - Original NextStep lessons and interactive exercises are explicitly marked 'original_authored'.
 * - Open-licensed educational references (Open Data Structures CC-BY 4.0, OpenDSA MIT,
 *   Tech Interview Handbook MIT) carry their exact licence and attribution notices.
 * - External practice problem entries store only the canonical link, title, and our own
 *   original educational pattern/prerequisite/edge-case mappings.
 */

export const CURRICULUM_SOURCES = [
  {
    id: 'src_nextstep_original',
    title: 'NextStep Original Curriculum & Interactive Proof Studio Material',
    url: 'https://next-step-six-theta.vercel.app/',
    creator: 'NextStep Curriculum Team (Darshit & Contributors)',
    license: 'Original Authored Material (Proprietary to Project Repository)',
    requiredNotice: 'Original educational explanations, worked examples, interactive trace sequences, and misconception rubrics authored specifically for NextStep.',
    changesMade: 'Authored from scratch for NextStep Atlas + Proof release.',
    verificationDate: '2026-10-17',
    usageType: 'original_authored'
  },
  {
    id: 'src_ods_cc_by',
    title: 'Open Data Structures (Edition 0.1G)',
    url: 'https://opendatastructures.org/',
    creator: 'Pat Morin',
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    requiredNotice: 'Adapted concepts and complexity bounds informed by Open Data Structures by Pat Morin (https://opendatastructures.org/), licensed under CC BY 4.0.',
    changesMade: 'Rewritten into concise 15-25 minute interactive trace lessons with original JavaScript examples and boundary checks; no verbatim textbook chapters copied.',
    verificationDate: '2026-10-17',
    usageType: 'open_license_reference'
  },
  {
    id: 'src_opendsa_mit',
    title: 'OpenDSA Interactive eTextbook Project',
    url: 'https://opendsa.org/home/license',
    creator: 'OpenDSA Project (Virginia Tech / Clifford A. Shaffer et al.)',
    license: 'MIT License (Code and standard text modules)',
    requiredNotice: 'Pedagogical trace design inspired by OpenDSA (https://opendsa.org/home/license), MIT License.',
    changesMade: 'Created original deterministic state-snapshot JSON structures and misconception feedback for NextStep Proof renderers.',
    verificationDate: '2026-10-17',
    usageType: 'open_license_reference'
  },
  {
    id: 'src_tih_mit',
    title: 'Tech Interview Handbook & Grind 75 Pattern Taxonomy',
    url: 'https://github.com/yangshun/tech-interview-handbook/blob/main/LICENSE',
    creator: 'Yangshun Tay and Contributors',
    license: 'MIT License (Repository guide material only; linked third-party problems belong to their respective owners)',
    requiredNotice: 'Topic ordering and study pattern taxonomy informed by Tech Interview Handbook (MIT License, Copyright (c) Yangshun Tay).',
    changesMade: 'Mapped public problem URLs to NextStep lessons and authored original edge-case prompts and why-recommended notes.',
    verificationDate: '2026-10-17',
    usageType: 'open_license_reference'
  },
  {
    id: 'src_leetcode_studyplan_ext',
    title: 'LeetCode Public Problem Catalog & Top Interview 150 Reference Links',
    url: 'https://leetcode.com/studyplan/top-interview-150/',
    creator: 'LeetCode',
    license: 'External Link Reference Only (Subject to https://leetcode.com/terms/)',
    requiredNotice: 'External problem links point directly to LeetCode problem pages. NextStep does not mirror, scrape, or reproduce proprietary problem descriptions, solutions, or test cases.',
    changesMade: 'Stored canonical problem title, public URL, verified difficulty badge, and original NextStep prerequisite/edge-case commentary only.',
    verificationDate: '2026-10-17',
    usageType: 'external_link_only'
  }
];
