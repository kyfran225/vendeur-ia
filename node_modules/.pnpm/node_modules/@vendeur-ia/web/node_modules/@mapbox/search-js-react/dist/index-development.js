var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
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
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
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
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, copyDefault, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && (copyDefault || key !== "default"))
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toESM = (module2, isNodeMode) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", !isNodeMode && module2 && module2.__esModule ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
var __toCommonJS = /* @__PURE__ */ ((cache) => {
  return (module2, temp) => {
    return cache && cache.get(module2) || (temp = __reExport(__markAsModule({}), module2, 1), cache && cache.set(module2, temp), temp);
  };
})(typeof WeakMap !== "undefined" ? /* @__PURE__ */ new WeakMap() : 0);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  AddressAutofill: () => AddressAutofill,
  AddressMinimap: () => AddressMinimap,
  Geocoder: () => Geocoder,
  SearchBox: () => SearchBox,
  config: () => import_search_js_web3.config,
  useAddressAutofillCore: () => useAddressAutofillCore,
  useConfirmAddress: () => useConfirmAddress,
  useEvented: () => useEvented,
  useGeocodingCore: () => useGeocodingCore,
  useMapboxAutofill: () => useAddressAutofillCore,
  useSearchBoxCore: () => useSearchBoxCore,
  useSearchSession: () => useSearchSession
});
var import_search_js_web2 = require("@mapbox/search-js-web");
var import_search_js_web3 = require("@mapbox/search-js-web");

