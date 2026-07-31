import { AddressAutofillRetrieveResponse } from '@mapbox/search-js-core';
import {
  MapboxAddressAutofill,
  MapboxAddressMinimap,
  MapboxHTMLEvent,
  confirmAddress
} from '../../src';
import CUSTOM_MARKER from '../assets/marker-custom.svg';
import { THEMES, ACCESS_TOKEN } from './constants';

/**
 * Initialize and configure MapboxAddressAutofill instances for local testing on `http://localhost:8000/index.html`
 */
export const configureAddressAutofill = (): void => {
  const form = document.querySelector('form');
  const selectEl = document.querySelector('select');
  const minimap = document.querySelector<MapboxAddressMinimap>(
    'mapbox-address-minimap'
  );

  const autofillElement = document.getElementById(
    'autofill-element'
  ) as MapboxAddressAutofill;

  if (autofillElement) {
    // Set the access token.
    autofillElement.accessToken = ACCESS_TOKEN;

    // Trigger minimap on retrieve
    if (minimap && autofillElement instanceof MapboxAddressAutofill) {
      autofillElement.addEventListener(
        'retrieve',
        (e: MapboxHTMLEvent<AddressAutofillRetrieveResponse>) => {
          minimap.feature = e.detail.features[0];
          document.getElementById('minimap-container').style.display = 'block';
        }
      );
    }

    selectEl.addEventListener('change', () => {
      autofillElement.theme = THEMES[selectEl.value];
      minimap && (minimap.theme = THEMES[selectEl.value]);
    });
  }

  if (form && autofillElement) {
    autofillElement.options.proximity = 'ip';

    autofillElement.confirmOnBrowserAutofill = {
      minimap: true
    };

    autofillElement.addEventListener('suggest', (res) =>
      console.log('suggest', res)
    );
    autofillElement.addEventListener('suggesterror', (err) =>
      console.log('error', err)
    );
    autofillElement.addEventListener('retrieve', (res) =>
      console.log('retrieve', res)
    );

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const result = await confirmAddress(form, {
        theme: THEMES[selectEl.value],
        accessToken: ACCESS_TOKEN,
        minimap: {
          defaultMapStyle: ['mapbox', 'light-v10'],
          satelliteToggle: true,
          theme: { icons: { marker: CUSTOM_MARKER } }
        },
        skipConfirmModal: (feature) =>
          ['exact', 'high'].includes(feature.properties.match_code.confidence),
        footer: false
      });

      console.log(result);
    });
  }
};
