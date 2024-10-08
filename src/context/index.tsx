'use client';

import { erc4337Config } from '@/config/erc4337';
import { SmartAccount } from '@particle-network/aa';
import { AuthType } from '@particle-network/auth-core';
import { useConnect, useCustomize, useEthereum } from '@particle-network/auth-core-modal';
import { useLaunchParams, useMiniApp, usePopup } from '@telegram-apps/sdk-react';
import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

type ContextValue = {
  handleError: (error: any) => void;
  connectError: any;
  smartAccount?: SmartAccount;
  evmAddress?: string;
};

export const AppContext = createContext<ContextValue | null>(null);

export const AppProvder = ({ children }: React.PropsWithChildren) => {
  const miniApp = useMiniApp();
  const popup = usePopup();
  const { initDataRaw } = useLaunchParams();

  const { connect, connectionStatus } = useConnect();
  const { provider, address } = useEthereum();
  const { erc4337 } = useCustomize();

  const [connectError, setConnectError] = useState<any>();
  const initDataConnectedRef = useRef(false);
  const [evmAddress, setEVMAddress] = useState<string>();

  const smartAccount = useMemo(() => {
    if (provider) {
      const accountContracts = {} as any;
      erc4337Config.forEach((config) => {
        if (accountContracts[config.name]) {
          accountContracts[config.name].push({
            version: config.version,
            chainIds: config.chains.map((chain) => chain.id),
          });
        } else {
          accountContracts[config.name] = [
            {
              version: config.version,
              chainIds: config.chains.map((chain) => chain.id),
            },
          ];
        }
      });
      return new SmartAccount(provider, {
        projectId: process.env.NEXT_PUBLIC_PROJECT_ID as string,
        clientKey: process.env.NEXT_PUBLIC_CLIENT_KEY as string,
        appId: process.env.NEXT_PUBLIC_APP_ID as string,
        aaOptions: {
          accountContracts,
        },
      });
    }
  }, [provider]);

  useEffect(() => {
    if (erc4337 && smartAccount) {
      smartAccount.setSmartAccountContract(erc4337);
    }
  }, [erc4337, smartAccount]);

  useEffect(() => {
    if (address) {
      if (erc4337 && smartAccount) {
        smartAccount.setSmartAccountContract(erc4337);
        smartAccount
          .getAddress()
          .then((result) => {
            setEVMAddress(result);
          })
          .catch(() => setEVMAddress('--'));
      } else {
        setEVMAddress(address);
      }
    } else {
      setEVMAddress(undefined);
    }
  }, [address, smartAccount, erc4337]);

  const connectWithTelegram = async (initData: string) => {
    console.log('connectWithTelegram');
    try {
      await connect({
        provider: AuthType.telegram,
        thirdpartyCode: initData,
      });
    } catch (error: any) {
      if (error.message) {
        setConnectError(error);
      }
      toast.error('Create wallet error, please reload this page.');
    }
  };

  useEffect(() => {
    if (initDataRaw && connectionStatus === 'disconnected' && !connectError) {
      if (initDataConnectedRef.current) {
        return;
      }
      initDataConnectedRef.current = true;
      connectWithTelegram(initDataRaw);
    }
  }, [initDataRaw, connectionStatus, connectError]);

  const handleError = useCallback(
    (error: any) => {
      console.log('handleError', error);
      if (error.error_code === 10005) {
        if (!initDataConnectedRef.current && initDataRaw) {
          connectWithTelegram(initDataRaw);
        } else {
          console.log('popup open');
          popup
            .open({
              title: 'Invalid Token',
              message: 'Please reopen this mini app.',
              buttons: [{ type: 'ok', id: 'close' }],
            })
            .then((id) => {
              if (id == 'close') {
                miniApp.close();
              }
            })
            .catch(() => {
              //ignore
            });
        }
      } else {
        toast.error(error.message || 'unknown');
      }
    },
    [initDataRaw]
  );

  return (
    <AppContext.Provider
      value={{
        handleError,
        connectError,
        smartAccount,
        evmAddress,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = React.useContext(AppContext);
  if (!context) throw Error('App Hooks must be inside a Provider.');
  return context;
};
