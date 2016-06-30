import { REQUEST_PATCHES } from 'constants';
import { RECEIVE_PATCHES } from 'constants';

const initialState = {
  isFetching: false,
  items: []
};

const patches = (state = initialState, action) => {
  switch (action.type) {
    case REQUEST_PATCHES:
      return Object.assign({}, state, {
        isFetching: true
      })
    case RECEIVE_PATCHES:
      return Object.assign({}, state, {
        isFetching: false,
        items: action.patches
      })
    default:
      return state
  }
}

export default patches;