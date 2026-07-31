var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var __privateWrapper = (obj, member, setter, getter) => {
  return {
    set _(value) {
      __privateSet(obj, member, value, setter);
    },
    get _() {
      return __privateGet(obj, member, getter);
    }
  };
};
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/autofill/constants.ts
var SEARCH_URL = `https://api.mapbox.com/autofill/v1`;
var ENDPOINT_SUGGEST = "suggest";
var ENDPOINT_RETRIEVE = "retrieve";
var SUGGEST_URL = `${SEARCH_URL}/${ENDPOINT_SUGGEST}`;
var RETRIEVE_URL = `${SEARCH_URL}/${ENDPOINT_RETRIEVE}`;

// src/LngLat.ts
var LngLat = class {
  constructor(lng, lat) {
    if (isNaN(lng) || isNaN(lat)) {
      throw new Error(`Invalid LngLat object: (${lng}, ${lat})`);
    }
    this.lng = +lng;
    this.lat = +lat;
    if (this.lat > 90 || this.lat < -90) {
      throw new Error("Invalid LngLat latitude value: must be between -90 and 90");
    }
    if (this.lng > 180 || this.lng < -180) {
      throw new Error("Invalid LngLat longitude value: must be between -180 and 180");
    }
  }
  toArray() {
    return [this.lng, this.lat];
  }
  toString() {
    return `LngLat(${this.lng}, ${this.lat})`;
  }
  static convert(input) {
    if (input instanceof LngLat) {
      return new LngLat(input.lng, input.lat);
    }
    if (Array.isArray(input) && input.length === 2) {
      return new LngLat(Number(input[0]), Number(input[1]));
    }
    if (!Array.isArray(input) && typeof input == "object" && input !== null && ("lng" in input || "lon" in input) && "lat" in input) {
      return new LngLat(Number("lng" in input ? input.lng : input.lon), Number(input.lat));
    }
    throw new Error("`LngLatLike` argument must be specified as an object {lng: <lng>, lat: <lat>}, an object {lon: <lng>, lat: <lat>}, or an array of [<lng>, <lat>]");
  }
};

// src/LngLatBounds.ts
var LngLatBounds = class {
  constructor(sw, ne) {
    this._sw = LngLat.convert(sw);
    this._ne = LngLat.convert(ne);
  }
  getSouthWest() {
    return this._sw;
  }
  getNorthEast() {
    return this._ne;
  }
  getNorthWest() {
    return new LngLat(this.getWest(), this.getNorth());
  }
  getSouthEast() {
    return new LngLat(this.getEast(), this.getSouth());
  }
  getWest() {
    return this._sw.lng;
  }
  getSouth() {
    return this._sw.lat;
  }
  getEast() {
    return this._ne.lng;
  }
  getNorth() {
    return this._ne.lat;
  }
  toArray() {
    return [this._sw.toArray(), this._ne.toArray()];
  }
  toFlatArray() {
    return [this._sw.lng, this._sw.lat, this._ne.lng, this._ne.lat];
  }
  toString() {
    return `LngLatBounds(${this._sw.toString()}, ${this._ne.toString()})`;
  }
  static convert(input) {
    if (!input) {
      throw new Error("Invalid LngLatBounds convert value: falsy");
    }
    if (input instanceof LngLatBounds) {
      return new LngLatBounds(input.getSouthWest(), input.getNorthEast());
    }
    if (Array.isArray(input) && input.length === 2) {
      return new LngLatBounds(LngLat.convert(input[0]), LngLat.convert(input[1]));
    }
    if (Array.isArray(input) && input.length === 4) {
      return new LngLatBounds(LngLat.convert([input[0], input[1]]), LngLat.convert([input[2], input[3]]));
    }
    throw new Error("`LngLatBoundsLike` argument must be specified as an array [<LngLatLike>, <LngLatLike>] or an array [<west>, <south>, <east>, <north>]");
  }
};

