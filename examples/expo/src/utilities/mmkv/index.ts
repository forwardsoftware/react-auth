import { MMKV, Mode } from 'react-native-mmkv';

export const MMKVStorage = new MMKV({
  id: `react-native-auth-storage`,
  mode: Mode.MULTI_PROCESS,
  readOnly: false,
});
