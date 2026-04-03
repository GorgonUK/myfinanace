import { useLoading } from '../../providers/LoadingProvider.tsx';
import { useTranslation } from 'react-i18next';
import { useEffect, useReducer } from 'react';
import { ChevronsRight } from 'lucide-react';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';

type UiState = {
  isLoading: boolean;
  username: string;
  email1: string;
  email2: string;
  isNextButtonEnabled: boolean;
};

const enum StateActionType {
  UsernameUpdated,
  Email1Updated,
  Email2Updated,
}

type StateAction =
  | { type: StateActionType.UsernameUpdated; payload: string }
  | { type: StateActionType.Email1Updated; payload: string }
  | { type: StateActionType.Email2Updated; payload: string };

const createInitialState = (): UiState => {
  return {
    isLoading: false,
    username: '',
    email1: '',
    email2: '',
    isNextButtonEnabled: false,
  };
};

const isInputValid = (username: string, email1: string, email2: string) => {
  return username.length > 0 && email1.length > 0 && email2 == email1;
};

const reduceState = (prevState: UiState, action: StateAction): UiState => {
  switch (action.type) {
    case StateActionType.UsernameUpdated:
      return {
        ...prevState,
        username: action.payload,
        isNextButtonEnabled: isInputValid(
          action.payload,
          prevState.email1,
          prevState.email2,
        ),
      };
    case StateActionType.Email1Updated:
      return {
        ...prevState,
        email1: action.payload,
        isNextButtonEnabled: isInputValid(
          prevState.username,
          action.payload,
          prevState.email2,
        ),
      };
    case StateActionType.Email2Updated:
      return {
        ...prevState,
        email2: action.payload,
        isNextButtonEnabled: isInputValid(
          prevState.username,
          prevState.email1,
          action.payload,
        ),
      };
  }
};

type Props = {
  onNext: (username: string, email: string) => void;
};

const SetupStep1 = (props: Props) => {
  const loader = useLoading();
  const { t } = useTranslation();

  const [state, dispatch] = useReducer(reduceState, null, createInitialState);

  useEffect(() => {
    if (state.isLoading) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [state.isLoading]);

  return (
    <div className="p-1">
      <div className="flex flex-col gap-4">
        <p className="pb-8 text-base">{t('setup.step1Description')}</p>
        <div className="space-y-2">
          <Label htmlFor="setup-username">Username</Label>
          <Input
            id="setup-username"
            name="username"
            value={state.username}
            onChange={(e) =>
              dispatch({
                type: StateActionType.UsernameUpdated,
                payload: e.target.value,
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            {t('setup.step1UsernameHelperText')}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="setup-email">Email</Label>
          <Input
            id="setup-email"
            name="email"
            type="email"
            value={state.email1}
            onChange={(e) =>
              dispatch({
                type: StateActionType.Email1Updated,
                payload: e.target.value,
              })
            }
            aria-invalid={state.email1 != state.email2 && state.email2 !== ''}
          />
          <p className="text-xs text-muted-foreground">abc@hooli.xyz</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="setup-email2">
            {t('setup.step1EmailConfirmationLabel')}
          </Label>
          <Input
            id="setup-email2"
            name="email2"
            type="email"
            value={state.email2}
            onChange={(e) =>
              dispatch({
                type: StateActionType.Email2Updated,
                payload: e.target.value,
              })
            }
            aria-invalid={state.email1 != state.email2 && state.email1 !== ''}
          />
          <p className="text-xs text-muted-foreground">abc@hooli.xyz</p>
        </div>
        <div className="mt-4 flex justify-center">
          <Button
            size="lg"
            className="gap-2"
            disabled={!state.isNextButtonEnabled}
            onClick={() => props.onNext(state.username, state.email1)}
          >
            {t('common.next')}
            <ChevronsRight className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SetupStep1;
