import { useLoading } from '../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../providers/SnackbarProvider.tsx';
import { useTranslation } from 'react-i18next';
import { useGetEntities, useRemoveEntity } from '@/hooks/entity';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { debounce } from 'lodash';
import { Entity } from '@/common/api/trx';
import type { MyFinColumnDef } from '@/components/dashboard/Table/Types';
import { CirclePlus, Pencil, Search, Trash2 } from 'lucide-react';
import GenericConfirmationDialog from '../../components/GenericConfirmationDialog.tsx';
import PageHeader from '../../components/PageHeader.tsx';
import AddEditEntityDialog from './AddEditEntityDialog.tsx';
import MyFinStaticTable from '../../components/MyFinStaticTable.tsx';
import { Card } from '@/common/shadcn/ui/card.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';

const Entities = () => {
  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();

  const getEntitiesRequest = useGetEntities();
  const removeEntityRequest = useRemoveEntity();

  const [entities, setEntities] = useState<Entity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionableEntity, setActionableEntity] = useState<Entity | null>(null);
  const [isRemoveDialogOpen, setRemoveDialogOpen] = useState(false);
  const [isAddEditDialogOpen, setAddEditDialogOpen] = useState(false);
  const debouncedSearchQuery = useMemo(() => debounce(setSearchQuery, 300), []);

  const filteredEntities = useMemo(() => {
    let filteredList = entities;

    if (searchQuery != null) {
      const lowerCaseQuery = searchQuery?.toLowerCase() || '';
      filteredList = entities.filter(
        (cat) =>
          !searchQuery || cat.name.toLowerCase().includes(lowerCaseQuery),
      );
    }

    return filteredList;
  }, [searchQuery, entities]);

  useEffect(() => {
    if (getEntitiesRequest.isFetching || removeEntityRequest.isPending) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [getEntitiesRequest.isFetching, removeEntityRequest.isPending]);

  useEffect(() => {
    if (getEntitiesRequest.isError || removeEntityRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [getEntitiesRequest.isError, removeEntityRequest.isError]);

  useEffect(() => {
    if (!getEntitiesRequest.data) return;
    setEntities(getEntitiesRequest.data);
  }, [getEntitiesRequest.data]);

  useEffect(() => {
    if (isRemoveDialogOpen == false && isAddEditDialogOpen == false) {
      setActionableEntity(null);
    }
  }, [isRemoveDialogOpen, isAddEditDialogOpen]);

  const handleEditButtonClick = (entity: Entity) => {
    setActionableEntity(entity);
    setAddEditDialogOpen(true);
  };

  const rows = useMemo(
    () =>
      filteredEntities.map((entity: Entity) => ({
        id: entity.entity_id,
        name: entity.name,
        actions: entity,
      })),
    [filteredEntities],
  );

  const columns: MyFinColumnDef[] = [
    {
      field: 'name',
      headerName: t('entities.name'),
      minWidth: 200,
      flex: 1,
      editable: false,
      sortable: false,
      renderCell: (params) => <p>{params.value}</p>,
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
              setActionableEntity(params.value);
              setRemoveDialogOpen(true);
            }}
          >
            <Trash2 className="h-5 w-5 opacity-70" />
          </Button>
        </div>
      ),
    },
  ];

  const removeEntity = () => {
    if (!actionableEntity) return;
    removeEntityRequest.mutate(actionableEntity.entity_id);
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
      {isAddEditDialogOpen && (
        <AddEditEntityDialog
          isOpen={isAddEditDialogOpen}
          onClose={() => setAddEditDialogOpen(false)}
          onPositiveClick={() => setAddEditDialogOpen(false)}
          onNegativeClick={() => setAddEditDialogOpen(false)}
          entity={actionableEntity}
        />
      )}
      {isRemoveDialogOpen && (
        <GenericConfirmationDialog
          isOpen={isRemoveDialogOpen}
          onClose={() => setRemoveDialogOpen(false)}
          onPositiveClick={() => removeEntity()}
          onNegativeClick={() => setRemoveDialogOpen(false)}
          titleText={t('entities.deleteEntityModalTitle', {
            name: actionableEntity?.name,
          })}
          descriptionText={t('entities.deleteEntityModalSubtitle')}
          positiveText={t('common.delete')}
        />
      )}
      <div className="flex flex-col justify-between gap-2">
        <PageHeader
          title={t('entities.entities')}
          subtitle={t('entities.strapLine')}
        />
      </div>
      <div className="mt-4 grid gap-4">
        <div className="grid gap-4 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <Button
              type="button"
              className="mb-2"
              onClick={() => {
                setAddEditDialogOpen(true);
              }}
            >
              <CirclePlus className="mr-2 size-5" />
              {t('entities.addEntityCTA')}
            </Button>
          </div>
          <div className="flex justify-end md:col-span-4">
            <div className="flex w-full max-w-xs flex-col gap-2">
              <Label htmlFor="entity-search">{t('common.search')}</Label>
              <div className="relative">
                <Search className="text-muted-foreground absolute right-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  id="entity-search"
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
          isRefetching={getEntitiesRequest.isRefetching}
          rows={rows}
          columns={columns}
          paginationModel={{ pageSize: 20 }}
          onRowClicked={(id) => {
            const entity = entities.find((ent) => ent.entity_id == id);
            if (!entity) return;
            handleEditButtonClick(entity);
          }}
        />
      </div>
    </Card>
  );
};

export default Entities;