// src/utils/uuid.ts
function generateUUID() {
  const randomString = Math.random().toString(16) + Date.now().toString(16) + Math.random().toString(16);
  const uuidString = randomString.replace(/\./g, "");
  const uuid = [
    uuidString.slice(0, 8),
    uuidString.slice(8, 12),
    "4" + uuidString.slice(12, 15) + "-8" + uuidString.slice(15, 18),
    uuidString.slice(18, 30)
  ].join("-");
  return uuid;
}

// src/SessionToken.ts
var SessionToken = class {
  constructor(id) {
    this.id = id != null ? id : generateUUID();
  }
  toString() {
    return this.id;
  }
  static convert(token) {
    return new SessionToken(token instanceof SessionToken ? token.id : token.toString());
  }
};

// src/MapboxError.ts
var UNKNOWN_ERROR = "Unknown error";
var MapboxError = class extends Error {
  constructor(json, statusCode) {
    super(String(json.message || json.error || UNKNOWN_ERROR));
    this.name = "MapboxError";
    this.statusCode = statusCode;
  }
  toString() {
    return `${this.name} (${this.statusCode}): ${this.message}`;
  }
};
function handleNonOkRes(res) {
  return __async(this, null, function* () {
    if (!res.ok) {
      const json = yield res.json();
      throw new MapboxError(json, res.status);
    }
  });
}

// src/fetch.ts
var _fetchImpl = globalThis.fetch;
var _abortControllerImpl = globalThis.AbortController;
function polyfillFetch({ fetch, AbortController }, force = false) {
  if (!fetch) {
    throw new Error("Fetch implementation must include implementations of `fetch`.");
  }
  if (_fetchImpl && !force) {
    return;
  }
  _fetchImpl = fetch;
  _abortControllerImpl = AbortController;
}
function getFetch() {
  if (!_fetchImpl) {
    throw new Error("Fetch implementation not found. Please include a fetch polyfill in your application or use `polyfillFetch` from `@mapbox/search-js-core` to fix this issue.");
  }
  return {
    fetch: _fetchImpl,
    AbortController: _abortControllerImpl
  };
}

// src/utils/queryParams.ts
function queryParams(...objects) {
  const params = [];
  for (const obj of objects) {
    if (!obj)
      continue;
    const entries = Object.entries(obj);
    for (const [key, value] of entries) {
      if (value == null)
        continue;
      params.push(`${key}=${encodeURIComponent(String(value))}`);
    }
  }
  return params.join("&");
}

// src/autofill/AddressAutofillCore.ts
var _responseHeaders, _getQueryParams, getQueryParams_fn;
var _AddressAutofillCore = class {
  constructor(options = {}) {
    __privateAdd(this, _getQueryParams);
    __privateAdd(this, _responseHeaders, void 0);
    const _a = options, { accessToken } = _a, defaults = __objRest(_a, ["accessToken"]);
    this.accessToken = accessToken;
    this.defaults = __spreadValues(__spreadValues({}, _AddressAutofillCore.defaults), defaults);
  }
  get responseHeaders() {
    return __privateGet(this, _responseHeaders);
  }
  suggest(searchText, optionsArg) {
    return __async(this, null, function* () {
      if (!searchText) {
        throw new Error("searchText is required");
      }
      const { sessionToken, signal } = optionsArg;
      const options = __spreadProps(__spreadValues(__spreadValues({}, this.defaults), optionsArg), {
        sessionToken
      });
      const url = new URL(`${SUGGEST_URL}/${encodeURIComponent(searchText)}`);
      url.search = __privateMethod(this, _getQueryParams, getQueryParams_fn).call(this, options);
      const { fetch } = getFetch();
      const res = yield fetch(url.toString(), {
        signal
      });
      __privateSet(this, _responseHeaders, res.headers);
      yield handleNonOkRes(res);
      const json = yield res.json();
      return __spreadProps(__spreadValues({}, json), {
        suggestions: json.suggestions.map((suggestion) => {
          return __spreadProps(__spreadValues({}, suggestion), {
            original_search_text: searchText,
            _source: "mapbox"
          });
        }),
        url: url.toString()
      });
    });
  }
  retrieve(suggestion, optionsArg) {
    return __async(this, null, function* () {
      if (!suggestion) {
        throw new Error("suggestion is required");
      }
      if (!this.canRetrieve(suggestion)) {
        throw new Error("suggestion cannot be retrieved");
      }
      const { sessionToken: sessionTokenLike, signal } = optionsArg;
      const sessionToken = SessionToken.convert(sessionTokenLike);
      const url = new URL(`${RETRIEVE_URL}/${suggestion.action.id}`);
      url.search = queryParams({
        access_token: this.accessToken,
        session_token: sessionToken.id
      });
      const { fetch } = getFetch();
      const res = yield fetch(url.toString(), { signal });
      yield handleNonOkRes(res);
      const json = yield res.json();
      json.url = url.toString();
      return json;
    });
  }
  canRetrieve(suggestion) {
    const action = suggestion.action;
    return typeof (action == null ? void 0 : action.id) === "string";
  }
};
var AddressAutofillCore = _AddressAutofillCore;
_responseHeaders = new WeakMap();
_getQueryParams = new WeakSet();
getQueryParams_fn = function(options) {
  return queryParams({
    types: "address",
    access_token: this.accessToken,
    streets: options.streets,
    language: options.language,
    country: options.country,
    limit: options.limit
  }, options.sessionToken && {
    session_token: SessionToken.convert(options.sessionToken).id
  }, options.proximity && {
    proximity: typeof options.proximity === "string" ? options.proximity : LngLat.convert(options.proximity).toArray().join(",")
  }, options.bbox && {
    bbox: typeof options.bbox === "string" ? options.bbox : LngLatBounds.convert(options.bbox).toFlatArray().join(",")
  });
};
AddressAutofillCore.defaults = {
  language: "en",
  proximity: "ip",
  streets: true
};

