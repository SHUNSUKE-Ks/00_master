import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = resolve(fileURLToPath(new URL('.', import.meta.url)));
const projectRoot = resolve(scriptDirectory, '..');
const templatesPath = resolve(projectRoot, 'src', 'data', 'system_templates.json');
const sampleMapPath = resolve(projectRoot, 'src', 'data', 'sampleMap.ts');
const samplesDirectory = resolve(projectRoot, 'assets', 'samples');

const expectedTemplateIds = [
  'template_rock01',
  'template_jazz01',
  'template_dnb01',
  'template_hiphop01',
];

const categoryColor = {
  drum: 'green',
  bass: 'blue',
  melodic: 'purple',
  fx: 'orange',
  perc: 'indigo',
  vocal: 'teal',
};

const errors = [];
const templatesDocument = JSON.parse(readFileSync(templatesPath, 'utf8'));
const sampleMapSource = readFileSync(sampleMapPath, 'utf8');
const sampleMapKeys = new Set(
  [...sampleMapSource.matchAll(/^\s*'([^']+\.wav)':\s*require\(/gm)].map((match) => match[1]),
);

function fail(message) {
  errors.push(message);
}

if (templatesDocument.version !== 1) {
  fail(`Expected template document version 1, received ${String(templatesDocument.version)}`);
}

if (!Array.isArray(templatesDocument.templates)) {
  fail('templates must be an array');
}

const templates = Array.isArray(templatesDocument.templates) ? templatesDocument.templates : [];
const templateIds = templates.map((template) => template.id);

if (templates.length !== expectedTemplateIds.length) {
  fail(`Expected ${expectedTemplateIds.length} templates, found ${templates.length}`);
}

for (const expectedId of expectedTemplateIds) {
  if (!templateIds.includes(expectedId)) {
    fail(`Missing required template: ${expectedId}`);
  }
}

if (new Set(templateIds).size !== templateIds.length) {
  fail('Template IDs must be unique');
}

let assignedPads = 0;
const referencedSamples = new Set();

for (const template of templates) {
  if (!Array.isArray(template.pads)) {
    fail(`${template.id}: pads must be an array`);
    continue;
  }

  const padsWithSamples = template.pads.filter((pad) => typeof pad.sample === 'string' && pad.sample.length > 0);
  if (padsWithSamples.length < 8) {
    fail(`${template.id}: expected at least 8 pads with samples, found ${padsWithSamples.length}`);
  }

  const coordinates = new Set();
  const padIds = new Set();

  for (const pad of template.pads) {
    if (!Number.isInteger(pad.row) || pad.row < 0 || pad.row > 5) {
      fail(`${template.id}/${pad.id}: row must be an integer from 0 to 5`);
    }
    if (!Number.isInteger(pad.column) || pad.column < 0 || pad.column > 7) {
      fail(`${template.id}/${pad.id}: column must be an integer from 0 to 7`);
    }

    const coordinate = `${pad.row}:${pad.column}`;
    if (coordinates.has(coordinate)) {
      fail(`${template.id}: duplicate row/column coordinate ${coordinate}`);
    }
    coordinates.add(coordinate);

    if (padIds.has(pad.id)) {
      fail(`${template.id}: duplicate pad ID ${pad.id}`);
    }
    padIds.add(pad.id);

    if (categoryColor[pad.category] !== pad.color) {
      fail(`${template.id}/${pad.id}: ${pad.category} must use ${categoryColor[pad.category] ?? 'a valid category color'}, received ${String(pad.color)}`);
    }

    if (typeof pad.sample === 'string' && pad.sample.length > 0) {
      assignedPads += 1;
      referencedSamples.add(pad.sample);

      if (!existsSync(resolve(samplesDirectory, pad.sample))) {
        fail(`${template.id}/${pad.id}: missing WAV file ${pad.sample}`);
      }
      if (!sampleMapKeys.has(pad.sample)) {
        fail(`${template.id}/${pad.id}: sampleMap is missing ${pad.sample}`);
      }
    }
  }
}

for (const sampleKey of sampleMapKeys) {
  if (!existsSync(resolve(samplesDirectory, sampleKey))) {
    fail(`sampleMap references missing WAV file ${sampleKey}`);
  }
}

for (const sample of referencedSamples) {
  if (!sampleMapKeys.has(sample)) {
    fail(`Referenced sample is missing from sampleMap: ${sample}`);
  }
}

if (errors.length > 0) {
  console.error(`Template validation failed with ${errors.length} error(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log('Template validation passed');
  console.log(`- Templates: ${templates.length}`);
  console.log(`- Assigned pads: ${assignedPads}`);
  console.log(`- Referenced samples: ${referencedSamples.size}`);
  console.log(`- Static sampleMap keys: ${sampleMapKeys.size}`);
  console.log('- Checks: template count, minimum samples, WAV existence, sampleMap integrity, coordinates, category/color mapping');
}
