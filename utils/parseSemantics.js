const fs = require('fs');
const path = require('path');
const xmlJs = require('xml-js');
const jsonata = require('jsonata');
const yaml = require('js-yaml');
const pick = require('lodash.pick');
const omit = require('lodash.omit');

const inputPath = path.join(__dirname, 'epub_structure_2582d2de5b397e7beb35b068bf87625d4e3da16c.html');

process.stdout.write(`INPUT:\n  - ${inputPath}\n\n`);

const semantic = xmlJs.xml2js(fs.readFileSync(inputPath, 'utf-8'), {
  alwaysArray: true,
  compact: false,
  trim: true,
});

console.log(JSON.stringify(semantic));
const res = jsonata(`**.elements[name='dl']{
  $replace(attributes.about, /(#|\-[0-9]+)/, ''):
  $.elements[(**.attributes.rev or **.attributes.property)]{
    $replace(attributes.about, /#|\-[0-9]+/, ''):
    ('owl:deprecated' in **.property)
      ? undefined
      : $join($.**.elements[type='text'].text.$trim($), '\n')
  }
}`).evaluate(semantic);
const frontmatterSectioning = ['frontmatter', 'division', 'volume', 'part', 'chapter']
const resGrouped = JSON.parse(JSON.stringify({
  frontmatter: {
    titles: pick(res.titles, ['covertitle']),
    preliminary: res.preliminary,
    sections: pick(res.sections, ['abstract', 'foreword', 'preface', 'prologue', 'introduction', 'preamble']),

    // divisions: {division: {volume: {part: {chapter: res.divisions.chapter}}}}
  },
  bodymatter: {
    ...omit(
      res,
      ['preliminary', 'sections', 'references', 'titles'],
    ),
    titles: omit(res.titles, ['covertitle']),
  },
  backmatter: {
    references: res.references,
    bibliographies: res.bibliographies,
    glossaries: res.glossaries,
    sections: pick(res.sections, ['conclusion', 'epilogue', 'afterword', 'epigraph']),
  },
}));
fs.writeFileSync(path.join(__dirname, 'epub_structural_semantic.json'), JSON.stringify(resGrouped, null, 2), 'utf-8');
fs.writeFileSync(path.join(__dirname, 'epub_structural_semantic.yaml'), yaml.safeDump(resGrouped, { sortKeys: true }), 'utf-8');
