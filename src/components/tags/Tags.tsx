import { useLoading } from '../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../providers/SnackbarProvider.tsx';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useMemo, useState } from 'react';
import { Tag } from '@/common/api/trx';
import { useGetTags, useRemoveTag } from '@/hooks/tag';
import type { MyFinColumnDef } from '@/components/dashboard/Table/Types';
import { CirclePlus, Pencil, Search, Trash2 } from 'lucide-react';
import GenericConfirmationDialog from '../../components/GenericConfirmationDialog.tsx';
import PageHeader from '../../components/PageHeader.tsx';
import { debounce } from 'lodash';
import DataTable from '../../components/DataTable.tsx';
import AddEditTagDialog from './AddEditTagDialog.tsx';
import { Card } from '@/common/shadcn/ui/card.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';

const Tags = () => {
  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 50,
    page: 0,
  });
  const [actionableTag, setActionableTag] = useState<Tag | null>(null);
  const [isRemoveDialogOpen, setRemoveDialogOpen] = useState(false);
  const [isAddEditDialogOpen, setEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const debouncedSearchQuery = useMemo(
    () => debounce((query) => setSearchQuery(query), 300),
    [],
  );

  const getTagsRequest = useGetTags(
    paginationModel.page,
    paginationModel.pageSize,
    searchQuery,
  );
  const removeTagRequest = useRemoveTag();

  useEffect(() => {
    if (getTagsRequest.isLoading || removeTagRequest.isPending) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [getTagsRequest.isLoading, removeTagRequest.isPending]);

  useEffect(() => {
    if (getTagsRequest.isError || removeTagRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [getTagsRequest.isError, removeTagRequest.isError]);

  useEffect(() => {
    if (!isRemoveDialogOpen && !isAddEditDialogOpen) {
      setActionableTag(null);
    }
  }, [isAddEditDialogOpen, isRemoveDialogOpen]);

  const removeTag = () => {
    if (!actionableTag) return;
    removeTagRequest.mutate(actionableTag?.tag_id);
    setRemoveDialogOpen(false);
  };

  const handleEditTagClick = (tag: Tag) => {
    setActionableTag(tag);
    setEditDialogOpen(true);
  };

  const handleRemoveTagClick = (tag: Tag) => {
    setActionableTag(tag);
    setRemoveDialogOpen(true);
  };

  const handleAddTagClick = () => {
    setEditDialogOpen(true);
  };

  if (getTagsRequest.isLoading || !getTagsRequest.data) {
    return null;
  }

  const rows = getTagsRequest.data.results.map((tag: Tag) => ({
    id: tag.tag_id,
    name: tag.name,
    description: tag.description,
    actions: tag,
  }));

  const columns: MyFinColumnDef[] = [
    {
      field: 'name',
      headerName: t('tags.name'),
      minWidth: 200,
      flex: 1,
      editable: false,
      sortable: false,
      renderCell: (params) => <p>{params.value}</p>,
    },
    {
      field: 'description',
      headerName: t('tags.description'),
      minWidth: 400,
      flex: 3,
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
            variant="ghost"
            size="icon"
            aria-label={t('common.edit')}
            type="button"
            onClick={() => handleEditTagClick(params.value)}
          >
            <Pencil className="h-5 w-5 opacity-70" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('common.delete')}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleRemoveTagClick(params.value);
            }}
          >
            <Trash2 className="h-5 w-5 opacity-70" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card className="m-4 border bg-card p-4 shadow-sm">
      {isAddEditDialogOpen && (
        <AddEditTagDialog
          isOpen={isAddEditDialogOpen}
          onPositiveClick={() => setEditDialogOpen(false)}
          onNegativeClick={() => setEditDialogOpen(false)}
          onClose={() => setEditDialogOpen(false)}
          tag={actionableTag}
        />
      )}
      {isRemoveDialogOpen && (
        <GenericConfirmationDialog
          isOpen={isRemoveDialogOpen}
          onClose={() => setRemoveDialogOpen(false)}
          onPositiveClick={removeTag}
          onNegativeClick={() => setRemoveDialogOpen(false)}
          titleText={t('tags.deleteTagModalTitle', {
            id: actionableTag?.tag_id,
          })}
          descriptionText={t('tags.deleteTagModalSubtitle')}
          positiveText={t('common.delete')}
        />
      )}
      <div className="flex flex-col justify-between">
        <PageHeader title={t('tags.tags')} subtitle={t('tags.strapLine')} />
      </div>
      <div className="mt-4 grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-8">
          <Button className="mb-2 gap-2" onClick={handleAddTagClick}>
            <CirclePlus className="size-5" />
            {t('tags.addTagCTA')}
          </Button>
        </div>
        <div className="col-span-12 flex justify-end md:col-span-4">
          <div className="w-full space-y-2 md:max-w-xs">
            <Label htmlFor="search-tags">{t('common.search')}</Label>
            <div className="relative">
              <Input
                id="search-tags"
                className="pr-10"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  debouncedSearchQuery(event.target.value);
                }}
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>
        <div className="col-span-12">
          <DataTable
            isRefetching={getTagsRequest.isRefetching}
            rows={rows}
            columns={columns}
            itemCount={getTagsRequest.data.filtered_count}
            paginationModel={paginationModel}
            setPaginationModel={setPaginationModel}
            onRowClicked={(id) => {
              const tag = getTagsRequest.data.results.find(
                (tag) => tag.tag_id == id,
              );
              if (!tag) return;
              handleEditTagClick(tag);
            }}
          />
        </div>
      </div>
    </Card>
  );
};

export default Tags;
