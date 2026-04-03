import { useLoading } from '../../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../../providers/SnackbarProvider.tsx';
import { useTranslation } from 'react-i18next';
import {
  ProjectionStatsItem,
  useGetProjectionStats,
} from '@/hooks/stats';
import { useEffect, useReducer } from 'react';
import ProjectionsList from './ProjectionsList.tsx';
import ProjectionsChart from './ProjectionsChart.tsx';

type UiState = {
  isLoading: boolean;
  statData?: ProjectionStatsItem[];
};

const enum StateActionType {
  DataLoaded,
}

type StateAction = {
  type: StateActionType.DataLoaded;
  payload: ProjectionStatsItem[];
};

const createInitialState = (): UiState => {
  return {
    isLoading: true,
  };
};

const reduceState = (prevState: UiState, action: StateAction): UiState => {
  switch (action.type) {
    case StateActionType.DataLoaded:
      return {
        ...prevState,
        isLoading: false,
        statData: action.payload,
      };
  }
};

const ProjectionsStats = () => {
  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();

  const getProjectionStatsRequest = useGetProjectionStats();

  const [state, dispatch] = useReducer(reduceState, null, createInitialState);

  // Loading
  useEffect(() => {
    if (state.isLoading) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [state.isLoading]);

  // Error
  useEffect(() => {
    if (getProjectionStatsRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [getProjectionStatsRequest.isError]);

  // Success
  useEffect(() => {
    if (!getProjectionStatsRequest.data) return;
    dispatch({
      type: StateActionType.DataLoaded,
      payload: getProjectionStatsRequest.data,
    });
  }, [getProjectionStatsRequest.data]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12">
        <ProjectionsChart list={state.statData ?? []} />
      </div>
      <div className="col-span-12 mt-4">
        <ProjectionsList list={state.statData ?? []} />
      </div>
    </div>
  );
};

export default ProjectionsStats;
