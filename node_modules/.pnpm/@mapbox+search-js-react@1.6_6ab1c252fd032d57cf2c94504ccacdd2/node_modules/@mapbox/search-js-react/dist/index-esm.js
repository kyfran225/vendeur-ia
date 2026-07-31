var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};

// src/index.ts
import "@mapbox/search-js-web";
import { config } from "@mapbox/search-js-web";

// src/components/AddressAutofill.tsx
import React, { useRef, useEffect, useImperativeHandle } from "react";
var AddressAutofill = React.forwardRef((props, refProp) => {
  const {
    accessToken,
    options,
    theme,
    popoverOptions,
    confirmOnBrowserAutofill,
    browserAutofillEnabled,
    children,
    onChange,
    onSuggest,
    onSuggestError,
    onRetrieve,
    interceptSearch
  } = props;
  const ref = useRef();
  useImperativeHandle(refProp, () => ({
    focus: () => {
      if (ref.current)
        return ref.current.focus();
      throw new Error("AddressAutofill is not mounted");
    }
  }));
  useEffect(() => {
    if (ref.current)
      ref.current.options = options;
  }, [ref.current, options]);
  useEffect(() => {
    if (ref.current)
      ref.current.interceptSearch = interceptSearch;
  }, [ref.current, options]);
  useEffect(() => {
    if (ref.current)
      ref.current.theme = theme;
  }, [ref.current, theme]);
  useEffect(() => {
    if (ref.current)
      ref.current.popoverOptions = popoverOptions;
  }, [ref.current, popoverOptions]);
  useEffect(() => {
    if (ref.current)
      ref.current.confirmOnBrowserAutofill = confirmOnBrowserAutofill;
  }, [ref.current, confirmOnBrowserAutofill]);
  useEffect(() => {
    if (ref.current)
      ref.current.browserAutofillEnabled = browserAutofillEnabled;
  }, [ref.current, browserAutofillEnabled]);
  useEffect(() => {
    const node = ref.current;
    if (!node)
      return;
    if (!onSuggest)
      return;
    const fn = (e) => onSuggest(e.detail);
    node.addEventListener("suggest", fn);
    return () => {
      node.removeEventListener("suggest", fn);
    };
  }, [ref.current, onSuggest]);
  useEffect(() => {
    const node = ref.current;
    if (!node)
      return;
    if (!onSuggestError)
      return;
    const fn = (e) => onSuggestError(e.detail);
    node.addEventListener("suggesterror", fn);
    return () => {
      node.removeEventListener("suggesterror", fn);
    };
  }, [ref.current, onSuggestError]);
  useEffect(() => {
    const node = ref.current;
    if (!node)
      return;
    if (!onRetrieve)
      return;
    const fn = (e) => onRetrieve(e.detail);
    node.addEventListener("retrieve", fn);
    return () => {
      node.removeEventListener("retrieve", fn);
    };
  }, [ref.current, onRetrieve]);
  useEffect(() => {
    const node = ref.current;
    if (!node)
      return;
    if (!onChange)
      return;
    const fn = (e) => {
      if (e.target !== e.currentTarget)
        return;
      onChange(e.detail);
    };
    node.addEventListener("input", fn);
    return () => {
      node.removeEventListener("input", fn);
    };
  }, [ref.current, onChange]);
  useEffect(() => {
    if (ref.current)
      ref.current.accessToken = accessToken;
  }, [ref.current, accessToken]);
  return /* @__PURE__ */ React.createElement("mapbox-address-autofill", {
    ref
  }, children);
});

