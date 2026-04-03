import { Tag } from '@/common/api/trx';
import { Trans, useTranslation } from 'react-i18next';
import { useLoading } from '../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../providers/SnackbarProvider.tsx';
import { useAddTag, useEditTag } from '@/hooks/tag';
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
import { FileText, Folder, Send, Undo } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onPositiveClick: () => void;
  onNegativeClick: () => void;
  tag: Tag | null;
};

const AddEditTagDialog = (props: Props) => {
  const isEditForm = props.tag !== null;

  const { t } = useTranslation();
  const loader = useLoading();
  const snackbar = useSnackbar();

  const addTagRequest = useAddTag();
  const editTagRequest = useEditTag();

  const [nameValue, setNameValue] = useState<string>(props.tag?.name || '');
  const [descriptionValue, setDescriptionValue] = useState<string>(
    props.tag?.description || '',
  );

  useEffect(() => {
    if (addTagRequest.isPending || editTagRequest.isPending) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [addTagRequest.isPending, editTagRequest.isPending, loader]);

  useEffect(() => {
    if (addTagRequest.isError || editTagRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [addTagRequest.isError, editTagRequest.isError, snackbar, t]);

  useEffect(() => {
    if (addTagRequest.isSuccess || editTagRequest.isSuccess) {
      props.onPositiveClick();
    }
  }, [addTagRequest.isSuccess, editTagRequest.isSuccess, props.onPositiveClick]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isEditForm && props.tag) {
      editTagRequest.mutate({
        tag_id: props.tag.tag_id,
        new_name: nameValue,
        new_description: descriptionValue,
      });
    } else {
      addTagRequest.mutate({
        name: nameValue,
        description: descriptionValue,
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
                i18nKey={isEditForm ? 'tags.editTagModalTitle' : 'tags.addTagCTA'}
                values={{
                  id: props.tag?.tag_id,
                }}
              />
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="tag-name">{t('tags.name')}</Label>
              <div className="relative">
                <Folder className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  id="tag-name"
                  name="name"
                  value={nameValue || ''}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tag-description">{t('common.description')}</Label>
              <div className="relative">
                <FileText className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  id="tag-description"
                  name="description"
                  value={descriptionValue || ''}
                  onChange={(e) => setDescriptionValue(e.target.value)}
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

export default AddEditTagDialog;