// src/searchbox/constants.ts
var SEARCH_URL2 = `https://api.mapbox.com/search/searchbox/v1`;
var ENDPOINT_SUGGEST2 = "suggest";
var ENDPOINT_RETRIEVE2 = "retrieve";
var ENDPOINT_CATEGORY = "category";
var ENDPOINT_REVERSE = "reverse";
var SUGGEST_URL2 = `${SEARCH_URL2}/${ENDPOINT_SUGGEST2}`;
var RETRIEVE_URL2 = `${SEARCH_URL2}/${ENDPOINT_RETRIEVE2}`;
var CATEGORY_URL = `${SEARCH_URL2}/${ENDPOINT_CATEGORY}`;
var REVERSE_URL = `${SEARCH_URL2}/${ENDPOINT_REVERSE}`;

// src/constants.ts
var decimalWithNoLeadingDigits = "\\.\\d{1,256}";
var integerWithOptionalDecimal = `\\d{1,3}(${decimalWithNoLeadingDigits})?`;
var singleCoordinate = `(-?(${integerWithOptionalDecimal}|${decimalWithNoLeadingDigits}))`;
var COORDINATE_QUERY_REGEX = new RegExp(`^[ ]*${singleCoordinate},\\s*${singleCoordinate}[ ]*$`);
var SPACES_OR_COMMA_REGEX = /[\s,]+/;

