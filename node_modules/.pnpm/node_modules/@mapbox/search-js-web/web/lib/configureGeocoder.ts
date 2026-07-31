import mapboxgl from 'mapbox-gl';
import { MapboxGeocoder } from '../../src';
import { THEMES, ACCESS_TOKEN } from './constants';

/**
 * Initialize and configure MapboxGeocoder instances for local testing on `http://localhost:8000/map-geocoder.html`
 * @param map
 */
export const configureGeocoder = (map: mapboxgl.Map): void => {
  const geocoderDefault = document.getElementById(
    'geocoder-default'
  ) as MapboxGeocoder;
  const selectEl = document.querySelector('select');

  if (geocoderDefault) {
    geocoderDefault.accessToken = ACCESS_TOKEN;
    geocoderDefault.options.proximity = 'ip';
    geocoderDefault.bindMap(map);
    geocoderDefault.mapboxgl = mapboxgl;

    geocoderDefault.addEventListener('input', (e) => {
      if (e.target !== e.currentTarget) return;
      console.log('input', e.detail);
    });
    geocoderDefault.addEventListener('suggest', (e) =>
      console.log('suggest', e.detail)
    );
    geocoderDefault.addEventListener('suggesterror', (err) =>
      console.log('error', err)
    );
    geocoderDefault.addEventListener('retrieve', (e) =>
      console.log('retrieve', e.detail)
    );
    geocoderDefault.addEventListener('clear', () => console.log('clear'));

    const geocoderClone = geocoderDefault.cloneNode(true) as MapboxGeocoder;
    geocoderClone.accessToken = ACCESS_TOKEN;
    geocoderClone.options.language = 'pt';
    geocoderClone.mapboxgl = mapboxgl;
    geocoderClone.marker = { color: 'red' };

    map.addControl(geocoderClone);
    selectEl.addEventListener('change', () => {
      geocoderClone.theme = THEMES[selectEl.value];
    });

    // clonedElement.search('99 green st');

    // const searchbox = new MapboxSearchBox();
    // searchbox.accessToken = ACCESS_TOKEN;
    // map.addControl(searchbox);
  }

  const geocoderCustomSearch = document.getElementById(
    'geocoder-customsearch'
  ) as MapboxGeocoder;
  if (geocoderCustomSearch) {
    geocoderCustomSearch.accessToken = ACCESS_TOKEN;
    geocoderCustomSearch.mapboxgl = mapboxgl;
    geocoderCustomSearch.bindMap(map);
    geocoderCustomSearch.marker = { color: 'orange' };

    const coordinatesGeocoder = async (query) => {
      // Simulate a delay to mimic an async API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Match anything which looks like
      // decimal degrees coordinate pair.
      const matches = query.match(
        /^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i
      );
      if (!matches) {
        return null;
      }

      function coordinateFeature(lng, lat) {
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          properties: {
            name: 'Lng: ' + lng + ' Lat: ' + lat,
            place_formatted: 'Coordinate location',
            full_address: 'Lng: ' + lng + ' Lat: ' + lat
          }
        };
      }

      const coord1 = Number(matches[1]);
      const coord2 = Number(matches[2]);
      const geocodes = [];

      if (coord1 < -90 || coord1 > 90) {
        // must be lng, lat
        geocodes.push(coordinateFeature(coord1, coord2));
      }

      if (coord2 < -90 || coord2 > 90) {
        // must be lat, lng
        geocodes.push(coordinateFeature(coord2, coord1));
      }

      if (geocodes.length === 0) {
        // else could be either lng, lat or lat, lng
        geocodes.push(coordinateFeature(coord1, coord2));
        geocodes.push(coordinateFeature(coord2, coord1));
      }

      return geocodes;
    };

    geocoderCustomSearch.componentOptions.customSearch = coordinatesGeocoder;
  }
};
