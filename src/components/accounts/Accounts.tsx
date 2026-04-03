import { useLoading } from '../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../providers/SnackbarProvider.tsx';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/PageHeader.tsx';
import {
  useGetAccounts,
  useRemoveAccount,
} from '@/hooks/account';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Account,
  AccountStatus,
  AccountType,
} from '@/common/api/auth';
import type { MyFinColumnDef } from '@/components/dashboard/Table/Types';
import { CirclePlus, Pencil, Search, Trash2 } from 'lucide-react';
import { cssGradients } from '../../utils/gradientUtils.ts';
import { ColorGradient } from '@/config';
import GenericConfirmationDialog from '../../components/GenericConfirmationDialog.tsx';
import AddEditAccountDialog from './AddEditAccountDialog.tsx';
import { debounce } from 'lodash';
import MyFinStaticTable from '../../components/MyFinStaticTable.tsx';
import { useFormatStringAsCurrency } from '../../utils/textHooks.ts';
import { Card } from '@/common/shadcn/ui/card.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
import { Badge } from '@/common/shadcn/ui/badge.tsx';
import { Tabs, TabsList, TabsTrigger } from '@/common/shadcn/ui/tabs.tsx';

const Accounts = () => {
  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();

  const getAccountsRequest = useGetAccounts();
  const removeAccountRequest = useRemoveAccount();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedTab, setSelectedTab] = useState('0');
  const [filter, setFilter] = useState<AccountType[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionableAccount, setActionableAccount] = useState<Account | null>(
    null,
  );
  const [isRemoveDialogOpen, setRemoveDialogOpen] = useState(false);
  const [isAddEditAccountDialogOpen, setAddEditDialogOpen] = useState(false);
  const formatStringAsCurrency = useFormatStringAsCurrency();
  const debouncedSearchQuery = useMemo(() => debounce(setSearchQuery, 300), []);

  const filteredAccounts = useMemo(() => {
    let filteredList = accounts;

    if (filter != null || searchQuery != null) {
      const lowerCaseQuery = searchQuery?.toLowerCase() || '';
      filteredList = accounts.filter((acc) => {
        const matchesFilter = !filter || filter.includes(acc.type);
        const matchesSearchQuery =
          !searchQuery || acc.name.toLowerCase().includes(lowerCaseQuery);
        return matchesFilter && matchesSearchQuery;
      });
    }

    return filteredList.sort((a, b) => a.status.localeCompare(b.status));
  }, [filter, searchQuery, accounts]);

  useEffect(() => {
    if (getAccountsRequest.isFetching || removeAccountRequest.isPending) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [getAccountsRequest.isFetching, removeAccountRequest.isPending]);

  useEffect(() => {
    if (getAccountsRequest.isError || removeAccountRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [getAccountsRequest.isError, removeAccountRequest.isError]);

  useEffect(() => {
    if (!getAccountsRequest.data) return;
    setAccounts(getAccountsRequest.data);
  }, [getAccountsRequest.data]);

  useEffect(() => {
    switch (selectedTab) {
      case '0':
        setFilter(null);
        break;
      case '1':
        setFilter([
          AccountType.Checking,
          AccountType.Savings,
          AccountType.Meal,
          AccountType.Wallet,
        ]);
        break;
      case '2':
        setFilter([AccountType.Credit]);
        break;
      case '3':
        setFilter([AccountType.Investing]);
        break;
      case '4':
        setFilter([AccountType.Other]);
        break;
    }
  }, [selectedTab]);

  useEffect(() => {
    if (isRemoveDialogOpen == false && isAddEditAccountDialogOpen == false) {
      setActionableAccount(null);
    }
  }, [isRemoveDialogOpen, isAddEditAccountDialogOpen]);

  const handleEditButtonClick = (account: Account) => {
    setActionableAccount(account);
    setAddEditDialogOpen(true);
  };

  const rows = filteredAccounts.map((account: Account) => ({
    id: account.account_id,
    color: account.color_gradient,
    name: { name: account.name, status: account.status, type: account.type },
    balance: account.balance,
    status: account.status,
    actions: account,
  }));

  const columns: MyFinColumnDef[] = [
    {
      field: 'color',
      headerName: t('accounts.color'),
      minWidth: 40,
      editable: false,
      sortable: false,
      renderCell: (params) => (
        <div
          style={{
            margin: 10,
            background: cssGradients[params.value as ColorGradient] ?? '',
            width: 30,
            height: 30,
            borderRadius: 20,
          }}
        />
      ),
    },
    {
      field: 'name',
      headerName: t('accounts.name'),
      flex: 1,
      minWidth: 100,
      editable: false,
      sortable: false,
      renderCell: (params) => {
        const isActive = params.value.status.startsWith(AccountStatus.Active);
        return (
          <div className={isActive ? 'my-3' : 'my-1'}>
            <p
              className={
                isActive ? 'text-foreground text-sm font-bold' : 'text-sm'
              }
            >
              {params.value.name}
            </p>
            <p className="text-muted-foreground text-xs">
              {t(`accounts.${params.value.type.toLowerCase()}`)}
            </p>
          </div>
        );
      },
    },
    {
      field: 'balance',
      headerName: t('accounts.balance'),
      width: 200,
      editable: false,
      sortable: false,
      renderCell: (params) => (
        <Badge variant="outline" className="font-normal">
          {formatStringAsCurrency.invoke(params.value)}
        </Badge>
      ),
    },
    {
      field: 'status',
      headerName: t('accounts.status'),
      minWidth: 100,
      editable: false,
      sortable: false,
      renderCell: (params) => {
        const active = params.value.startsWith(AccountStatus.Active);
        return (
          <Badge
            variant="outline"
            className={
              active
                ? 'border-green-600 text-green-700 dark:text-green-400'
                : 'border-amber-600 text-amber-800 dark:text-amber-400'
            }
          >
            {t(
              active ? 'accounts.active' : 'accounts.inactive',
            )}
          </Badge>
        );
      },
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      minWidth: 100,
      editable: false,
      sortable: false,
      renderCell: (params) => (
        <div className="flex flex-row gap-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('common.edit')}
            onClick={() => {
              handleEditButtonClick(params.value);
            }}
          >
            <Pencil className="h-5 w-5 opacity-70" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('common.delete')}
            onClick={(event) => {
              event.stopPropagation();
              setActionableAccount(params.value);
              setRemoveDialogOpen(true);
            }}
          >
            <Trash2 className="h-5 w-5 opacity-70" />
          </Button>
        </div>
      ),
    },
  ];

  const removeAccount = () => {
    if (!actionableAccount) return;
    removeAccountRequest.mutate(actionableAccount.account_id);
    setRemoveDialogOpen(false);
  };

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      debouncedSearchQuery(event.target.value);
    },
    [debouncedSearchQuery],
  );

  return (
    <Card className="m-4 p-4 shadow-none">
      {isAddEditAccountDialogOpen && (
        <AddEditAccountDialog
          isOpen={isAddEditAccountDialogOpen}
          onClose={() => setAddEditDialogOpen(false)}
          onPositiveClick={() => setAddEditDialogOpen(false)}
          onNegativeClick={() => setAddEditDialogOpen(false)}
          account={actionableAccount}
        />
      )}
      {isRemoveDialogOpen && (
        <GenericConfirmationDialog
          isOpen={isRemoveDialogOpen}
          onClose={() => setRemoveDialogOpen(false)}
          onPositiveClick={() => removeAccount()}
          onNegativeClick={() => setRemoveDialogOpen(false)}
          titleText={t('accounts.deleteAccountModalTitle', {
            name: actionableAccount?.name,
          })}
          descriptionText={t('accounts.deleteAccountModalSubtitle')}
          positiveText={t('common.delete')}
        />
      )}
      <div className="flex flex-col gap-2">
        <PageHeader
          title={t('accounts.accounts')}
          subtitle={t('accounts.strapLine')}
        />
      </div>
      <Button
        type="button"
        className="mb-4 mt-2"
        onClick={() => {
          setAddEditDialogOpen(true);
        }}
      >
        <CirclePlus className="mr-2 size-5" />
        {t('accounts.addAccount')}
      </Button>
      <div className="mb-4 grid gap-4 md:grid-cols-12 md:items-end">
        <div className="md:col-span-8">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
              <TabsTrigger value="0">{t('accounts.all')}</TabsTrigger>
              <TabsTrigger value="1">{t('topBar.operatingFunds')}</TabsTrigger>
              <TabsTrigger value="2">{t('topBar.debt')}</TabsTrigger>
              <TabsTrigger value="3">{t('accounts.investments')}</TabsTrigger>
              <TabsTrigger value="4">{t('accounts.others')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex justify-end md:col-span-4">
          <div className="flex w-full max-w-xs flex-col gap-2">
            <Label htmlFor="account-search">{t('common.search')}</Label>
            <div className="relative">
              <Search className="text-muted-foreground absolute right-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                id="account-search"
                className="pr-10"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  handleSearchChange(event);
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <MyFinStaticTable
        isRefetching={getAccountsRequest.isRefetching}
        rows={rows}
        columns={columns}
        paginationModel={{ pageSize: 100 }}
        onRowClicked={(id) => {
          const account = accounts.find((acc) => acc.account_id == id);
          if (!account) return;
          handleEditButtonClick(account);
        }}
      />
    </Card>
  );
};

export default Accounts;
