import React from 'react';
import Branch from 'components/common/Branch';
import MapArray from 'components/common/MapArray';
import Facet from 'components/Facet';

const DefaultContent = ({ theme, children, config }) =><div></div>;

export default ({ config, facets, theme, onReset, meta }) =>
<Branch condition={config.getIn(['view', 'stickyFilters'])} left={DefaultContent}>

  <div className={theme.header} display-if={!config.get('showFacetsTitle')}>
    <h5 className={theme.title}>
      { config.getIn(['facets', 'i18n', 'filters'], 'Filters') }
    </h5>
    <button
      className={theme.reset}
      display-if={meta.get('filters') && meta.get('filters').size}
      onClick={onReset}>
      { config.getIn(['facets', 'i18n', 'clearAll'], 'Clear all') }
    </button>
  </div>

  <MapArray
    theme={{ root: theme.facet }}
    array={facets}
    factory={Facet}
    config={config}
    keyAccessor={i => i.get('name')} />

</Branch>