// src/components/SearchBox.tsx
import React2, { useRef as useRef2, useEffect as useEffect2, useImperativeHandle as useImperativeHandle2 } from "react";
var SearchBox = React2.forwardRef((props, refProp) => {
  const {
    accessToken,
    options,
    componentOptions,
    theme,
    popoverOptions,
    placeholder,
    map,
    marker,
    mapboxgl,
    value,
    onChange,
    onSuggest,
    onSuggestError,
    onRetrieve,
    onClear,
    onBlur,
    interceptSearch
  } = props;
  const ref = useRef2();
  useImperativeHandle2(refProp, () => ({
    focus: () => {
      if (ref.current)
        return ref.current.focus();
      throw new Error("SearchBox is not mounted");
    },
    search: (text) => {
      if (ref.current)
        return ref.current.search(text);
      throw new Error("SearchBox is not mounted");
    }
  }));
  useEffect2(() => {
    if (ref.current)
      ref.current.options = options || {};
  }, [ref.current, options]);
  useEffect2(() => {
    if (ref.current)
      ref.current.componentOptions = componentOptions || {};
  }, [ref.current, componentOptions]);
  useEffect2(() => {
    if (ref.current)
      ref.current.interceptSearch = interceptSearch;
  }, [ref.current, interceptSearch]);
  useEffect2(() => {
    if (ref.current)
      ref.current.theme = theme;
  }, [ref.current, theme]);
  useEffect2(() => {
    if (ref.current)
      ref.current.popoverOptions = popoverOptions;
  }, [ref.current, popoverOptions]);
  useEffect2(() => {
    if (ref.current)
      ref.current.placeholder = placeholder;
  }, [ref.current, placeholder]);
  useEffect2(() => {
    if (ref.current)
      ref.current.value = value || "";
  }, [ref.current, value]);
  useEffect2(() => {
    const node = ref.current;
    if (!node)
      return;
    node.bindMap(map);
    return () => {
      node.unbindMap();
    };
  }, [ref.current, map]);
  useEffect2(() => {
    if (ref.current)
      ref.current.marker = marker;
  }, [ref.current, marker]);
  useEffect2(() => {
    if (ref.current)
      ref.current.mapboxgl = mapboxgl;
  }, [ref.current, mapboxgl]);
  useEffect2(() => {
    const node = ref.current;
    if (!node)
      return;
    if (!onSuggest)
      return;
    const fn = (e) => onSuggest(e.detail);
    node.addEventListener("suggest", fn);
    return () => {
      node.removeEventListener("suggest", fn);
    };
  }, [ref.current, onSuggest]);
  useEffect2(() => {
    const node = ref.current;
    if (!node)
      return;
    if (!onSuggestError)
      return;
    const fn = (e) => onSuggestError(e.detail);
    node.addEventListener("suggesterror", fn);
    return () => {
      node.removeEventListener("suggesterror", fn);
    };
  }, [ref.current, onSuggestError]);
  useEffect2(() => {
    const node = ref.current;
    if (!node)
      return;
    if (!onRetrieve)
      return;
    const fn = (e) => onRetrieve(e.detail);
    node.addEventListener("retrieve", fn);
    return () => {
      node.removeEventListener("retrieve", fn);
    };
  }, [ref.current, onRetrieve]);
  useEffect2(() => {
    const node = ref.current;
    if (!node)
      return;
    if (!onChange)
      return;
    const fn = (e) => {
      if (e.target !== e.currentTarget)
        return;
      onChange(e.detail);
    };
    node.addEventListener("input", fn);
    return () => {
      node.removeEventListener("input", fn);
    };
  }, [ref.current, onChange]);
  useEffect2(() => {
    const node = ref.current;
    if (!node)
      return;
    if (!onClear)
      return;
    const fn = () => {
      onClear();
    };
    node.addEventListener("clear", fn);
    return () => {
      node.removeEventListener("clear", fn);
    };
  }, [ref.current, onClear]);
  useEffect2(() => {
    const node = ref.current;
    if (!node)
      return;
    if (!onBlur)
      return;
    const fn = () => {
      onBlur();
    };
    node.addEventListener("blur", fn);
    return () => {
      node.removeEventListener("blur", fn);
    };
  }, [ref.current, onBlur]);
  useEffect2(() => {
    if (ref.current)
      ref.current.accessToken = accessToken;
  }, [ref.current, accessToken]);
  return /* @__PURE__ */ React2.createElement("mapbox-search-box", {
    ref
  });
});

