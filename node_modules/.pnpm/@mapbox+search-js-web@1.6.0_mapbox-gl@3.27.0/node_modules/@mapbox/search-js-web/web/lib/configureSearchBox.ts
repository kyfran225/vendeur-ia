import mapboxgl from 'mapbox-gl';
import { MapboxSearchBox } from '../../src';
import { THEMES, ACCESS_TOKEN } from './constants';

/**
 * Initialize and configure MapboxSearchBox instances for local testing on `http://localhost:8000/map-searchbox.html`
 * @param map
 */
export const configureSearchBox = (map: mapboxgl.Map): void => {
  const searchboxDefault = document.getElementById(
    'searchbox-default'
  ) as MapboxSearchBox;
  const selectEl = document.querySelector('select');

  if (searchboxDefault) {
    searchboxDefault.accessToken = ACCESS_TOKEN;
    searchboxDefault.bindMap(map);
    searchboxDefault.mapboxgl = mapboxgl;

    searchboxDefault.addEventListener('input', (e) => {
      if (e.target !== e.currentTarget) return;
      console.log('input', e.detail);
    });
    searchboxDefault.addEventListener('suggest', (e) =>
      console.log('suggest', e.detail)
    );
    searchboxDefault.addEventListener('suggesterror', (err) =>
      console.log('error', err)
    );
    searchboxDefault.addEventListener('retrieve', (e) =>
      console.log('retrieve', e.detail)
    );
    searchboxDefault.addEventListener('clear', () => console.log('clear'));

    const searchboxClone = searchboxDefault.cloneNode(true) as MapboxSearchBox;
    searchboxClone.accessToken = ACCESS_TOKEN;
    searchboxClone.options.language = 'pt';
    searchboxClone.mapboxgl = mapboxgl;
    searchboxClone.marker = { color: 'red' };
    searchboxClone.componentOptions.allowReverse = true;
    searchboxClone.componentOptions.flipCoordinates = true;

    map.addControl(searchboxClone);
    selectEl.addEventListener('change', () => {
      searchboxClone.theme = THEMES[selectEl.value];
    });

    // clonedElement.search('99 green st');

    // const searchbox = new MapboxSearchBox();
    // searchbox.accessToken = ACCESS_TOKEN;
    // map.addControl(searchbox);
  }

  const searchboxCustomSearch = document.getElementById(
    'searchbox-customsearch'
  ) as MapboxSearchBox;
  if (searchboxCustomSearch) {
    searchboxCustomSearch.accessToken = ACCESS_TOKEN;
    searchboxCustomSearch.mapboxgl = mapboxgl;
    searchboxCustomSearch.bindMap(map);
    searchboxCustomSearch.marker = { color: 'orange' };

    const coordinatesGeocoder = async (query) => {
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
          name: 'Lng: ' + lng + ' Lat: ' + lat,
          place_formatted: 'Coordinate location',
          full_address: 'Lng: ' + lng + ' Lat: ' + lat,
          _geometry: {
            type: 'Point',
            coordinates: [lng, lat]
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

    searchboxCustomSearch.componentOptions.customSearch = coordinatesGeocoder;
    searchboxCustomSearch.componentOptions.allowReverse = true;
  }
};
