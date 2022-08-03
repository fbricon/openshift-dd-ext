import { LoginRounded } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import { Box, Button, Card, CardContent, CardHeader, IconButton, Tooltip } from "@mui/material";
import { Suspense, useState } from 'react';
import { useRecoilRefresher_UNSTABLE, useRecoilValue } from 'recoil';
import ConsoleButton from './components/consoleButton';
import { ChangeContext } from './dialogs/changeContext';
import { ChangeProject } from './dialogs/changeProject';
import { LoginDialog } from './dialogs/login';
import { UnknownKubeContext } from './models/KubeContext';
import { currentContextState } from './state/currentContextState';
import { openInBrowser } from './utils/UIUtils';

export function CurrentContext() {
  const currentContext = useRecoilValue(currentContextState);
  const [expanded, setExpanded] = useState(false);
  const refreshContext = useRecoilRefresher_UNSTABLE(currentContextState);
  
  const handleLogin = () => {
    showLoginDialog();
  };

  const handleChangeContext = async () => {
    showChangeContextDialog();
  };

  const handleChangeProject = () => {
    showChangeProjectDialog();
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  }

  let showLoginDialog: () => void;
  let showChangeContextDialog: () => void;
  let showChangeProjectDialog: () => void;

  const installDialog = (showDialogHandler: () => void) => {
    showLoginDialog = showDialogHandler;
  }

  const installChangeContextDialog = (showDialogHandler: () => void) => {
    showChangeContextDialog = showDialogHandler;
  }

  const installChangeProjectDialog = (showDialogHandler: () => void) => {
    showChangeProjectDialog = showDialogHandler;
  }

  function openClusterPage() {
    if (currentContext.clusterUrl) {
      openInBrowser(currentContext.clusterUrl);
    }
  }

  const styles = {
    link: {
      color: '#00bcd4',
    }
  }

  const subHeader = (currentContext === UnknownKubeContext) ? "No context selected" : "Current context";

  return (
    <>
      <Card>
        <CardHeader
          action={
            <>
              <Suspense fallback="...">
                <ConsoleButton />
              </Suspense>
              <Tooltip title='Login to an OpenShift cluster' placement='bottom-end'>
                <IconButton
                  aria-label="action"
                  onClick={handleLogin}>
                  <LoginRounded />
                </IconButton>
              </Tooltip>
              <Tooltip title='Change context' placement='bottom-end'>
                <IconButton
                  aria-label="action"
                  onClick={handleChangeContext}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={expanded ? "Collapse context details" : "Expand context details"} placement='bottom-end' >
                <IconButton
                  onClick={toggleExpand}
                  disabled={currentContext === UnknownKubeContext}
                  >
                  {(expanded) && (
                    <ExpandLessRounded />
                  )}
                  {(!expanded) && (
                    <ExpandMoreRounded />
                  )}
                </IconButton>
              </Tooltip>
            </>
          }
          title={
            currentContext.name
          }
          subheader={subHeader}
        />
        <CardContent hidden={!expanded} sx={{ paddingTop: "0px" }}>
          <Box><b>Server:</b> <a onClick={openClusterPage} href="" style={styles.link}>{currentContext.clusterUrl}</a></Box>
          <Box><b>User:</b> {currentContext.user}</Box>
          <Box><b>Project:</b> {currentContext.project}
            {(currentContext !== UnknownKubeContext) && (
              <Tooltip title='Select a different project to deploy to'>
                <Button sx={{ padding: 0 }} size="small" onClick={handleChangeProject}>Change</Button>
              </Tooltip>
            )}
          </Box>
        </CardContent>
      </Card >
      <LoginDialog install={installDialog} onLogin={refreshContext} />
      <ChangeContext install={installChangeContextDialog} onContextChange={refreshContext} showLoginDialog={handleLogin} />
      <ChangeProject install={installChangeProjectDialog} onProjectChange={refreshContext} />
    </>
  );
}

// Stub for the current context card, to minimize look'n feel disruption
export function LoadingCurrentContext() {
  return (
    <>
      <Card>
        <CardHeader
          title="Loading context..."
          subheader="Please wait..."
          action={
            <>
                <IconButton>
                  <LoginRounded />
                </IconButton>
                <IconButton
                  aria-label="action"
                  disabled>
                  <EditIcon />
                </IconButton>
                <IconButton disabled>
                    <ExpandMoreRounded />
                </IconButton>
            </>
          }
        />
      </Card >
    </>
  );
}