// src/components/AddressAutofill.tsx
var import_react = __toESM(require("react"));
var AddressAutofill = import_react.default.forwardRef((props, refProp) => {
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
  const ref = (0, import_react.useRef)();
  (0, import_react.useImperativeHandle)(refProp, () => ({
    focus: () => {
      if (ref.current)
        return ref.current.focus();
      throw new Error("AddressAutofill is not mounted");
    }
  }));
  (0, import_react.useEffect)(() => {
    if (ref.current)
      ref.current.options = options;
  }, [ref.current, options]);
  (0, import_react.useEffect)(() => {
    if (ref.current)
      ref.current.interceptSearch = interceptSearch;
  }, [ref.current, options]);
  (0, import_react.useEffect)(() => {
    if (ref.current)
      ref.current.theme = theme;
  }, [ref.current, theme]);
  (0, import_react.useEffect)(() => {
    if (ref.current)
      ref.current.popoverOptions = popoverOptions;
  }, [ref.current, popoverOptions]);
  (0, import_react.useEffect)(() => {
    if (ref.current)
      ref.current.confirmOnBrowserAutofill = confirmOnBrowserAutofill;
  }, [ref.current, confirmOnBrowserAutofill]);
  (0, import_react.useEffect)(() => {
    if (ref.current)
      ref.current.browserAutofillEnabled = browserAutofillEnabled;
  }, [ref.current, browserAutofillEnabled]);
  (0, import_react.useEffect)(() => {
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
  (0, import_react.useEffect)(() => {
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
  (0, import_react.useEffect)(() => {
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
  (0, import_react.useEffect)(() => {
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
  (0, import_react.useEffect)(() => {
    if (ref.current)
      ref.current.accessToken = accessToken;
  }, [ref.current, accessToken]);
  return /* @__PURE__ */ import_react.default.createElement("mapbox-address-autofill", {
    ref
  }, children);
});

// src/components/SearchBox.tsx
var import_react2 = __toESM(require("react"));
var SearchBox = import_react2.default.forwardRef((props, refProp) => {
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
  const ref = (0, import_react2.useRef)();
  (0, import_react2.useImperativeHandle)(refProp, () => ({
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
  (0, import_react2.useEffect)(() => {
    if (ref.current)
      ref.current.options = options || {};
  }, [ref.current, options]);
  (0, import_react2.useEffect)(() => {
    if (ref.current)
      ref.current.componentOptions = componentOptions || {};
  }, [ref.current, componentOptions]);
  (0, import_react2.useEffect)(() => {
    if (ref.current)
      ref.current.interceptSearch = interceptSearch;
  }, [ref.current, interceptSearch]);
  (0, import_react2.useEffect)(() => {
    if (ref.current)
      ref.current.theme = theme;
  }, [ref.current, theme]);
  (0, import_react2.useEffect)(() => {
    if (ref.current)
      ref.current.popoverOptions = popoverOptions;
  }, [ref.current, popoverOptions]);
  (0, import_react2.useEffect)(() => {
    if (ref.current)
      ref.current.placeholder = placeholder;
  }, [ref.current, placeholder]);
  (0, import_react2.useEffect)(() => {
    if (ref.current)
      ref.current.value = value || "";
  }, [ref.current, value]);
  (0, import_react2.useEffect)(() => {
    const node = ref.current;
    if (!node)
      return;
    node.bindMap(map);
    return () => {
      node.unbindMap();
    };
  }, [ref.current, map]);
  (0, import_react2.useEffect)(() => {
    if (ref.current)
      ref.current.marker = marker;
  }, [ref.current, marker]);
  (0, import_react2.useEffect)(() => {
    if (ref.current)
      ref.current.mapboxgl = mapboxgl;
  }, [ref.current, mapboxgl]);
  (0, import_react2.useEffect)(() => {
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
  (0, import_react2.useEffect)(() => {
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
  (0, import_react2.useEffect)(() => {
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
  (0, import_react2.useEffect)(() => {
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
  (0, import_react2.useEffect)(() => {
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
  (0, import_react2.useEffect)(() => {
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
  (0, import_react2.useEffect)(() => {
    if (ref.current)
      ref.current.accessToken = accessToken;
  }, [ref.current, accessToken]);
  return /* @__PURE__ */ import_react2.default.createElement("mapbox-search-box", {
    ref
  });
});

// src/components/Geocoder.tsx
var import_react3 = __toESM(require("react"));
var Geocoder = import_react3.default.forwardRef((props, refProp) => {
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
  const ref = (0, import_react3.useRef)();
  (0, import_react3.useImperativeHandle)(refProp, () => ({
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
  (0, import_react3.useEffect)(() => {
    if (ref.current)
      ref.current.options = options || {};
  }, [ref.current, options]);
  (0, import_react3.useEffect)(() => {
    if (ref.current)
      ref.current.componentOptions = componentOptions || {};
  }, [ref.current, componentOptions]);
  (0, import_react3.useEffect)(() => {
    if (ref.current)
      ref.current.interceptSearch = interceptSearch;
  }, [ref.current, interceptSearch]);
  (0, import_react3.useEffect)(() => {
    if (ref.current)
      ref.current.theme = theme;
  }, [ref.current, theme]);
  (0, import_react3.useEffect)(() => {
    if (ref.current)
      ref.current.popoverOptions = popoverOptions;
  }, [ref.current, popoverOptions]);
  (0, import_react3.useEffect)(() => {
    if (ref.current)
      ref.current.placeholder = placeholder;
  }, [ref.current, placeholder]);
  (0, import_react3.useEffect)(() => {
    if (ref.current)
      ref.current.value = value || "";
  }, [ref.current, value]);
  (0, import_react3.useEffect)(() => {
    const node = ref.current;
    if (!node)
      return;
    node.bindMap(map);
    return () => {
      node.unbindMap();
    };
  }, [ref.current, map]);
  (0, import_react3.useEffect)(() => {
    if (ref.current)
      ref.current.marker = marker;
  }, [ref.current, marker]);
  (0, import_react3.useEffect)(() => {
    if (ref.current)
      ref.current.mapboxgl = mapboxgl;
  }, [ref.current, mapboxgl]);
  (0, import_react3.useEffect)(() => {
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
  (0, import_react3.useEffect)(() => {
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
  (0, import_react3.useEffect)(() => {
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
  (0, import_react3.useEffect)(() => {
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
  (0, import_react3.useEffect)(() => {
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
  (0, import_react3.useEffect)(() => {
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
  (0, import_react3.useEffect)(() => {
    if (ref.current)
      ref.current.accessToken = accessToken;
  }, [ref.current, accessToken]);
  return /* @__PURE__ */ import_react3.default.createElement("mapbox-geocoder", {
    ref
  });
});

// src/components/AddressMinimap.tsx
var import_react4 = __toESM(require("react"));
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
  const ref = (0, import_react4.useRef)();
  (0, import_react4.useEffect)(() => {
    if (!ref.current)
      return;
    if (show) {
      ref.current.show();
    } else {
      ref.current.hide();
    }
  }, [ref.current, show]);
  (0, import_react4.useEffect)(() => {
    if (ref.current)
      ref.current.theme = theme;
  }, [ref.current, theme]);
  (0, import_react4.useEffect)(() => {
    if (ref.current)
      ref.current.feature = show ? feature : null;
  }, [ref.current, feature, show]);
  (0, import_react4.useEffect)(() => {
    if (ref.current)
      ref.current.mapStyleMode = mapStyleMode;
  }, [ref.current, mapStyleMode]);
  (0, import_react4.useEffect)(() => {
    if (adjustBtnText === void 0)
      return;
    if (ref.current)
      ref.current.adjustBtnText = adjustBtnText;
  }, [ref.current, adjustBtnText]);
  (0, import_react4.useEffect)(() => {
    if (saveBtnText === void 0)
      return;
    if (ref.current)
      ref.current.saveBtnText = saveBtnText;
  }, [ref.current, saveBtnText]);
  (0, import_react4.useEffect)(() => {
    if (cancelBtnText === void 0)
      return;
    if (ref.current)
      ref.current.cancelBtnText = cancelBtnText;
  }, [ref.current, cancelBtnText]);
  (0, import_react4.useEffect)(() => {
    if (ref.current)
      ref.current.defaultMapStyle = defaultMapStyle;
  }, [ref.current, defaultMapStyle]);
  (0, import_react4.useEffect)(() => {
    if (footer === void 0)
      return;
    if (ref.current)
      ref.current.footer = footer;
  }, [ref.current, footer]);
  (0, import_react4.useEffect)(() => {
    if (ref.current)
      ref.current.accessToken = accessToken;
  }, [ref.current, accessToken]);
  (0, import_react4.useEffect)(() => {
    if (ref.current)
      ref.current.onSaveMarkerLocation = onSaveMarkerLocation;
  }, [ref.current, onSaveMarkerLocation]);
  return /* @__PURE__ */ import_react4.default.createElement("mapbox-address-minimap", {
    ref,
    "can-adjust-marker": canAdjustMarker,
    "keep-marker-centered": keepMarkerCentered,
    "marker-anchor": markerAnchor,
    "satellite-toggle": satelliteToggle
  });
}

// src/hooks/useEvented.tsx
var import_react5 = require("react");
function useEvented(evented, eventName, cb) {
  const cbRef = (0, import_react5.useRef)(cb);
  (0, import_react5.useEffect)(() => {
    cbRef.current = cb;
  });
  (0, import_react5.useEffect)(() => {
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
var import_react6 = require("react");
var import_search_js_core = require("@mapbox/search-js-core");
var DEFAULTS = import_search_js_core.AddressAutofillCore.defaults;
function useAddressAutofillCore(options) {
  const autofill = (0, import_react6.useMemo)(() => {
    return new import_search_js_core.AddressAutofillCore();
  }, []);
  (0, import_react6.useEffect)(() => {
    const _a = options, { accessToken } = _a, restOptions = __objRest(_a, ["accessToken"]);
    autofill.accessToken = accessToken;
    autofill.defaults = __spreadValues(__spreadValues({}, DEFAULTS), restOptions);
  }, [options]);
  return autofill;
}

// src/hooks/useSearchBoxCore.tsx
var import_react7 = require("react");
var import_search_js_core2 = require("@mapbox/search-js-core");
var DEFAULTS2 = import_search_js_core2.SearchBoxCore.defaults;
function useSearchBoxCore(options) {
  const search = (0, import_react7.useMemo)(() => {
    return new import_search_js_core2.SearchBoxCore();
  }, []);
  (0, import_react7.useEffect)(() => {
    const _a = options, { accessToken } = _a, restOptions = __objRest(_a, ["accessToken"]);
    search.accessToken = accessToken;
    search.defaults = __spreadValues(__spreadValues({}, DEFAULTS2), restOptions);
  }, [options]);
  return search;
}

// src/hooks/useGeocodingCore.tsx
var import_react8 = require("react");
var import_search_js_core3 = require("@mapbox/search-js-core");
function useGeocodingCore(options) {
  const search = (0, import_react8.useMemo)(() => {
    return new import_search_js_core3.GeocodingCore();
  }, []);
  (0, import_react8.useEffect)(() => {
    const _a = options, { accessToken } = _a, restOptions = __objRest(_a, ["accessToken"]);
    search.accessToken = accessToken;
    search.defaults = __spreadValues({}, restOptions);
  }, [options]);
  return search;
}

// src/hooks/useSearchSession.tsx
var import_search_js_core4 = require("@mapbox/search-js-core");
var import_react9 = require("react");
function useSearchSession(search) {
  const searchSession = (0, import_react9.useMemo)(() => {
    return new import_search_js_core4.SearchSession(search);
  }, [search]);
  if (search instanceof import_search_js_core4.SearchBoxCore) {
    return searchSession;
  } else if (search instanceof import_search_js_core4.GeocodingCore) {
    return searchSession;
  } else {
    return searchSession;
  }
}

// src/hooks/useConfirmAddress.tsx
var import_react10 = require("react");
var import_search_js_web = require("@mapbox/search-js-web");
function useConfirmAddress(optionsArg = {}) {
  const formRef = (0, import_react10.useRef)(null);
  return (0, import_react10.useMemo)(() => {
    return {
      formRef,
      showConfirm: () => (0, import_search_js_web.confirmAddress)(formRef.current, optionsArg)
    };
  }, [formRef, optionsArg]);
}
module.exports = __toCommonJS(src_exports);
//# sourceMappingURL=index-development.js.map
