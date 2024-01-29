'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Lock, PowerOff, Unlock } from 'lucide-react';

import { connect, disconnect, useAppLoader, useAppState } from '@/lib/effects';
import { Button } from '@/components/ui/button';
import { AppLoader } from '@/components/app-loader';
import { AppSplashScreen } from '@/components/app-splash-screen';
import { ProfileTable } from '@/components/profile-table';

export default function Index() {
  const [state, , , , fetchState] = useAppState();
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [appLoader, setAppLoader] = useAppLoader();

  const onConnectionFinish = useCallback(() => {
    return () => {
      fetchState();
      setAppLoader((l) => ({ ...l, isOpen: false }));
    };
  }, [fetchState, setAppLoader]);

  const onConnect = useCallback(
    (profile: string) => {
      return () => {
        setAppLoader({
          kind: 'Connecting',
          isOpen: true,
          message: `Connecting to ${profile}`,
        });
        connect(profile, onConnectionFinish());
      };
    },
    [setAppLoader, onConnectionFinish],
  );

  const onDisconnect = useCallback(() => {
    setAppLoader({
      kind: 'Disconnecting',
      isOpen: true,
      message: `Disconnecting from ${state.current}`,
    });
    disconnect(onConnectionFinish());
  }, [state, setAppLoader, onConnectionFinish]);

  useEffect(() => {
    if (isFirstRender) {
      setTimeout(() => setIsFirstRender(() => false), 1000);
    }
  }, [isFirstRender]);

  return (
    <div className="bg-background">
      <AppLoader {...appLoader} />
      {isFirstRender ? <AppSplashScreen /> : null}
      <div className="m-auto flex max-w-[1024px] flex-col px-4 pt-4">
        <div className="mb-8 flex items-center justify-between">
          <Image
            title="Wireguard GUI"
            alt="wireguard"
            src="/img/wireguard.png"
            width={42}
            height={42}
          />
          <Button
            disabled={state?.conn_st !== 'Connected'}
            title="disconnect"
            variant={state?.conn_st === 'Connected' ? 'destructive' : null}
            className="ml-2"
            onClick={onDisconnect}
          >
            <PowerOff className="size-4" />
          </Button>
        </div>
        <div className="mb-8 flex flex-col items-center justify-center">
          {state.conn_st === 'Connected' ? (
            <Lock className="mb-2 size-16 text-green-500" />
          ) : (
            <Unlock className="animate-pulsemb-2 size-16 text-red-500" />
          )}
          <p className="mt-2 font-bold">{state.current || 'Not connected'}</p>
          <p className="font-bold">{state?.pub_ip || 'Unknow'}</p>
        </div>
        <Suspense>
          <ProfileTable current={state?.current} onConnect={onConnect} />
        </Suspense>
      </div>
    </div>
  );
}
