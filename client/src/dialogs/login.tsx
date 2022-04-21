import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import validator from 'validator';
import { loadServerUrls, login, loginWithToken } from '../utils/OcUtils';
import { createDockerDesktopClient } from '@docker/extension-api-client';
import { Box, Tab, Tabs, Typography } from '@mui/material';
interface LoginDialogProps {
  install: (showDialog: () => void) => void;
  onLogin: () => void;
}

interface FieldState {
  value: string;
  helperText: string;
  error: boolean;
}

const CREDENTIALS_TAB = 0;
const TOKEN_TAB = 1;


const DEFAULT_STATUS = { value: '', helperText: '', error: false };

export function LoginDialog(props: LoginDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [cluster, setCluster] = React.useState<FieldState>(DEFAULT_STATUS);
  const [username, setUsername] = React.useState<FieldState>(DEFAULT_STATUS);
  const [password, setPassword] = React.useState<FieldState>(DEFAULT_STATUS);
  const [token, setToken] = React.useState<FieldState>(DEFAULT_STATUS);;
  const [servers, setServers] = React.useState([] as string[]);

  const validateUrl = (value: string): string => {
    return value && validator.isURL(value.trim()) ? '' : 'Invalid Cluster URL';
  }

  const validateUsername = (value: string): string => {
    return value?.trim().length > 0 ? '' : 'Username is empty';
  }

  const validatePassword = (value: string): string => {
    return value?.trim().length > 0 ? '' : 'Password is empty';
  }

  const validateToken = (value: string): string => {
    return value?.trim().length > 0 ? '' : 'Bearer token is empty';
  }

  const isValid = (): boolean => {
    return cluster.value.trim().length > 0 && cluster.helperText === '' &&
      ((tab === CREDENTIALS_TAB && username.helperText === '' && password.helperText === '') // should check username / password are set?
        || (tab === TOKEN_TAB && token.helperText === ''));// should check token is set?
  }

  const handleOnChange = (validator: (value: string) => string, setter: React.Dispatch<React.SetStateAction<FieldState>>, event: any): void => {
    const helperText = validator(event.target.value);
    setter({
      value: event.target.value,
      helperText,
      error: helperText.length > 0
    });
  }

  const ddClient = createDockerDesktopClient();

  const handleLogin = () => {
    const host = cluster.value.split('://')[1];
    let loginPromise: Promise<void>;
    if (tab === TOKEN_TAB) {
      loginPromise = loginWithToken(host, token.value);
    } else {
      loginPromise = login(host, username.value, password.value);
    }
    loginPromise.then(() => {
      ddClient.desktopUI.toast.success(`Sucessfully logged into cluster ${cluster.value}`);
      props.onLogin();
    }).catch((error) => {
      ddClient.desktopUI.toast.error(error);
    });

    handleClose();
  };

  const handleOpen = () => {
    setOpen(true);
    loadServerUrls().then((urls) => {
      setServers(urls);
    })
  }

  const handleClose = () => {
    setOpen(false);
    setCluster(DEFAULT_STATUS);
    setUsername(DEFAULT_STATUS);
    setPassword(DEFAULT_STATUS);
    setToken(DEFAULT_STATUS);
  }

  props.install(handleOpen);

  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }

  function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            <Typography>{children}</Typography>
          </Box>
        )}
      </div>
    );
  }

  function a11yProps(index: number) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  const [tab, setTab] = React.useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const handleClusterPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const content = event.clipboardData.getData('text');
    // eg.
    // oc login https://api.rh-us-east-1.openshift.com --token=FooC8x6u1R591NIYhgNMbdfOUjg8-aD-yt-sQVwcS8Y
    const loginCommand = parseOcLoginCommand(content);
    if (loginCommand) {
      setCluster({ // FIXME this doesn't work from Autocomplete's textfield
        value: loginCommand.cluster,
        helperText: cluster.helperText,
        error: validateUrl(loginCommand.cluster).length > 0
      });
      setToken({
        value: loginCommand.token,
        helperText: token.helperText,
        error: validateToken(loginCommand.token).length > 0
      });
      if (tab !== 1) {
        setTab(1);
      }
      // event.preventDefault();
    }
  }

  interface OcLoginCommand {
    cluster: string;
    token: string;
  }
  const parseOcLoginCommand = (command: string): OcLoginCommand | undefined => {
    const pattern = /oc login (?<cluster>.*) --token=(?<token>.*)/;
    const match = command.match(pattern);
    if (match?.groups) {
      return {
        cluster: match.groups.cluster,
        token: match.groups.token
      }
    }
    return undefined;
  }

  return (
    <div>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Login to OpenShift</DialogTitle>
        <DialogContent>
          <DialogContentText style={{ marginBottom: '15px' }}>
            Provide OpenShift cluster URL, username and password to login.
          </DialogContentText>
          {/* <TextField
            id="foobar"
            label="Standalone Cluster field works"
            type="text"
            fullWidth
            variant="filled"
            onPaste={handleClusterPaste} // onPaste works here
            value={cluster.value}
            helperText={cluster.helperText}
            error={cluster.error} /> */}


          <Autocomplete
            freeSolo
            options={servers}
            onChange={(event, value) => handleOnChange(validateUrl, setCluster, { target: { value } })}
            renderInput={(params) => (
              <TextField {...params}
                sx={{
                  minHeight: "5rem",
                  '& .MuiInputLabel-formControl': {
                    paddingLeft: '10px',
                  }
                }}
                autoFocus
                id="cluster"
                label="Cluster URL"
                type="text"
                fullWidth
                required
                variant="filled"
                onPaste={handleClusterPaste} //FIXME onPaste doesn't work here (setCluster doesn't work)
                onChange={handleOnChange.bind(undefined, validateUrl, setCluster)}
                value={cluster.value}
                helperText={cluster.helperText}
                error={cluster.error} />
            )}
          />
          <Tabs value={tab} aria-label="Authentication options" onChange={handleTabChange}>
            <Tab label="Credentials" {...a11yProps(CREDENTIALS_TAB)} />
            <Tab label="Bearer Token" {...a11yProps(TOKEN_TAB)} />
          </Tabs>
          <TabPanel value={tab} index={CREDENTIALS_TAB}>
            <TextField
              sx={{
                minHeight: "5rem",
                '& .MuiInputLabel-formControl': {
                  paddingLeft: '10px',
                }
              }}
              id="userName"
              label="Username"
              type="text"
              fullWidth
              variant="filled"
              margin="normal"
              required
              onChange={handleOnChange.bind(undefined, validateUsername, setUsername)}
              value={username.value}
              helperText={username.helperText}
              error={username.error}
            />
            <TextField
              sx={{
                verticalAlign: 'top',
                minHeight: "5rem",
                '& .MuiInputLabel-formControl': {
                  paddingLeft: '10px',
                }
              }}
              id="password"
              label="Password"
              type="password"
              fullWidth
              variant="filled"
              margin="normal"
              required
              onChange={handleOnChange.bind(undefined, validatePassword, setPassword)}
              value={password.value}
              helperText={password.helperText}
              error={password.error}
            />
          </TabPanel>
          <TabPanel value={tab} index={TOKEN_TAB}>
            <TextField
              sx={{
                minHeight: "5rem",
                '& .MuiInputLabel-formControl': {
                  paddingLeft: '10px',
                }
              }}
              id="token"
              label="Bearer Token"
              type="text"
              fullWidth
              variant="filled"
              margin="normal"
              required
              onChange={handleOnChange.bind(undefined, validateToken, setToken)}
              value={token.value}
              helperText={token.helperText}
              error={token.error}
            />
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={handleClose}>Cancel</Button>
          <Button variant="contained" disabled={!isValid()} onClick={handleLogin}>Login</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}