import { useLoading } from '../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../providers/SnackbarProvider.tsx';
import { useTranslation } from 'react-i18next';
import {
  useGetCategories,
  useRemoveCategory,
} from '@/hooks/category';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react';
import {
  Category,
  CategoryStatus,
} from '@/common/api/category';
import { debounce } from 'lodash';
import type { MyFinColumnDef } from '@/components/dashboard/Table/Types';
import { cssGradients } from '../../utils/gradientUtils.ts';
import { ColorGradient } from '@/config';
import { CirclePlus, Pencil, Search, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader.tsx';
import { Card } from '@/common/shadcn/ui/card.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
import { Badge } from '@/common/shadcn/ui/badge.tsx';
import GenericConfirmationDialog from '../../components/GenericConfirmationDialog.tsx';
import AddEditCategoryDialog from '@/components/category/AddEditCategoryDialog';
import MyFinStaticTable from '../../components/MyFinStaticTable.tsx';

const Categories = () => {
  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();

  const getCategoriesRequest = useGetCategories();
  const removeCategoryRequest = useRemoveCategory();

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionableCategory, setActionableCategory] = useState<Category | null>(
    null,
  );
  const [isRemoveDialogOpen, setRemoveDialogOpen] = useState(false);
  const [isAddEditDialogOpen, setAddEditDialogOpen] = useState(false);
  const debouncedSearchQuery = useMemo(() => debounce(setSearchQuery, 300), []);

  const filteredCategories = useMemo(() => {
    let filteredList = categories;

    if (searchQuery != null) {
      const lowerCaseQuery = searchQuery?.toLowerCase() || '';
      filteredList = categories.filter(
        (cat) =>
          !searchQuery || cat.name.toLowerCase().includes(lowerCaseQuery),
      );
    }

    return filteredList.sort((a, b) => a.status.localeCompare(b.status));
  }, [searchQuery, categories]);

  // Loading
  useEffect(() => {
    if (getCategoriesRequest.isFetching || removeCategoryRequest.isPending) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [getCategoriesRequest.isFetching || removeCategoryRequest.isPending]);

  // Error
  useEffect(() => {
    if (getCategoriesRequest.isError || removeCategoryRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [getCategoriesRequest.isError, removeCategoryRequest.isError]);

  // Success
  useEffect(() => {
    if (!getCategoriesRequest.data) return;
    setCategories(getCategoriesRequest.data);
  }, [getCategoriesRequest.data]);

  // Reset actionableCategory
  useEffect(() => {
    if (isRemoveDialogOpen == false && isAddEditDialogOpen == false) {
      setActionableCategory(null);
    }
  }, [isRemoveDialogOpen, isAddEditDialogOpen]);

  const handleEditButtonClick = (category: Category) => {
    setActionableCategory(category);
    setAddEditDialogOpen(true);
  };

  const rows = useMemo(
    () =>
      filteredCategories.map((category: Category) => ({
        id: category.category_id,
        color: category.color_gradient,
        name: category.name,
        description: category.description,
        status: category.status,
        actions: category,
      })),
    [filteredCategories],
  );

  const columns: MyFinColumnDef[] = [
    {
      field: 'color',
      headerName: t('categories.color'),
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
        ></div>
      ),
    },
    {
      field: 'name',
      headerName: t('categories.name'),
      flex: 1.5,
      minWidth: 200,
      editable: false,
      sortable: false,
      renderCell: (params) => <p>{params.value}</p>,
    },
    {
      field: 'description',
      headerName: t('common.description'),
      flex: 5,
      minWidth: 300,
      editable: false,
      sortable: false,
      renderCell: (params) => <p>{params.value}</p>,
    },
    {
      field: 'status',
      headerName: t('categories.status'),
      minWidth: 100,
      editable: false,
      sortable: false,
      renderCell: (params) => {
        const isActive = params.value.startsWith(CategoryStatus.Active);
        return (
          <Badge
            variant="outline"
            className={
              isActive
                ? 'border-green-600 text-green-800 dark:text-green-200'
                : 'border-amber-600 text-amber-900 dark:text-amber-100'
            }
          >
            {t(isActive ? 'categories.active' : 'categories.inactive')}
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
            variant="ghost"
            size="icon"
            type="button"
            aria-label={t('common.edit')}
            onClick={() => {
              handleEditButtonClick(params.value);
            }}
          >
            <Pencil className="h-5 w-5 opacity-70" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label={t('common.delete')}
            onClick={(event) => {
              event.stopPropagation();
              setActionableCategory(params.value);
              setRemoveDialogOpen(true);
            }}
          >
            <Trash2 className="h-5 w-5 opacity-70" />
          </Button>
        </div>
      ),
    },
  ];

  const removeCategory = () => {
    if (!actionableCategory) return;
    removeCategoryRequest.mutate(actionableCategory.category_id);
    setRemoveDialogOpen(false);
  };

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      debouncedSearchQuery(event.target.value);
    },
    [debouncedSearchQuery],
  );

  return (
    <Card className="m-4 border bg-card p-4 shadow-sm">
      {isAddEditDialogOpen && (
        <AddEditCategoryDialog
          isOpen={isAddEditDialogOpen}
          onClose={() => setAddEditDialogOpen(false)}
          onPositiveClick={() => setAddEditDialogOpen(false)}
          onNegativeClick={() => setAddEditDialogOpen(false)}
          category={actionableCategory}
        />
      )}
      {isRemoveDialogOpen && (
        <GenericConfirmationDialog
          isOpen={isRemoveDialogOpen}
          onClose={() => setRemoveDialogOpen(false)}
          onPositiveClick={() => removeCategory()}
          onNegativeClick={() => setRemoveDialogOpen(false)}
          titleText={t('categories.deleteCategoryModalTitle', {
            name: actionableCategory?.name,
          })}
          descriptionText={t('categories.deleteCategoryModalSubtitle')}
          positiveText={t('common.delete')}
        />
      )}
      <div className="flex flex-col justify-between">
        <PageHeader
          title={t('categories.categories')}
          subtitle={t('categories.strapLine')}
        />
      </div>
      <div className="mt-4 grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-8">
          <Button
            className="mb-2 gap-2"
            onClick={() => {
              setAddEditDialogOpen(true);
            }}
          >
            <CirclePlus className="size-5" />
            {t('categories.addCategoryCTA')}
          </Button>
        </div>
        <div className="col-span-12 flex justify-end md:col-span-4">
          <div className="w-full space-y-2 md:max-w-xs">
            <Label htmlFor="search-categories">{t('common.search')}</Label>
            <div className="relative">
              <Input
                id="search-categories"
                className="pr-10"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  handleSearchChange(event);
                }}
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>
        <div className="col-span-12">
          <MyFinStaticTable
            isRefetching={getCategoriesRequest.isRefetching}
            rows={rows}
            columns={columns}
            paginationModel={{ pageSize: 20 }}
            onRowClicked={(id) => {
              const category = categories.find((cat) => cat.category_id == id);
              if (!category) return;
              handleEditButtonClick(category);
            }}
          />
        </div>
      </div>
    </Card>
  );
};

export default Categories;
