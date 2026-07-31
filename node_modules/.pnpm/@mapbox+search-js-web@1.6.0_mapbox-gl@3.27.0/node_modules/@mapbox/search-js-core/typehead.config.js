module.exports = {
  target: 'es6',
  globalName: 'mapboxsearchcore',
  define: {
    MAPBOX_ACCESS_TOKEN: JSON.stringify(process.env.MAPBOX_ACCESS_TOKEN)
  }
};
