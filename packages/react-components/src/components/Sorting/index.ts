import { connectSort } from '@findify/react-connect';
import { compose, withPropsOnChange, setDisplayName, withHandlers } from 'recompose';
import withTheme from 'helpers/withTheme';
import { is } from 'immutable';

import view from './view';
import styles from './styles.css';

export default compose(
  setDisplayName('Sorting'),
  withTheme(styles),
  connectSort,
  withPropsOnChange(['config'], ({ config, selected }) => {
    const labels = config.getIn(['sorting', 'i18n', 'options']);
    const items = config.getIn(['sorting', 'options']).map(i =>
      i.set('label', labels.get([i.get('field'), i.get('order')].filter(i => i).join('|')))
    );
    return { items }
  }),
  withPropsOnChange(['selected'], ({ items, selected }) => ({
    selectedItem: selected && items.find(i =>
      is(i.get('order'), selected.get('order')) &&
      is(i.get('field'), selected.get('field'))
    )
  })),
  withHandlers({
    onChangeSort: ({ onChangeSort }) => item => 
      item.get('field') === 'default'
      ? onChangeSort()
      : onChangeSort(item.get('field'), item.get('order'))
  })
)(view);