// src/searchbox/SearchBoxCore.ts
var _getQueryParams2, getQueryParams_fn2, _convertReverseResponsetoSuggestionResponse, convertReverseResponsetoSuggestionResponse_fn, _convertSearchBoxFeaturetoSuggestion, convertSearchBoxFeaturetoSuggestion_fn;
var _SearchBoxCore = class {
  constructor(options = {}) {
    __privateAdd(this, _getQueryParams2);
    __privateAdd(this, _convertReverseResponsetoSuggestionResponse);
    __privateAdd(this, _convertSearchBoxFeaturetoSuggestion);
    const _a = options, { accessToken } = _a, defaults = __objRest(_a, ["accessToken"]);
    this.accessToken = accessToken;
    this.defaults = __spreadValues(__spreadValues({}, _SearchBoxCore.defaults), defaults);
  }
  suggest(searchText, optionsArg) {
    return __async(this, null, function* () {
      var _a;
      if (!searchText) {
        throw new Error("searchText is required");
      }
      const isReverseQuery = COORDINATE_QUERY_REGEX.test(searchText);
      if (isReverseQuery && optionsArg.allowReverse) {
        let coordinates = searchText.trim().split(SPACES_OR_COMMA_REGEX).map((part) => part.trim());
        if (optionsArg.flipCoordinates) {
          coordinates = coordinates.reverse();
        }
        const coordinatesString = coordinates.join(",");
        const reverseResponse = yield this.reverse(coordinatesString, optionsArg);
        return __privateMethod(this, _convertReverseResponsetoSuggestionResponse, convertReverseResponsetoSuggestionResponse_fn).call(this, reverseResponse);
      }
      const { sessionToken, signal } = optionsArg;
      const options = __spreadProps(__spreadValues(__spreadValues({}, this.defaults), optionsArg), {
        q: searchText,
        sessionToken
      });
      if (options.eta_type && (!options.origin || !options.navigation_profile)) {
        throw new Error("to provide eta estimate: eta, navigation_profile, and origin are required");
      }
      if (options.origin && !options.navigation_profile) {
        throw new Error("to provide distance estimate: both navigation_profile and origin are required");
      }
      const url = new URL(SUGGEST_URL2);
      url.search = __privateMethod(this, _getQueryParams2, getQueryParams_fn2).call(this, options);
      const { fetch } = getFetch();
      const res = yield fetch(url.toString(), {
        signal
      });
      yield handleNonOkRes(res);
      const json = yield res.json();
      json.url = url.toString();
      (_a = json.suggestions) == null ? void 0 : _a.forEach((suggestion) => {
        suggestion._source = "mapbox";
      });
      return json;
    });
  }
  retrieve(suggestion, optionsArg) {
    return __async(this, null, function* () {
      if (!suggestion) {
        throw new Error("suggestion is required");
      }
      if (suggestion._originalFeature) {
        const retrieveResponse = {
          type: "FeatureCollection",
          features: [suggestion._originalFeature],
          url: suggestion._originalUrl || ""
        };
        return retrieveResponse;
      }
      if (suggestion._geometry) {
        const retrieveResponse = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: suggestion,
              geometry: suggestion._geometry
            }
          ]
        };
        return retrieveResponse;
      }
      const { sessionToken: sessionTokenLike, signal, language } = optionsArg;
      const sessionToken = SessionToken.convert(sessionTokenLike);
      const options = __spreadValues(__spreadValues({}, this.defaults), language && { language });
      const url = new URL(`${RETRIEVE_URL2}/${encodeURIComponent(suggestion.mapbox_id)}`);
      url.search = queryParams({
        access_token: this.accessToken,
        session_token: sessionToken.id
      }, { language: options.language });
      const { fetch } = getFetch();
      const res = yield fetch(url.toString(), {
        signal
      });
      yield handleNonOkRes(res);
      const json = yield res.json();
      json.url = url.toString();
      return json;
    });
  }
  category(_0) {
    return __async(this, arguments, function* (category, optionsArg = {}) {
      if (!category) {
        throw new Error("category is required");
      }
      const options = __spreadValues(__spreadValues({}, this.defaults), optionsArg);
      const url = new URL(`${CATEGORY_URL}/${encodeURIComponent(category)}`);
      url.search = __privateMethod(this, _getQueryParams2, getQueryParams_fn2).call(this, options);
      const { fetch } = getFetch();
      const res = yield fetch(url.toString(), {
        signal: options.signal
      });
      yield handleNonOkRes(res);
      const json = yield res.json();
      json.url = url.toString();
      return json;
    });
  }
  reverse(_0) {
    return __async(this, arguments, function* (lngLat, optionsArg = {}) {
      var _a;
      if (!lngLat) {
        throw new Error("lngLat is required");
      }
      const [lng, lat] = typeof lngLat === "string" ? lngLat.split(",").map((x) => parseFloat(x)) : LngLat.convert(lngLat).toArray();
      if (isNaN(lng) || isNaN(lat)) {
        throw new Error("lngLat is required");
      }
      const options = __spreadValues(__spreadValues({}, this.defaults), optionsArg);
      const url = new URL(REVERSE_URL);
      url.search = queryParams({
        access_token: this.accessToken,
        language: options.language,
        limit: options.limit,
        longitude: lng,
        latitude: lat
      }, options.types && {
        types: typeof options.types === "string" ? options.types : [...options.types].join(",")
      });
      const { fetch } = getFetch();
      const res = yield fetch(url.toString(), {
        signal: options.signal
      });
      yield handleNonOkRes(res);
      const json = yield res.json();
      json.url = url.toString();
      (_a = json.features) == null ? void 0 : _a.forEach((feature) => {
        feature._source = "mapbox";
      });
      return json;
    });
  }
};
var SearchBoxCore = _SearchBoxCore;
_getQueryParams2 = new WeakSet();
getQueryParams_fn2 = function(options) {
  return queryParams({
    q: options.q,
    access_token: this.accessToken,
    language: options.language,
    limit: options.limit,
    navigation_profile: options.navigation_profile,
    route: options.route,
    route_geometry: options.route_geometry,
    sar_type: options.sar_type,
    time_deviation: options.time_deviation,
    eta_type: options.eta_type,
    country: options.country,
    poi_category: options.poi_category,
    rich_metadata_provider: options.rich_metadata_provider,
    poi_category_exclusions: options.poi_category_exclusions
  }, options.sessionToken && {
    session_token: SessionToken.convert(options.sessionToken).id
  }, options.proximity && {
    proximity: typeof options.proximity === "string" ? options.proximity : LngLat.convert(options.proximity).toArray().join(",")
  }, options.origin && {
    origin: typeof options.origin === "string" ? options.origin : LngLat.convert(options.origin).toArray().join(",")
  }, options.bbox && {
    bbox: typeof options.bbox === "string" ? options.bbox : LngLatBounds.convert(options.bbox).toFlatArray().join(",")
  }, options.types && {
    types: typeof options.types === "string" ? options.types : [...options.types].join(",")
  });
};
_convertReverseResponsetoSuggestionResponse = new WeakSet();
convertReverseResponsetoSuggestionResponse_fn = function(response) {
  return {
    suggestions: response.features.map((feature) => {
      return __privateMethod(this, _convertSearchBoxFeaturetoSuggestion, convertSearchBoxFeaturetoSuggestion_fn).call(this, feature, response.url);
    }),
    attribution: response.attribution,
    url: response.url
  };
};
_convertSearchBoxFeaturetoSuggestion = new WeakSet();
convertSearchBoxFeaturetoSuggestion_fn = function(feature, responseUrl) {
  return __spreadProps(__spreadValues({}, feature.properties), {
    _originalFeature: feature,
    _originalUrl: responseUrl,
    _source: feature._source
  });
};
SearchBoxCore.defaults = {
  language: "en"
};

