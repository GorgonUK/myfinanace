import { Entity } from '@/common/api/trx';
import { Trans, useTranslation } from 'react-i18next';
import { useLoading } from '../../providers/LoadingProvider.tsx';
import { AlertSeverity, useSnackbar } from '../../providers/SnackbarProvider.tsx';
import { useAddEntity, useEditEntity } from '@/hooks/entity';
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/common/shadcn/ui/dialog.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Folder, Send, Undo } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onPositiveClick: () => void;
  onNegativeClick: () => void;
  entity: Entity | null;
};

const AddEditEntityDialog = (props: Props) => {
  const isEditForm = props.entity !== null;

  const { t } = useTranslation();
  const loader = useLoading();
  const snackbar = useSnackbar();

  const addEntityRequest = useAddEntity();
  const editEntityRequest = useEditEntity();

  const [nameValue, setNameValue] = useState<string>(props.entity?.name || '');

  useEffect(() => {
    if (addEntityRequest.isPending || editEntityRequest.isPending) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [addEntityRequest.isPending, editEntityRequest.isPending]);

  useEffect(() => {
    if (addEntityRequest.isError || editEntityRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [addEntityRequest.isError, editEntityRequest.isError]);

  useEffect(() => {
    if (addEntityRequest.isSuccess || editEntityRequest.isSuccess) {
      props.onPositiveClick();
    }
  }, [addEntityRequest.isSuccess, editEntityRequest.isSuccess]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isEditForm && props.entity) {
      editEntityRequest.mutate({
        entity_id: props.entity.entity_id,
        new_name: nameValue,
      });
    } else {
      addEntityRequest.mutate({
        name: nameValue,
      });
    }
  };

  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      <DialogContent className="max-w-md sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              <Trans
                i18nKey={
                  isEditForm
                    ? 'entities.editEntityModalTitle'
                    : 'entities.addEntityCTA'
                }
                values={{
                  name: props.entity?.name,
                }}
              />
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="entity-name">{t('entities.name')}</Label>
              <div className="relative">
                <Folder className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  id="entity-name"
                  name="name"
                  value={nameValue || ''}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={props.onNegativeClick}
            >
              <Undo className="mr-2 size-4" />
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              <Send className="mr-2 size-4" />
              {t(isEditForm ? 'common.edit' : 'common.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditEntityDialog;
