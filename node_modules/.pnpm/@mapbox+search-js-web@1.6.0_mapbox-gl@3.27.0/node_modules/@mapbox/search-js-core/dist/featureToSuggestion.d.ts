import { SearchBoxFeatureSuggestion, SearchBoxFeatureProperties } from './searchbox/types';
import { AddressAutofillFeatureSuggestion, AddressAutofillSuggestion } from './autofill/types';
declare function featureToSuggestion(feature: SearchBoxFeatureSuggestion): SearchBoxFeatureProperties;
declare function featureToSuggestion(feature: AddressAutofillFeatureSuggestion): AddressAutofillSuggestion;
export { featureToSuggestion };
