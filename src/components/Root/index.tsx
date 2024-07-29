'use client';

import { NextUIProvider } from '@nextui-org/react';
import {
  bindMiniAppCSSVars,
  bindThemeParamsCSSVars,
  bindViewportCSSVars,
  SDKProvider,
  useLaunchParams,
  useMiniApp,
  useThemeParams,
  useViewport,
} from '@telegram-apps/sdk-react';
import { useEffect, type PropsWithChildren } from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorPage } from '@/components/ErrorPage';
import { useDidMount } from '@/hooks/useDidMount';
import { useTelegramMock } from '@/hooks/useTelegramMock';

import { AuthCoreContextProvider } from '@particle-network/auth-core-modal';
import { Toaster } from 'sonner';
import { AppProvder } from '../../context';
import { AppLoading } from '../AppLoading';

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_PARTICLE_ENV === 'development') {
  window.__PARTICLE_ENVIRONMENT__ = 'development';
}

function App(props: PropsWithChildren) {
  const miniApp = useMiniApp();
  const themeParams = useThemeParams();
  const viewport = useViewport();

  useEffect(() => {
    return bindMiniAppCSSVars(miniApp, themeParams);
  }, [miniApp, themeParams]);

  useEffect(() => {
    return bindThemeParamsCSSVars(themeParams);
  }, [themeParams]);

  useEffect(() => {
    return viewport && bindViewportCSSVars(viewport);
  }, [viewport]);

  return (
    <NextUIProvider>
      <AuthCoreContextProvider
        options={{
          projectId: process.env.NEXT_PUBLIC_PROJECT_ID as string,
          clientKey: process.env.NEXT_PUBLIC_CLIENT_KEY as string,
          appId: process.env.NEXT_PUBLIC_APP_ID as string,
        }}
      >
        <Toaster richColors position="bottom-center" expand={false} closeButton duration={2000} />
        <AppProvder>
          <div className="box-border w-screen">{props.children}</div>
        </AppProvder>
      </AuthCoreContextProvider>
    </NextUIProvider>
  );
}

function RootInner({ children }: PropsWithChildren) {
  // Mock Telegram environment in development mode if needed.
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useTelegramMock();
  }

  const debug = useLaunchParams().startParam === 'debug';

  // Enable debug mode to see all the methods sent and events received.
  useEffect(() => {
    // if (debug) {
    //   import('eruda').then((lib) => lib.default.init());
    // }
    import('eruda').then((lib) => lib.default.init());
  }, [debug]);

  return (
    <SDKProvider acceptCustomStyles debug={debug}>
      <App>{children}</App>
    </SDKProvider>
  );
}

export function Root(props: PropsWithChildren) {
  // Unfortunately, Telegram Mini Apps does not allow us to use all features of the Server Side
  // Rendering. That's why we are showing loader on the server side.
  const didMount = useDidMount();

  return didMount ? (
    <ErrorBoundary fallback={ErrorPage}>
      <RootInner {...props} />
    </ErrorBoundary>
  ) : (
    <AppLoading>
      <div className="text-gray-400">Loading...</div>
    </AppLoading>
  );
}
