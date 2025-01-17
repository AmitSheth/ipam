import * as React from "react";
import { useDispatch } from 'react-redux';

import { useSnackbar } from "notistack";

import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";

import {
  Box,
  Button,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  // CircularProgress
} from "@mui/material";

import LoadingButton from '@mui/lab/LoadingButton';

import { updateSpaceAsync } from "../../../ipam/ipamSlice";

import { apiRequest } from "../../../../msal/authConfig";

export default function EditSpace(props) {
  const { open, handleClose, space, spaces } = props;

  const { instance, accounts } = useMsal();
  const { enqueueSnackbar } = useSnackbar();

  const [spaceName, setSpaceName] = React.useState({ value: "", error: false });
  const [description, setDescription] = React.useState({ value: "", error: false });
  const [sending, setSending] = React.useState(false);

  const dispatch = useDispatch();

  const invalidForm = spaceName.value
                      && !spaceName.error
                      && description.value
                      && !description.error ? false : true;

  React.useEffect(() => {
    if(space) {
      setSpaceName({
        value: space.name,
        error: false
      });

      setDescription({
        value: space.desc,
        error: false
      });
    } else {
      setSpaceName({
        value: "",
        error: false
      });

      setDescription({
        value: "",
        error: false
      });
    }
  }, [space]);

  function onCancel() {
    setSpaceName({ value: space.name, error: false });
    setDescription({ value: space.desc, error: false });
    handleClose();
  }

  function onSubmit() {
    var body = [
      { "op": "replace", "path": "/name", "value": spaceName.value },
      { "op": "replace", "path": "/desc", "value": description.value }
    ];

    const request = {
      scopes: apiRequest.scopes,
      account: accounts[0],
    };

    (async () => {
      try {
        setSending(true);
        const response = await instance.acquireTokenSilent(request);
        await dispatch(updateSpaceAsync({ token: response.accessToken, space: space.name, body: body}));
        enqueueSnackbar("Successfully updated Space", { variant: "success" });
        onCancel();
      } catch (e) {
        if (e instanceof InteractionRequiredAuthError) {
          instance.acquireTokenRedirect(request);
        } else {
          console.log("ERROR");
          console.log("------------------");
          console.log(e);
          console.log("------------------");
          enqueueSnackbar("Error updating space", { variant: "error" });
        }
      } finally {
        setSending(false);
      }
    })();
  }

  function onNameChange(event) {
    setSpaceName({
      value: event.target.value,
      error: validateName(event.target.value),
    });
  }

  function validateName(name) {
    return spaces.some((e) => e.name.toLowerCase() === name.toLowerCase())
           && name.toLowerCase() !== space.name.toLowerCase()
           ? true
           : false;
  }

  function onDescriptionChange(event) {
    setDescription({
      value: event.target.value,
      error: validateDescription(event.target.value),
    });
  }

  function validateDescription(description) {
    const regex = new RegExp(
      //eslint-disable-next-line
      "^([a-zA-Z0-9 \._-]){1,32}$"
    );

    return description ? !regex.test(description) : false;
  }

  return (
    <div sx={{ height: "300px", width: "100%" }}>
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>
          Edit Space
          {/* <Box sx={{ display: 'flex', flexDirection: 'row', height: '32px', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', marginRight: 'auto' }}>
              Edit Space
            </Box>
            <Box sx={{ display: 'flex', visibility: sending ? 'visible' : 'hidden' }}>
              <CircularProgress size={32} />
            </Box>
          </Box> */}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" alignItems="center">
            <Tooltip
              arrow
              disableFocusListener
              placement="right"
              title={
                <>
                  - Space name must be unique
                  <br />- Can contain alphnumerics
                </>
              }
            >
              <TextField
                autoFocus
                error={spaceName.error}
                margin="dense"
                id="name"
                label="Space Name"
                type="name"
                variant="standard"
                sx={{ width: "80%" }}
                value={spaceName.value}
                onChange={(event) => {
                  onNameChange(event);
                }}
              />
            </Tooltip>
            <Tooltip
              arrow
              disableFocusListener
              placement="right"
              title={
                <>
                  - Max of 32 characters
                  <br />- Can contain alphnumerics
                  <br />- Can contain spaces
                  <br />- Can underscore, hypen, and period
                </>
              }
            >
              <TextField
                error={description.error}
                margin="dense"
                id="name"
                label="Space Description"
                type="description"
                variant="standard"
                value={description.value}
                onChange={(event) => onDescriptionChange(event)}
                sx={{ width: "80%" }}
              />
            </Tooltip>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel}>Cancel</Button>
          <LoadingButton onClick={onSubmit} loading={sending} disabled={invalidForm}>
            Update
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