// src/validate/constants.ts
var SEARCH_URL3 = `https://api.mapbox.com/autofill/v1`;
var ENDPOINT_VALIDATE = "retrieve";
var VALIDATE_URL = `${SEARCH_URL3}/${ENDPOINT_VALIDATE}`;

// src/validate/ValidationCore.ts
var _getQueryParams3, getQueryParams_fn3;
var _ValidationCore = class {
  constructor(options = {}) {
    __privateAdd(this, _getQueryParams3);
    const _a = options, { accessToken } = _a, defaults = __objRest(_a, ["accessToken"]);
    this.accessToken = accessToken;
    this.defaults = __spreadValues(__spreadValues({}, _ValidationCore.defaults), defaults);
  }
  validate(searchText, optionsArg) {
    return __async(this, null, function* () {
      if (!searchText) {
        throw new Error("searchText is required");
      }
      const { sessionToken, signal } = optionsArg;
      const options = __spreadProps(__spreadValues(__spreadValues({}, this.defaults), optionsArg), {
        sessionToken
      });
      const url = new URL(`${VALIDATE_URL}/${encodeURIComponent(searchText)}`);
      url.search = __privateMethod(this, _getQueryParams3, getQueryParams_fn3).call(this, options);
      const { fetch } = getFetch();
      const res = yield fetch(url.toString(), {
        signal
      });
      yield handleNonOkRes(res);
      const json = yield res.json();
      json.url = url.toString();
      if (json.features.length > 0) {
        json.features = [json.features[0]];
      }
      return json;
    });
  }
};
var ValidationCore = _ValidationCore;
_getQueryParams3 = new WeakSet();
getQueryParams_fn3 = function(options) {
  return queryParams({
    access_token: this.accessToken,
    language: options.language,
    country: options.country
  }, options.sessionToken && {
    session_token: SessionToken.convert(options.sessionToken).id
  }, options.proximity && {
    proximity: typeof options.proximity === "string" ? options.proximity : LngLat.convert(options.proximity).toArray().join(",")
  }, options.bbox && {
    bbox: typeof options.bbox === "string" ? options.bbox : LngLatBounds.convert(options.bbox).toFlatArray().join(",")
  });
};
ValidationCore.defaults = {
  language: "en",
  proximity: "ip"
};

