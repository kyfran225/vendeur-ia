import mapboxgl from 'mapbox-gl';
import { config } from '../src';
import { configureSearchBox } from './lib/configureSearchBox';
import { configureGeocoder } from './lib/configureGeocoder';
import { configureAddressAutofill } from './lib/configureAddressAutofill';
import { configureMinimap } from './lib/configureMinimap';
import { ACCESS_TOKEN } from './lib/constants';

config.feedbackEnabled = false;

// The configuration functions below are used to initialize and configure
// various web components for local testing. Initialization is conditional
// based on the presence of specific HTML elements in the current document.

configureMinimap();
configureAddressAutofill();

const mapEl = document.querySelector<HTMLElement>('#map');
if (mapEl) {
  mapboxgl.accessToken = ACCESS_TOKEN;

  const map = new mapboxgl.Map({
    container: mapEl,
    style: 'mapbox://styles/mapbox/streets-v11', // style URL
    center: [-74.5, 40], // starting position [lng, lat]
    zoom: 9 // starting zoom
  });
  map.addControl(new mapboxgl.FullscreenControl());

  configureSearchBox(map);
  configureGeocoder(map);
}
