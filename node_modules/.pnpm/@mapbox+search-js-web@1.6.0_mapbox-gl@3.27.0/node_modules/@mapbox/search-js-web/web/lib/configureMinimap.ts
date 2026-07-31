import { MapboxAddressMinimap } from '../../src';
import CUSTOM_MARKER from '../assets/marker-custom.svg';
import { ACCESS_TOKEN } from './constants';

/**
 * Initialize and configure MapboxAddressMinimap instances for local testing on `http://localhost:8000/index.html`
 * and `http://localhost:8000/minimap.html`.
 */
export const configureMinimap = (): void => {
  const minimap = document.querySelector<MapboxAddressMinimap>(
    'mapbox-address-minimap'
  );
  if (minimap) {
    minimap.accessToken = ACCESS_TOKEN;
    minimap.onSaveMarkerLocation = (coordinate) => {
      if (
        coordinate.toString() !==
        minimap.feature.geometry.coordinates.toString()
      ) {
        console.log(`Marker updated to ${JSON.stringify(coordinate)}.`);
      }
    };
    minimap.footer = 'My custom footer';

    if (window.location.pathname === '/minimap.html') {
      minimap.theme = {
        variables: { border: '13px solid #bbb', borderRadius: '18px' },
        icons: { marker: CUSTOM_MARKER }
      };
      minimap.defaultMapStyle = [
        'mapbox-search-web',
        'ckvsj8zh613el14qdcpvvhmd0'
      ];
      minimap.feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-77.035244, 38.889438]
        },
        properties: {}
      };
    }
  }
};
