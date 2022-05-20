import { useEffect, useState } from 'react';
import { loadKubeContext } from './utils/OcUtils';
import { Card, CardHeader, CardContent, IconButton, List, ListItem, ListItemText, Box, Button, Tooltip } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import { UnknownKubeContext } from './models/KubeContext';
import { openInBrowser } from './utils/UIUtils';
import { LoginDialog } from './dialogs/login';
import { ChangeContext } from './dialogs/changeContext';
import { EditRounded } from '@mui/icons-material';
import { LoginRounded } from '@mui/icons-material';
import { ChangeProject } from './dialogs/changeProject';
import { useRecoilState } from 'recoil';
import { currentContextState } from './state/currentContextState';

export default function CurrentContext() {
  const [loading, setLoading] = useState(true);
  const [currentContext, setCurrentContext] = useRecoilState(currentContextState);
  const [expanded, setExpanded] = useState(false);

  const handleLogin = () => {
    showLoginDialog();
  };

  const handleChangeContext = async () => {
    showChangeContextDialog();
    await loadContext();
  };

  const handleChangeProject = () => {
    showChangeProjectDialog();
  };

  const handleExpand = () => {
    setExpanded(!expanded);
  }

  let showLoginDialog: () => void;
  let loginDialogClosed: (value: string) => void;
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

  async function loadContext(): Promise<void> {
    const context = await loadKubeContext();
    setCurrentContext(context);
  }

  const onLogin = () => {
    loadContext();
  }

  useEffect(() => {
    if (loading) {
      loadContext();
    }
  }, []);

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
                  onClick={handleExpand}>
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
      <LoginDialog install={installDialog} onLogin={onLogin} />
      <ChangeContext install={installChangeContextDialog} onContextChange={loadContext} showLoginDialog={handleLogin} />
      <ChangeProject install={installChangeProjectDialog} onProjectChange={loadContext} />
    </>
  );
}