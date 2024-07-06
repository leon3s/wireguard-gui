import { useCallback, useEffect, useState } from 'react';

import type { AppState } from '@/types/app';
import type { Profile, ProfilePartial } from '@/types/profile';
import { AppLoaderProps } from '@/components/app-loader';

export function useInvoke<T, I>(initialValue: I, cmd: string, args?: any) {
  const [data, setData] = useState<T | I>(initialValue);
  const [err, setErr] = useState<string | null>(null);
  const [isLoading, setisLoading] = useState<boolean>(true);
  const fetch = useCallback(() => {
    setisLoading(true);
    require('@tauri-apps/api')
      .invoke(cmd, args)
      .then((d: T) => setData(d))
      .catch((error: any) => setErr(error))
      .finally(() => setisLoading(false));
  }, [args, cmd]);
  useEffect(() => fetch(), [fetch]);
  return [data, err, isLoading, setData, fetch] as const;
}

export function useAppState() {
  return useInvoke<AppState, AppState>({}, 'get_state');
}

export function useProfiles() {
  return useInvoke<Profile[], Profile[]>([], 'list_profile');
}

export function disconnect(onfinally?: () => void, onerror?: (err: any) => void) {
  require('@tauri-apps/api').invoke('disconnect').catch(onerror).finally(onfinally);
}

export function connect(profile: string, onfinally?: () => void, onerror?: (err: any) => void) {
  require('@tauri-apps/api')
    .invoke('connect_profile', { profile })
    .catch(onerror)
    .finally(onfinally);
}

export function useAppLoader() {
  const [appLoader, setAppLoader] = useState<AppLoaderProps>({
    kind: 'Connecting',
  });
  return [appLoader, setAppLoader] as const;
}

export function createProfile<T>(
  newProfile: ProfilePartial,
  onsuccess?: (d: T) => void,
  onerror?: (err: any) => void,
  onfinally?: () => void,
) {
  return require('@tauri-apps/api')
    .invoke('create_profile', { newProfile })
    .then(onsuccess)
    .catch(onerror)
    .finally(onfinally);
}

export function deleteProfile<T>(
  profileName: string,
  onsuccess?: (d: T) => void,
  onerror?: (err: any) => void,
  onfinally?: () => void,
) {
  return require('@tauri-apps/api')
    .invoke('delete_profile', { profileName })
    .then(onsuccess)
    .catch(onerror)
    .finally(onfinally);
}

export function updateProfile<T>(
  profileName: string,
  profile: ProfilePartial,
  onsuccess?: (d: T) => void,
  onerror?: (err: any) => void,
  onfinally?: () => void,
) {
  return require('@tauri-apps/api')
    .invoke('update_profile', { profileName, profile })
    .then(onsuccess)
    .catch(onerror)
    .finally(onfinally);
}
