import createHistory from 'history/createBrowserHistory';
import { parse, stringify } from 'qs';
import {
  isString,
  isNumber,
  isEqual,
  identity,
  escape,
  unescape,
  isFunction,
  memoize,
  once,
} from 'lodash';

const history = createHistory();
const emptyObject = {};

const toString = state => stringify(state, { encode: encodeURIComponent });
const fromString = str =>
  parse(str, {
    decoder: str => {
      const value: any = decodeURIComponent(str);
      return isNaN(value) || !value || (value.length > 1 && value[0] === '0')
        ? value
        : parseFloat(value);
    },
  });

const reduceState = (state, keyFn, valueFn = identity) =>
  Object.keys(state).reduce((acc, key) => {
    const computedKey = keyFn(key);
    if (!computedKey) return acc;
    return { ...acc, [computedKey]: valueFn(state[key]) };
  }, emptyObject);

const parseOldQuery = string => {
  const query = /search\=\{(.*?)\}/g.exec(string);
  const { facets, ...rest } =
    (query && query[1] && fromString(decodeURIComponent(query[1]))) ||
    emptyObject;
  const filters =
    facets &&
    facets.reduce((acc, facet) => {
      const f = {
        ...facet,
        type: facet.type === 'terms' ? 'text' : facet.type,
        values:
          facet.type === 'range'
            ? facet.values
            : facet.values.map(value => ({ value })),
      };
      acc.push(f);
      return acc;
    }, []);
  return { ...rest, filters };
};

/**
 * Send google analytics events if url was changed
 */
if (!!global.ga || !!global._gaq) {
  const sendEventToGoogle = () => {
    const url = document.location.href;
    if (isFunction(global.ga)) return global.ga('send', 'pageview', url);
    if (isFunction(global._gaq))
      return global._gaq.push(['_trackPageview', url]);
  };

  history.listen(() => sendEventToGoogle);
}

class Location {
  collection = null;
  listen = history.listen;
  initialMeta = {
    offset: 0,
    limit: 24,
  };
  prefix = void 0;
  searchUrl = '/';
  getter: any = void 0;

  _getter(string) {
    if (/search=\{.*?\}/.test(string)) return parseOldQuery(string);
    const state = fromString(string);
    if (!this.prefix) return state;
    const prefix = this.prefix + '_';
    return reduceState(
      state,
      key => key.includes(prefix) && key.replace(prefix, ''),
    );
  }

  setter(state) {
    if (!this.prefix) return toString(state);
    const prefix = this.prefix + '_';
    return toString(reduceState(state, key => prefix + key));
  }

  constructor(config: any, hooks) {
    if (!config) return;

    if (hooks.location) {
      history.listen(() => hooks.location.onChange(this.state));
    }

    if (config.features.search && config.features.search.meta)
      this.initialMeta = config.features.search.meta;

    if (config.collections) {
      const normalizedPath = history.location.pathname
        .replace(/^\/|\/$/g, '')
        .toLowerCase();
      this.collection = config.collections.find(
        path => normalizedPath === path,
      );
    }

    this.getter =
      (config.location && config.location.getter) || memoize(this._getter);

    if (config.location) {
      if (config.location.setter) {
        this.setter = config.location.setter;
      }
      if (config.location.searchUrl) {
        this.searchUrl = config.location.searchUrl;
      }
      if (config.location.prefix) {
        this.prefix = config.location.prefix;
      }
    }
  }

  searchFor(q) {
    if (this.isSearchPage) {
      this.state = { ...this.initialMeta, q };
    } else {
      const state = this.setter({ ...this.initialMeta, q });
      this.navigate(`${this.searchUrl}?${state}`);
    }
  }

  navigate(href, target?) {
    if (target && target !== '_self') {
      const win = window.open(href, target);
      return win.focus();
    }
    return (window.location.href = href);
  }

  get pathname() {
    return history.location.pathname;
  }

  get search() {
    return history.location.search.replace('?', '');
  }

  get state() {
    if (!this.search) return {};
    return this.getter(this.search);
  }

  set state(state) {
    const search = this.setter(state);
    if (!isEqual(state, this.state)) {
      history.push({ search: `?${search}` });
    }
  }

  get isSearchPage() {
    return this.searchUrl === history.location.pathname;
  }
}

export default once((config, hooks) => new Location(config, hooks));