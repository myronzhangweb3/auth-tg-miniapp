'use client';

import EVM from '@/assets/evm';
import { SettingsIcon, WalletIcon } from '@/assets/icons';
import Solana from '@/assets/sol';
import { useAppContext } from '@/context';
import { copyTextToClipboard, shortString } from '@/utils';
import { Button, Listbox, ListboxItem, Popover, PopoverContent, PopoverTrigger, Tab, Tabs } from '@nextui-org/react';
import { useAuthCore, useConnect, useSolana, useUserInfo } from '@particle-network/auth-core-modal';
import { useMiniApp, useViewport } from '@telegram-apps/sdk-react';
import { blo, type Address } from 'blo';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { AppLoading } from '../AppLoading';
import EVMDemo from '../EVMDemo';
import Footer from '../Footer';
import SolanaDemo from '../SolanaDemo';

export const Page = () => {
  const { connect, connectionStatus } = useConnect();
  const { address: solanaAddress, enable: enableSolana } = useSolana();
  const { userInfo } = useUserInfo();
  const { openWallet, openAccountAndSecurity } = useAuthCore();

  const viewport = useViewport();
  const miniApp = useMiniApp();

  const { handleError, connectError, evmAddress } = useAppContext();

  const [solanaLoading, setSolanaLoading] = useState<boolean>();
  const [selected, setSelected] = useState<string>('evm');

  useEffect(() => {
    if (viewport) {
      viewport.expand();
    }
  }, [viewport]);

  const createSolanaWallet = async () => {
    setSolanaLoading(true);
    try {
      await enableSolana();
    } catch (error) {
      handleError(error);
    } finally {
      setSolanaLoading(false);
    }
  };

  const copyText = (text: string) => {
    copyTextToClipboard(text);
  };

  const onOpenWallet = () => {
    openWallet({
      windowSize: 'large',
      topMenuType: 'close',
    });
  };

  const onAction = (key: string | number) => {
    if (key === 'logout') {
      onLogout();
    } else if (key === 'account-security') {
      openAccountAndSecurity();
    }
  };

  const onLogout = () => {
    localStorage.clear();
    miniApp.close();
  };

  if (connectionStatus !== 'connected') {
    return (
      <AppLoading>
        {!connectError && <div className="text-gray-400">Connecting Wallet...</div>}
        {connectError?.message && <div className="px-4 text-center text-danger">{connectError.message}</div>}
        {connectError?.extra && typeof connectError?.extra === 'string' && (
          <div className="px-4 text-center text-danger">{connectError.extra}</div>
        )}
        {connectError && (
          <Button color="danger" onClick={() => miniApp.close()}>
            Close
          </Button>
        )}
        <Footer />
      </AppLoading>
    );
  }

  return (
    <div className="relative box-border flex h-full w-full flex-col items-center px-4 pb-10 pt-4">
      <div className="absolute right-4 top-4 flex gap-3">
        <Button isIconOnly aria-label="Wallet" color="primary" className="rounded-full shadow" onClick={onOpenWallet}>
          <WalletIcon />
        </Button>
        <Popover placement="bottom-end" showArrow={true}>
          <PopoverTrigger>
            <Button isIconOnly aria-label="Settings" color="primary" className="rounded-full shadow">
              <SettingsIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <Listbox aria-label="Actions" onAction={onAction}>
              <ListboxItem key="account-security" color="default">
                Account And Security
              </ListboxItem>
              <ListboxItem key="logout" className="text-danger" color="danger">
                Logout
              </ListboxItem>
            </Listbox>
          </PopoverContent>
        </Popover>
      </div>

      <Image
        className="mt-8 h-20 w-20 rounded-full"
        src={userInfo?.avatar || blo((evmAddress || '0xe8fc0baE43aA264064199dd494d0f6630E692e73') as Address)}
        width={80}
        height={80}
        alt={evmAddress || 'address'}
        placeholder="blur"
        blurDataURL={blo((evmAddress || '0xe8fc0baE43aA264064199dd494d0f6630E692e73') as Address)}
        unoptimized
      ></Image>

      {evmAddress && (
        <div className="mt-4 cursor-pointer text-base font-semibold underline" onClick={() => copyText(evmAddress!)}>
          {shortString(evmAddress)}
        </div>
      )}

      {solanaAddress && (
        <div
          className="mt-2 h-8 cursor-pointer text-base font-semibold underline"
          onClick={() => copyText(solanaAddress)}
        >
          {shortString(solanaAddress)}
        </div>
      )}

      {!solanaAddress && (
        <Button
          className="mt-2 rounded-3xl text-xs"
          size="sm"
          color="primary"
          onClick={() => createSolanaWallet()}
          isLoading={solanaLoading}
        >
          Create Solana Wallet
        </Button>
      )}

      <Tabs
        fullWidth
        size="md"
        aria-label="Tabs chains"
        selectedKey={selected}
        onSelectionChange={(key) => setSelected(key as string)}
        className="mt-2"
        color="primary"
        variant="underlined"
        classNames={{
          panel: 'w-full h-full overflow-y-auto',
        }}
      >
        <Tab
          key="evm"
          title={
            <div className="flex items-center space-x-2 font-bold">
              <EVM />
              <span>EVM</span>
            </div>
          }
        >
          <EVMDemo />
        </Tab>
        <Tab
          key="solana"
          title={
            <div className="flex items-center space-x-2 font-bold">
              <Solana />
              <span>Solana</span>
            </div>
          }
          isDisabled={!solanaAddress}
        >
          <SolanaDemo />
        </Tab>
      </Tabs>
      <Footer />
    </div>
  );
};