// src/components/Geocoder.tsx
import React3, { useRef as useRef3, useEffect as useEffect3, useImperativeHandle as useImperativeHandle3 } from "react";
var Geocoder = React3.forwardRef((props, refProp) => {
  const {
    accessToken,
    options,
    componentOptions,
    theme,
    popoverOptions,
    placeholder,
    map,
    marker,
    mapboxgl,
    value,
    onChange,
    onSuggest,
    onSuggestError,
    onRetrieve,
    onClear,
    onBlur,
    interceptSearch
  } = props;
  const ref = useRef3();
  useImperativeHandle3(refProp, () => ({
    focus: () => {
      if (ref.current)
        return ref.current.focus();
      throw new Error("Geocoder is not mounted");
    },
    search: (text) => {
      if (ref.current)
        return ref.current.search(text);
      throw new Error("Geocoder is not mounted");
    }
  }));
  useEffect3(() => {
    if (ref.current)
      ref.current.options = options || {};
  }, [ref.current, options]);
  useEffect3(() => {
    if (ref.current)
      ref.current.componentOptions = componentOptions || {};
  }, [ref.current, componentOptions]);
  useEffect3(() => {
    if (ref.current)
      ref.current.interceptSearch = interceptSearch;
  }, [ref.current, interceptSearch]);
  useEffect3(() => {
    if (ref.current)
      ref.current.theme = theme;
  }, [ref.current, theme]);
  useEffect3(() => {
    if (ref.current)
      ref.current.popoverOptions = popoverOptions;
  }, [ref.current, popoverOptions]);
  useEffect3(() => {
    if (ref.current)
      ref.current.placeholder = placeholder;
  }, [ref.current, placeholder]);
  useEffect3(() => {
    if (ref.current)
      ref.current.value = value || "";
  }, [ref.current, value]);
  useEffect3(() => {
    const node = ref.current;
    if (!node)
      return;
    node.bindMap(map);
    return () => {
      node.unbindMap();
    };
  }, [ref.current, map]);
  useEffect3(() => {
    if (ref.current)
      ref.current.marker = marker;
  }, [ref.current, marker]);
  useEffect3(() => {
    if (ref.current)
      ref.current.mapboxgl = mapboxgl;
  }, [ref.current, mapboxgl]);
  useEffect3(() => {
    const node = ref.current;
    if (!node)
      return;
    if (!onSuggest)
      return;
    const fn = (e) => onSuggest(e.detail);
    node.addEventListener("suggest", fn);
    return () => {
      node.removeEventListener("suggest", fn);
    };
  }, [ref.current, onSuggest]);
  useEffect3(() => {
    const node = ref.current;
    if (!node)
      return;
    if (!onSuggestError)
      return;
    const fn = (e) => onSuggestError(e.detail);
    node.addEventListener("suggesterror", fn);
    return () => {
      node.removeEventListener("suggesterror", fn);
    };
  }, [ref.current, onSuggestError]);
  useEffect3(() => {
    const node = ref.current;
    if (!node)
      return;
    if (!onRetrieve)
      return;
    const fn = (e) => onRetrieve(e.detail);
    node.addEventListener("retrieve", fn);
    return () => {
      node.removeEventListener("retrieve", fn);
    };
  }, [ref.current, onRetrieve]);
  useEffect3(() => {
    const node = ref.current;
    if (!node)
      return;
    if (!onChange)
      return;
    const fn = (e) => {
      if (e.target !== e.currentTarget)
        return;
      onChange(e.detail);
    };
    node.addEventListener("input", fn);
    return () => {
      node.removeEventListener("input", fn);
    };
  }, [ref.current, onChange]);
  useEffect3(() => {
    const node = ref.current;
    if (!node)
      return;
    if (!onClear)
      return;
    const fn = () => {
      onClear();
    };
    node.addEventListener("clear", fn);
    return () => {
      node.removeEventListener("clear", fn);
    };
  }, [ref.current, onClear]);
  useEffect3(() => {
    const node = ref.current;
    if (!node)
      return;
    if (!onBlur)
      return;
    const fn = () => {
      onBlur();
    };
    node.addEventListener("blur", fn);
    return () => {
      node.removeEventListener("blur", fn);
    };
  }, [ref.current, onBlur]);
  useEffect3(() => {
    if (ref.current)
      ref.current.accessToken = accessToken;
  }, [ref.current, accessToken]);
  return /* @__PURE__ */ React3.createElement("mapbox-geocoder", {
    ref
  });
});

// src/components/AddressMinimap.tsx
import React4, { useRef as useRef4, useEffect as useEffect4 } from "react";
function AddressMinimap(props) {
  const {
    canAdjustMarker = false,
    keepMarkerCentered = false,
    markerAnchor = "bottom",
    onSaveMarkerLocation,
    show = false,
    accessToken,
    feature = null,
    adjustBtnText,
    saveBtnText,
    cancelBtnText,
    satelliteToggle = false,
    theme,
    mapStyleMode = "default",
    defaultMapStyle = ["mapbox", "streets-v11"],
    footer
  } = props;
  const ref = useRef4();
  useEffect4(() => {
    if (!ref.current)
      return;
    if (show) {
      ref.current.show();
    } else {
      ref.current.hide();
    }
  }, [ref.current, show]);
  useEffect4(() => {
    if (ref.current)
      ref.current.theme = theme;
  }, [ref.current, theme]);
  useEffect4(() => {
    if (ref.current)
      ref.current.feature = show ? feature : null;
  }, [ref.current, feature, show]);
  useEffect4(() => {
    if (ref.current)
      ref.current.mapStyleMode = mapStyleMode;
  }, [ref.current, mapStyleMode]);
  useEffect4(() => {
    if (adjustBtnText === void 0)
      return;
    if (ref.current)
      ref.current.adjustBtnText = adjustBtnText;
  }, [ref.current, adjustBtnText]);
  useEffect4(() => {
    if (saveBtnText === void 0)
      return;
    if (ref.current)
      ref.current.saveBtnText = saveBtnText;
  }, [ref.current, saveBtnText]);
  useEffect4(() => {
    if (cancelBtnText === void 0)
      return;
    if (ref.current)
      ref.current.cancelBtnText = cancelBtnText;
  }, [ref.current, cancelBtnText]);
  useEffect4(() => {
    if (ref.current)
      ref.current.defaultMapStyle = defaultMapStyle;
  }, [ref.current, defaultMapStyle]);
  useEffect4(() => {
    if (footer === void 0)
      return;
    if (ref.current)
      ref.current.footer = footer;
  }, [ref.current, footer]);
  useEffect4(() => {
    if (ref.current)
      ref.current.accessToken = accessToken;
  }, [ref.current, accessToken]);
  useEffect4(() => {
    if (ref.current)
      ref.current.onSaveMarkerLocation = onSaveMarkerLocation;
  }, [ref.current, onSaveMarkerLocation]);
  return /* @__PURE__ */ React4.createElement("mapbox-address-minimap", {
    ref,
    "can-adjust-marker": canAdjustMarker,
    "keep-marker-centered": keepMarkerCentered,
    "marker-anchor": markerAnchor,
    "satellite-toggle": satelliteToggle
  });
}

