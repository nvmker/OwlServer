import fetch from 'isomorphic-fetch';
import { getScript } from 'utils';
import { 
  API_END_POINT,
  REQUEST_PATCHES,
  RECEIVE_PATCHES,
  REQUEST_AUTHORS,
  RECEIVE_AUTHORS,
  REQUEST_TAGS,
  RECEIVE_TAGS,
  REQUEST_PATCH_DETAILS,
  RECEIVE_PATCH_DETAILS,
  SET_PATCHLIST_TOP_FILTER,
  TOGGLE_FILTER_IN_SUB_FILTER,
  RESET_PATCHLIST_SUB_FILTER,
  REQUEST_CURRENT_USER,
  RECEIVE_CURRENT_USER,
  RECEIVE_PATCHES_AUTHORS_TAGS,
  REQUEST_PATCH_JAVASCRIPT,
  LOADED_PATCH_JAVASCRIPT
} from 'constants';

export const fetchPatches = () => {
  return (dispatch) => {
    dispatch({
      type: REQUEST_PATCHES
    });

    return fetch( API_END_POINT + '/patches/')
      .then(response => {
        return response.json();
      })
      .then( response => {
          if (response.status >= 400) {
            console.error('bad status:', response.status);
          } else {
            dispatch({
              type: RECEIVE_PATCHES,
              patches: response.result
            });
          }
        },
        (err) => {
          console.error(err);
        }
      );
  }
}

export const fetchAuthors = () => {
  return (dispatch) => {
    dispatch({
      type: REQUEST_AUTHORS
    });

    return fetch( API_END_POINT + '/authors/')
      .then(response => {
        return response.json();
      })
      .then( response => {
          if (response.status >= 400) {
            console.error('bad status:', response.status);
          } else {
            dispatch({
              type: RECEIVE_AUTHORS,
              authors: response.result
            });
          }
        },
        (err) => {
          console.error(err);
        }
      );
  }
}

export const fetchTags = () => {
  return (dispatch) => {
    dispatch({
      type: REQUEST_TAGS
    });

    return fetch( API_END_POINT + '/tags/')
      .then(response => {
        return response.json();
      })
      .then( response => {
          if (response.status >= 400) {
            console.error('bad status:', response.status);
          } else {
            dispatch({
              type: RECEIVE_TAGS,
              tags: response.result
            });
          }
        },
        (err) => {
          console.error(err);
        }
      );
  }
}

export const fetchPatchesAuthorsTags = () => {
  return (dispatch, getState) => {
    return Promise.all([
      dispatch(fetchPatches()),
      dispatch(fetchAuthors()),
      dispatch(fetchTags())
    ]).then(() => {
      dispatch({
        type: RECEIVE_PATCHES_AUTHORS_TAGS,
        state: getState()
      });
    },
    (err) => {
      console.error(err);
    })
  }
}

export const fetchCurrentUser = () => {
  return (dispatch) => {

    dispatch({
      type: REQUEST_CURRENT_USER
    });

    return fetch('/wp-admin/admin-ajax.php?action=owl-get-current-user-info', {credentials: 'same-origin'})
      .then(response => {
        return response.json();
      })
      .then( response => {
          if (response.status >= 400) {
            console.error('bad status:', response.status);
          } else {
            dispatch({
              type: RECEIVE_CURRENT_USER,
              user: response.result
            });
          }
        },
        (err) => {
          console.error(err);
        }
      );
  }
}

export const fetchPatchDetails = (patchSeoName) => {
  return (dispatch) => {

    dispatch({
      type: REQUEST_PATCH_DETAILS
    });

    return fetch(API_END_POINT + '/patch/?seoName='+ patchSeoName)
      .then(response => {
        return response.json();
      })
      .then( response => {
          if (response.status >= 400) {
            console.error('bad status:', response.status);
          } else {
            dispatch({
              type: RECEIVE_PATCH_DETAILS,
              patchDetails: response.result
            });
          }
        },
        (err) => {
          console.error(err);
        }
      );
  }
}

export const fetchPatchJavaScriptFile = (patch) => {
  return (dispatch) => {
    dispatch({
      type: REQUEST_PATCH_JAVASCRIPT
    });
    getScript(API_END_POINT + '/builds/'+ patch._id +'?format=js&download=0', (err) => {
      if(err){
        console.error(err);
      } else {
        dispatch({
          type: LOADED_PATCH_JAVASCRIPT,
          isFetching: false,
          patchId: patch._id
        });
      }
    });
  }
}

export const setPatchListTopFilter = (filter) => {
  return {
    type: SET_PATCHLIST_TOP_FILTER,
    topFilter: filter
  };
}

export const togglePatchListSubFilter = (subFilter) => {
  return {
    type: TOGGLE_FILTER_IN_SUB_FILTER,
    subFilter: subFilter
  };
}

export const resetPatchListSubFilter = (subFilter) => {
  return {
    type: RESET_PATCHLIST_SUB_FILTER,
    subFilter: subFilter
  };
}

