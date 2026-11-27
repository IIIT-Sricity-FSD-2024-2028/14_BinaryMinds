import { useCallback, useId, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectFieldOfficerValue, setFieldOfficerValue } from '../state/fieldOfficerUiSlice.js';

// Component-local presentation and form values are kept in the shared Redux store.
export function useFieldOfficerState(initialValue) {
  const id = useId();
  const dispatch = useDispatch();
  const fallback = useMemo(
    () => (typeof initialValue === 'function' ? initialValue() : initialValue),
    // Initial form values are deliberately captured once per mounted component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const value = useSelector((state) => selectFieldOfficerValue(state, id, fallback));
  const currentValue = useRef(value);
  currentValue.current = value;
  const setValue = useCallback((nextValue) => {
    dispatch(setFieldOfficerValue({ id, value: typeof nextValue === 'function' ? nextValue(currentValue.current) : nextValue }));
  }, [dispatch, id]);
  return [value, setValue];
}