// src/hooks/useEvented.tsx
import { useEffect as useEffect5, useRef as useRef5 } from "react";
function useEvented(evented, eventName, cb) {
  const cbRef = useRef5(cb);
  useEffect5(() => {
    cbRef.current = cb;
  });
  useEffect5(() => {
    if (!evented)
      return;
    const fn = (object) => cbRef.current(object);
    evented.addEventListener(eventName, fn);
    return () => {
      evented.removeEventListener(eventName, fn);
    };
  }, [evented, eventName, cbRef]);
}

// src/hooks/useAddressAutofillCore.tsx
import { useEffect as useEffect6, useMemo } from "react";
import {
  AddressAutofillCore
} from "@mapbox/search-js-core";
var DEFAULTS = AddressAutofillCore.defaults;
function useAddressAutofillCore(options) {
  const autofill = useMemo(() => {
    return new AddressAutofillCore();
  }, []);
  useEffect6(() => {
    const _a = options, { accessToken } = _a, restOptions = __objRest(_a, ["accessToken"]);
    autofill.accessToken = accessToken;
    autofill.defaults = __spreadValues(__spreadValues({}, DEFAULTS), restOptions);
  }, [options]);
  return autofill;
}

// src/hooks/useSearchBoxCore.tsx
import { useEffect as useEffect7, useMemo as useMemo2 } from "react";
import { SearchBoxCore } from "@mapbox/search-js-core";
var DEFAULTS2 = SearchBoxCore.defaults;
function useSearchBoxCore(options) {
  const search = useMemo2(() => {
    return new SearchBoxCore();
  }, []);
  useEffect7(() => {
    const _a = options, { accessToken } = _a, restOptions = __objRest(_a, ["accessToken"]);
    search.accessToken = accessToken;
    search.defaults = __spreadValues(__spreadValues({}, DEFAULTS2), restOptions);
  }, [options]);
  return search;
}

// src/hooks/useGeocodingCore.tsx
import { useEffect as useEffect8, useMemo as useMemo3 } from "react";
import { GeocodingCore } from "@mapbox/search-js-core";
function useGeocodingCore(options) {
  const search = useMemo3(() => {
    return new GeocodingCore();
  }, []);
  useEffect8(() => {
    const _a = options, { accessToken } = _a, restOptions = __objRest(_a, ["accessToken"]);
    search.accessToken = accessToken;
    search.defaults = __spreadValues({}, restOptions);
  }, [options]);
  return search;
}

// src/hooks/useSearchSession.tsx
import {
  SearchBoxCore as SearchBoxCore2,
  GeocodingCore as GeocodingCore2,
  SearchSession
} from "@mapbox/search-js-core";
import { useMemo as useMemo4 } from "react";
function useSearchSession(search) {
  const searchSession = useMemo4(() => {
    return new SearchSession(search);
  }, [search]);
  if (search instanceof SearchBoxCore2) {
    return searchSession;
  } else if (search instanceof GeocodingCore2) {
    return searchSession;
  } else {
    return searchSession;
  }
}

// src/hooks/useConfirmAddress.tsx
import { useMemo as useMemo5, useRef as useRef6 } from "react";
import {
  confirmAddress
} from "@mapbox/search-js-web";
function useConfirmAddress(optionsArg = {}) {
  const formRef = useRef6(null);
  return useMemo5(() => {
    return {
      formRef,
      showConfirm: () => confirmAddress(formRef.current, optionsArg)
    };
  }, [formRef, optionsArg]);
}
export {
  AddressAutofill,
  AddressMinimap,
  Geocoder,
  SearchBox,
  config,
  useAddressAutofillCore,
  useConfirmAddress,
  useEvented,
  useGeocodingCore,
  useAddressAutofillCore as useMapboxAutofill,
  useSearchBoxCore,
  useSearchSession
};
//# sourceMappingURL=index-esm.js.map