// src/geocode/constants.ts
var BASE_URL = `https://api.mapbox.com/search/geocode/v6`;
var FORWARD_URL = `${BASE_URL}/forward`;
var REVERSE_URL2 = `${BASE_URL}/reverse`;
var BATCH_URL = `${BASE_URL}/batch`;

// src/geocode/GeocodingCore.ts
var _responseHeaders2, _getQueryParams4, getQueryParams_fn4;
var GeocodingCore = class {
  constructor(options = {}) {
    __privateAdd(this, _getQueryParams4);
    __privateAdd(this, _responseHeaders2, void 0);
    const _a = options, { accessToken } = _a, defaults = __objRest(_a, ["accessToken"]);
    this.accessToken = accessToken;
    this.defaults = __spreadValues({}, defaults);
  }
  get responseHeaders() {
    return __privateGet(this, _responseHeaders2);
  }
  forward(searchText, optionsArg) {
    return __async(this, null, function* () {
      var _a;
      if (!searchText) {
        throw new Error("searchText is required");
      }
      let signal;
      if (optionsArg) {
        ({ signal } = optionsArg);
      }
      const options = __spreadProps(__spreadValues(__spreadValues({}, this.defaults), optionsArg), {
        q: searchText
      });
      const url = new URL(`${FORWARD_URL}`);
      url.search = __privateMethod(this, _getQueryParams4, getQueryParams_fn4).call(this, options);
      const { fetch } = getFetch();
      const fetchInit = signal ? { signal } : {};
      const res = yield fetch(url.toString(), fetchInit);
      __privateSet(this, _responseHeaders2, res.headers);
      yield handleNonOkRes(res);
      const json = yield res.json();
      json.url = url.toString();
      (_a = json.features) == null ? void 0 : _a.forEach((feature) => {
        feature._source = "mapbox";
      });
      return json;
    });
  }
  reverse(lngLat, optionsArg) {
    return __async(this, null, function* () {
      var _a;
      if (!lngLat) {
        throw new Error("lngLat is required");
      }
      let signal;
      if (optionsArg) {
        ({ signal } = optionsArg);
      }
      let lngLatObj;
      if (typeof lngLat === "string") {
        const [lng, lat] = lngLat.split(",");
        lngLatObj = new LngLat(Number(lng), Number(lat));
      } else {
        lngLatObj = LngLat.convert(lngLat);
      }
      const options = __spreadProps(__spreadValues(__spreadValues({}, this.defaults), optionsArg), {
        longitude: lngLatObj.lng,
        latitude: lngLatObj.lat
      });
      const url = new URL(`${REVERSE_URL2}`);
      url.search = __privateMethod(this, _getQueryParams4, getQueryParams_fn4).call(this, options, true);
      const { fetch } = getFetch();
      const fetchInit = signal ? { signal } : {};
      const res = yield fetch(url.toString(), fetchInit);
      __privateSet(this, _responseHeaders2, res.headers);
      yield handleNonOkRes(res);
      const json = yield res.json();
      json.url = url.toString();
      (_a = json.features) == null ? void 0 : _a.forEach((feature) => {
        feature._source = "mapbox";
      });
      return json;
    });
  }
  suggest(searchText, optionsArg) {
    return __async(this, null, function* () {
      const isReverseQuery = COORDINATE_QUERY_REGEX.test(searchText);
      if (isReverseQuery) {
        let coordinates = searchText.trim().split(SPACES_OR_COMMA_REGEX).map((part) => part.trim());
        if (optionsArg.flipCoordinates) {
          coordinates = coordinates.reverse();
        }
        const coordinatesString = coordinates.join(",");
        return this.reverse(coordinatesString, optionsArg);
      } else {
        return this.forward(searchText, optionsArg);
      }
    });
  }
  retrieve(suggestion) {
    return __async(this, null, function* () {
      return suggestion;
    });
  }
};
_responseHeaders2 = new WeakMap();
_getQueryParams4 = new WeakSet();
getQueryParams_fn4 = function(options, isReverse = false) {
  if (isReverse) {
    ["proximity", "autocomplete", "bbox"].forEach((key) => {
      if (key in options) {
        delete options[key];
      }
    });
  }
  return queryParams({
    q: options.q,
    longitude: options.longitude,
    latitude: options.latitude,
    access_token: this.accessToken,
    permanent: options.permanent,
    language: options.language,
    country: options.country,
    limit: options.limit,
    autocomplete: options.autocomplete,
    worldview: options.worldview
  }, options.sessionToken && {
    session_token: SessionToken.convert(options.sessionToken).id
  }, options.proximity && {
    proximity: typeof options.proximity === "string" ? options.proximity : LngLat.convert(options.proximity).toArray().join(",")
  }, options.bbox && {
    bbox: typeof options.bbox === "string" ? options.bbox : LngLatBounds.convert(options.bbox).toFlatArray().join(",")
  }, options.types && {
    types: typeof options.types === "string" ? options.types : [...options.types].join(",")
  });
};

