import 'core-js/features/promise';
import 'regenerator-runtime/runtime';

import loadJs from 'load-js';
import loadCss from './helpers/loadCss';
import log from './helpers/log';

if (window.__FINFIDY_PATH__) {
  __webpack_public_path__ = window.__FINFIDY_PATH__
}

// /**
//  * Load Dependencies
//  */
Promise.all(__webpack_require__.chunks.map(__webpack_require__.e)).then(() => {

if ((global as any).findify_initialized) return;
(global as any).findify_initialized = true;

const deps: Promise<any>[] = [
  import(/* webpackChunkName: "polyfill" */ './polyfill'),

  /** Main initialization file */
  import(/* webpackChunkName: "initializer" */ './initialize'),

  /**  Setup Sentry errors monitoring */
  import(/* webpackChunkName: "sentry" */ '@sentry/browser'),

  import(/* webpackChunkName: "agent" */ '@findify/agent'),

  /**  Prefetch components */
  import(
    /* webpackChunkName: "autocomplete" */
    '@findify/react-components/src/layouts/Autocomplete'
  ),

  import(
    /* webpackChunkName: "search" */
    '@findify/react-components/src/layouts/Search'
  ),

  import(
    /* webpackChunkName: "recommendation" */
    '@findify/react-components/src/layouts/Recommendation'
  )
];

/**
 * Split configuration to separated chunk
 * The real merchant configuration will be added there on Findify Compilation server
 * So we will load it by load.js ~_~
 */
if(process.env.NODE_ENV !== 'development') {
  deps.push(loadJs(__MERCHANT_CONFIG_URL__));
} else {
  deps.push(import(/* webpackChunkName: "config" */ './config'));
}

/** Load styles */
if (process.env.NODE_ENV !== 'development') {
  ((path) => {
    if (!path) return loadCss(__webpack_require__.p + 'styles.css');
    return loadCss(path);
  })(__MERCHANT_CSS__);
}

Promise
  .all(deps)
  .then(([_, initialize, sentry]) => {
    if (process.env.NODE_ENV !== 'development' && __SENTRY_ENABLED__ && sentry && sentry.init) {
      sentry.init({
        dsn: 'https://1db8972d9612483b96430ad56611be6e@sentry.io/5001329',
        version: __MERCHANT_VERSION__,
        environment: __ENVIRONMENT__,
        whitelistUrls: [__webpack_require__.p, 'https://findify-assets-2bveeb6u8ag.netdna-ssl.com']
      })
      sentry.configureScope(scope => 
        scope.setExtra('version', __MERCHANT_VERSION__)
      );
    }
    initialize.default({ key: __MERCHANT_API_KEY__ });
    log('ready', 'color: #3DBC88');
    log(`version: ${__MERCHANT_VERSION__}`);
  })
  .catch(e => {
    log('error', 'color: #D9463F');
    log(e.stack);
    Promise
    .all(deps)
    .then(([_, initialize]) => {
      initialize.default({ key: __MERCHANT_API_KEY__ });
    })
    .catch(e => {
      log('Please contact support team', 'color: #D9463F');
    })
  })
});
