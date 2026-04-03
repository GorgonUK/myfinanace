import { Formik, Form } from 'formik';
import * as yup from 'yup';
import { useAppTheme } from '@/theme';
import { useNavigate } from 'react-router-dom';
import {
  useAuthStatus,
  useLogin,
  useRegister,
} from '@/hooks/auth';
import {
  ROUTE_DASHBOARD,
  ROUTE_RECOVER_PASSWORD,
  ROUTE_SETUP,
} from '../../providers/RoutesProvider.tsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertSeverity,
  useSnackbar,
} from '../../providers/SnackbarProvider.tsx';
import { useLoading } from '../../providers/LoadingProvider.tsx';
import { AxiosError } from 'axios';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';

const Login = () => {
  const navigate = useNavigate();
  const theme = useAppTheme();
  const loader = useLoading();
  const authStatus = useAuthStatus(true);
  const loginRequest = useLogin();
  const registerRequest = useRegister();
  const { t } = useTranslation();
  const snackbar = useSnackbar();

  const [isLogin, setIsLogin] = useState(true);

  async function handleSubmit(
    username: string,
    password: string,
    email?: string,
  ) {
    if (isLogin) loginRequest.mutate({ username, password });
    else registerRequest.mutate({ username, password, email: email ?? '' });
  }

  const formValidationSchema = yup.object().shape({
    username: yup.string().min(3).required(t('login.fillAllFields')),
    password: yup.string().required(t('login.fillAllFields')),
    showEmail: yup.boolean(),
    email: yup
      .string()
      .email()
      .when('showEmail', (showEmail, schema) => {
        if (showEmail[0] == true)
          return schema.required(t('login.fillAllFields'));
        return schema;
      }),
  });

  useEffect(() => {
    if (loginRequest.isSuccess) {
      navigate(ROUTE_DASHBOARD);
    } else if (loginRequest.isError) {
      snackbar.showSnackbar(
        t('login.wrongCredentialsError'),
        AlertSeverity.ERROR,
      );
    }
  }, [loginRequest.isSuccess, loginRequest.isError]);

  useEffect(() => {
    if (registerRequest.isSuccess) {
      snackbar.showSnackbar(
        t('login.userSuccessfullyAdded'),
        AlertSeverity.SUCCESS,
      );
      setIsLogin(true);
    } else if (registerRequest.isError) {
      const error = registerRequest.error as AxiosError;
      if (error?.response?.status === 401) {
        snackbar.showSnackbar(
          t('login.addUserDisabledError'),
          AlertSeverity.ERROR,
        );
      } else {
        snackbar.showSnackbar(
          t('common.somethingWentWrongTryAgain'),
          AlertSeverity.ERROR,
        );
      }
    }
  }, [registerRequest.isSuccess, registerRequest.isError]);

  useEffect(() => {
    if (authStatus.isAuthenticated) {
      navigate(ROUTE_DASHBOARD);
    }
  }, [authStatus.isAuthenticated]);

  useEffect(() => {
    if (authStatus.needsSetup) {
      navigate(ROUTE_SETUP);
    }
  }, [authStatus.needsSetup]);

  useEffect(() => {
    if (
      loginRequest.isPending ||
      registerRequest.isPending ||
      authStatus.isPending
    ) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [loginRequest.isPending, registerRequest.isPending, authStatus.isPending]);

  return (
    <div>
      <div className="mx-auto max-w-md px-4">
        <div className="flex min-h-screen flex-col items-center justify-center p-6">
          <img
            src={
              theme.palette.mode === 'dark'
                ? '/res/logo_light_plain_transparentbg.png'
                : '/res/logo_dark_transparentbg.png'
            }
            width="65%"
            className="mb-5"
            alt=""
          />
          <Formik
            initialValues={{
              username: '',
              password: '',
              email: '',
              showEmail: !isLogin,
            }}
            validationSchema={formValidationSchema}
            onSubmit={(values) =>
              handleSubmit(values.username, values.password, values.email)
            }
          >
            {(props) => {
              return (
                <Form className="w-full space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        value={props.values.email}
                        onChange={props.handleChange}
                        onBlur={props.handleBlur}
                        aria-invalid={
                          props.touched.email && Boolean(props.errors.email)
                        }
                      />
                      {props.touched.email && props.errors.email ? (
                        <p className="text-sm text-destructive">
                          {props.errors.email}
                        </p>
                      ) : null}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="username">{t('login.username')}</Label>
                    <Input
                      id="username"
                      name="username"
                      value={props.values.username}
                      onChange={props.handleChange}
                      onBlur={props.handleBlur}
                      aria-invalid={
                        props.touched.username &&
                        Boolean(props.errors.username)
                      }
                    />
                    {props.touched.username && props.errors.username ? (
                      <p className="text-sm text-destructive">
                        {props.errors.username}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={props.values.password}
                      onChange={props.handleChange}
                      onBlur={props.handleBlur}
                      aria-invalid={
                        props.touched.password &&
                        Boolean(props.errors.password)
                      }
                    />
                    {props.touched.password && props.errors.password ? (
                      <p className="text-sm text-destructive">
                        {props.errors.password}
                      </p>
                    ) : null}
                  </div>
                  <Button type="submit" className="mt-4 w-full">
                    {t(isLogin ? 'login.signIn' : 'login.signUp')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      props.values.showEmail = !props.values.showEmail;
                      setIsLogin(!isLogin);
                    }}
                  >
                    {isLogin
                      ? t('login.signUp')
                      : t('login.alreadyRegisteredQuestion')}
                  </Button>
                  {!props.values.showEmail && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        navigate(ROUTE_RECOVER_PASSWORD);
                      }}
                    >
                      {t('login.forgotYourPassword')}
                    </Button>
                  )}
                </Form>
              );
            }}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default Login;