// src/types.ts
var MatchCodeType = /* @__PURE__ */ ((MatchCodeType2) => {
  MatchCodeType2["matched"] = "matched";
  MatchCodeType2["unmatched"] = "unmatched";
  MatchCodeType2["plausible"] = "plausible";
  MatchCodeType2["not_applicable"] = "not_applicable";
  MatchCodeType2["inferred"] = "inferred";
  return MatchCodeType2;
})(MatchCodeType || {});
var MatchCodeConfidence = /* @__PURE__ */ ((MatchCodeConfidence2) => {
  MatchCodeConfidence2["exact"] = "exact";
  MatchCodeConfidence2["high"] = "high";
  MatchCodeConfidence2["medium"] = "medium";
  MatchCodeConfidence2["low"] = "low";
  return MatchCodeConfidence2;
})(MatchCodeConfidence || {});

// src/utils/Evented.ts
var _listeners;
var Evented = class {
  constructor() {
    __privateAdd(this, _listeners, {});
  }
  addEventListener(type, listener) {
    const listenersArr = __privateGet(this, _listeners);
    if (!listenersArr[type]) {
      listenersArr[type] = [];
    }
    listenersArr[type].push(listener);
  }
  removeEventListener(type, listener) {
    const listenersArr = __privateGet(this, _listeners);
    if (!listenersArr[type]) {
      return;
    }
    const listeners = listenersArr[type];
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }
  fire(type, arg0) {
    const listenersArr = __privateGet(this, _listeners);
    if (!listenersArr[type]) {
      return;
    }
    const listeners = listenersArr[type];
    for (const listener of listeners) {
      listener(arg0);
    }
  }
};
_listeners = new WeakMap();

// src/utils/debounce.ts
function debounce(func, wait, signalFn) {
  let timeout = null;
  return (...args) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    const signal = signalFn && signalFn();
    timeout = setTimeout(() => {
      timeout = null;
      if (signal == null ? void 0 : signal.aborted) {
        return;
      }
      func(...args);
    }, wait);
  };
}

