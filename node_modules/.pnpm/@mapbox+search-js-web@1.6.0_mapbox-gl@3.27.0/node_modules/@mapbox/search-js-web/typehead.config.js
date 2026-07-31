/* eslint-disable @typescript-eslint/no-var-requires */

const postcss = require('postcss');
const cssnano = require('cssnano');

const fs = require('fs');

module.exports = {
  // Make sure to load CSS as minified text.
  plugins: [
    {
      name: 'cssnano',
      setup(build) {
        const filter = /.*\.css$/;
        build.onLoad({ filter }, async (args) => {
          const contents = await fs.promises.readFile(args.path, 'utf8');
          const result = await postcss([cssnano]).process(contents, {
            // Added to supress warning.
            from: undefined
          });

          return {
            loader: 'text',
            contents: result.css
          };
        });
      }
    }
  ],
  loader: {
    '.svg': 'text',
    '.png': 'dataurl',
    '.jpg': 'dataurl'
  },
  target: 'es6',
  globalName: 'mapboxsearch',
  define: {
    MAPBOX_ACCESS_TOKEN: JSON.stringify(process.env.MAPBOX_ACCESS_TOKEN)
  }
};
