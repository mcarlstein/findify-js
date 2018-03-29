import { compose, setDisplayName, withPropsOnChange, withHandlers } from "recompose";
import { connectSort } from '@findify/react-connect';
import withTheme from 'helpers/withTheme';
import { is } from 'immutable';

import view from './view';
import styles from './styles.css';

export default compose(
  setDisplayName('MobileSorting'),
  withTheme(styles),
  connectSort,
  withPropsOnChange(['config', 'selected'], ({ config, selected }) => {
    const labels = config.getIn(['sorting', 'i18n', 'options']);
    const items = config.getIn(['sorting', 'options']).map(i => i
      .set('label',
        labels.get([i.get('field'), i.get('order')].filter(i => i).join('|'))
      )
      .set('selected',
        (!selected && i.get('field') === 'default') ||
        !!selected &&
        is(i.get('order'), selected.get('order')) &&
        is(i.get('field'), selected.get('field'))
      )
    );
    return { items }
  }),

  withHandlers({
    setSorting: ({ items, onChangeSort }) => index =>
      onChangeSort(items.getIn([index, 'field']), items.getIn([index, 'order']))
  })
)(view)