// src/SearchSession.ts
function createAbortController() {
  const { AbortController } = getFetch();
  return new AbortController();
}
var _sessionTokenBase, _sessionIncrementer, _sessionTokenCustom, _suggestions, _abort, _suggestDebounce;
var SearchSession = class extends Evented {
  constructor(search, wait = 0) {
    super();
    __privateAdd(this, _sessionTokenBase, new SessionToken());
    __privateAdd(this, _sessionIncrementer, 0);
    __privateAdd(this, _sessionTokenCustom, false);
    __privateAdd(this, _suggestions, void 0);
    __privateAdd(this, _abort, createAbortController());
    __privateAdd(this, _suggestDebounce, void 0);
    __privateSet(this, _suggestDebounce, debounce((_0, ..._1) => __async(this, [_0, ..._1], function* (searchText, options = {}) {
      __privateGet(this, _abort).abort();
      __privateSet(this, _abort, createAbortController());
      if (!searchText) {
        __privateSet(this, _suggestions, null);
        this.fire("suggest", __privateGet(this, _suggestions));
        return;
      }
      try {
        const res = yield this.search.suggest(searchText, __spreadProps(__spreadValues({
          sessionToken: this.sessionToken
        }, options), {
          signal: __privateGet(this, _abort).signal
        }));
        __privateSet(this, _suggestions, res);
        this.fire("suggest", res);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }
        this.fire("suggesterror", err);
      }
    }), wait, () => __privateGet(this, _abort).signal));
    Object.defineProperties(this, {
      search: {
        value: search,
        writable: false
      },
      debounce: {
        value: wait,
        writable: false
      }
    });
  }
  get sessionToken() {
    if (__privateGet(this, _sessionTokenCustom)) {
      return __privateGet(this, _sessionTokenBase).id;
    }
    return `${__privateGet(this, _sessionTokenBase).id}.${__privateGet(this, _sessionIncrementer)}`;
  }
  set sessionToken(token) {
    __privateSet(this, _sessionTokenCustom, true);
    __privateSet(this, _sessionTokenBase, new SessionToken(token));
  }
  get suggestions() {
    return __privateGet(this, _suggestions);
  }
  suggest(searchText, options) {
    __privateGet(this, _suggestDebounce).call(this, searchText, options);
    return new Promise((resolve, reject) => {
      let suggestFn;
      let suggestErrorFn;
      suggestFn = (res) => {
        this.removeEventListener("suggest", suggestFn);
        this.removeEventListener("suggesterror", suggestErrorFn);
        resolve(res);
      };
      suggestErrorFn = (err) => {
        this.removeEventListener("suggest", suggestFn);
        this.removeEventListener("suggesterror", suggestErrorFn);
        reject(err);
      };
      this.addEventListener("suggest", suggestFn);
      this.addEventListener("suggesterror", suggestErrorFn);
    });
  }
  clear() {
    this.suggest("");
  }
  retrieve(suggestion, options) {
    return __async(this, null, function* () {
      const res = yield this.search.retrieve(suggestion, __spreadValues({
        sessionToken: this.sessionToken
      }, options));
      this.fire("retrieve", res);
      return res;
    });
  }
  canRetrieve(suggestion) {
    if (!this.search.canRetrieve) {
      return true;
    }
    return this.search.canRetrieve(suggestion);
  }
  canSuggest(suggestion) {
    if (!this.search.canSuggest) {
      return true;
    }
    return this.search.canSuggest(suggestion);
  }
  abort() {
    __privateGet(this, _abort).abort();
    __privateSet(this, _abort, createAbortController());
  }
  incrementSession() {
    __privateWrapper(this, _sessionIncrementer)._++;
  }
};
_sessionTokenBase = new WeakMap();
_sessionIncrementer = new WeakMap();
_sessionTokenCustom = new WeakMap();
_suggestions = new WeakMap();
_abort = new WeakMap();
_suggestDebounce = new WeakMap();

// src/featureToSuggestion.ts
function featureToSuggestion(feature) {
  const { properties } = feature;
  return __spreadValues({}, properties);
}
export {
  AddressAutofillCore,
  Evented,
  GeocodingCore,
  LngLat,
  LngLatBounds,
  AddressAutofillCore as MapboxAutofill,
  MapboxError,
  GeocodingCore as MapboxGeocode,
  ValidationCore as MapboxValidate,
  MatchCodeConfidence,
  MatchCodeType,
  SearchBoxCore,
  SearchSession,
  SessionToken,
  ValidationCore,
  debounce,
  featureToSuggestion,
  polyfillFetch
};
//# sourceMappingURL=index-esm.js.map
