import { useStoredState } from './useStoredState'
import { loadSlice } from '../utils/persistedSlices'

// The slice definition supplies key, loader and validator, so hooks over a
// persisted slice declare none of them.
export function useSliceState(slice) {
  return useStoredState(slice.key, () => loadSlice(slice), slice.accepts)
}
