/* eslint-disable @typescript-eslint/no-var-requires */
const webTypehead = require('../web/typehead.config.js');

const config = {
  ...webTypehead
};

// Don't have a CDN build for React.
delete config.globalName;

module.exports = config;
