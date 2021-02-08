// Import the validation module
const fs = require('fs');
const path = require('path');
const { xml2js } = require('xml-js');
const jsonata = require('jsonata');
const jsonld = require('jsonld')

const XML2JSON_OPTIONS = {
  compact: false,
  alwaysArray: true,
  alwaysChildren: true,
  trim: true,
  indentText: true,
  spaces: '  ',
};

// Source is a URL to the Relax NG schema to use. A ``file://`` URL
// may be used to load from the local fs.
const inputPath = path.join(
  __dirname,
  'epub31',
  'schema',
  'package-31.xsd',
);
const outputPath = path.join(
  __dirname,
  'epub31',
  'schema',
  'package-31.json',
);
const EPUB3_1_SCHEMA = xml2js(
  fs.readFileSync(
    inputPath,
    'utf-8',
  ),
  XML2JSON_OPTIONS,
);

const SIMPLIFY_XSD = `
(
  $N := function ($ctx) {
    $merge([
      {
        (
          $ctx.attributes.name
            ? $ctx.attributes.name
            : $ctx.name
          ): $append(
            $ctx.elements.$N($)[],
            $.attributes
          )
        }, 
        $ctx.attributes
    ]).($.ref ? $.ref : $)
  };
  $.elements.$N($)
)
`;
const ctx = JSON.parse(fs.readFileSync(path.join(__dirname, 'context.jsonld'), 'utf-8'));
const compacted = await jsonld.compact(metadata, ctx);

fs.writeFileSync(
  outputPath,
  JSON.stringify(
    jsonata(SIMPLIFY_XSD).evaluate(EPUB3_1_SCHEMA),
    null,
    2,
  ),
  'utf-8',
);