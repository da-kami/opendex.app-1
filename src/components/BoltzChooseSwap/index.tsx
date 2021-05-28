import {
  createStyles,
  Grid,
  List,
  ListItem,
  ListItemText,
  makeStyles,
  Typography,
} from '@material-ui/core';
import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import { RefundDetails } from '../../constants/boltzSwap';
import {
  convertRefundFile,
  getBoltzSwapsFromLocalStorage,
} from '../../utils/boltzRefund';
import svgIcons from '../../utils/svgIcons';
import Button from '../Button';

type BoltzChooseSwapProps = {
  setErrorMessage: (message: string) => void;
  setRefundDetails: (details?: RefundDetails) => void;
};

const useStyles = makeStyles(() =>
  createStyles({
    list: {
      maxHeight: '10rem',
      width: '100%',
      overflowY: 'auto',
      margin: '1rem 0',
    },
    swapId: {
      paddingRight: '2rem',
    },
    uploadButton: {
      marginTop: '1rem',
    },
    uploadedPlaceholder: {
      minWidth: '2.5rem',
    },
    uploadSuccess: {
      width: '1.5rem',
      marginTop: '1rem',
      marginLeft: '1rem',
    },
    input: {
      display: 'none',
    },
  })
);

const BoltzChooseSwap = (props: BoltzChooseSwapProps): ReactElement => {
  const classes = useStyles();
  const { setErrorMessage, setRefundDetails } = props;
  const [uploadedFile, setUploadedFile] = useState<RefundDetails | undefined>(
    undefined
  );
  const [storedSwaps, setStoredSwaps] = useState<RefundDetails[]>([]);
  const [selectedSwap, setSelectedSwap] = useState('');
  const fileInput: React.RefObject<HTMLInputElement> = useMemo(
    () => React.createRef(),
    []
  );

  useEffect(() => {
    setStoredSwaps(getBoltzSwapsFromLocalStorage().reverse());
  }, []);

  return (
    <>
      <Typography variant="body1" color="textSecondary" component="h6">
        Select from recent swaps
      </Typography>
      <List className={classes.list}>
        {storedSwaps.map(swap => (
          <ListItem
            key={swap.swapId}
            button
            selected={selectedSwap === swap.swapId}
            onClick={() => {
              setSelectedSwap(swap.swapId);
              setUploadedFile(undefined);
              setErrorMessage('');
              setRefundDetails(swap);
            }}
          >
            <ListItemText>
              <Grid item container justify="space-between" alignItems="center">
                <Grid item xs={12} sm={5}>
                  <Typography variant="body2">ID: {swap.swapId}</Typography>
                </Grid>
                <Typography variant="caption">
                  {new Date(swap.date).toLocaleString()}
                </Typography>
              </Grid>
            </ListItemText>
          </ListItem>
        ))}
      </List>
      <Typography variant="body1" color="textSecondary" component="h6">
        Or upload a refund file
      </Typography>
      <Grid item container justify="center" alignItems="center">
        <Grid item className={classes.uploadedPlaceholder}></Grid>
        <Grid item>
          <input
            ref={fileInput}
            accept=".png, .json"
            type="file"
            className={classes.input}
            onChange={event => {
              convertRefundFile(event.target.files![0]).then(details => {
                setUploadedFile(details);
                setErrorMessage(
                  !details ? 'Failed to read swap data from uploaded file' : ''
                );
                setSelectedSwap('');
                setRefundDetails(details);
              });
            }}
          />
          <Button
            variant="outlined"
            color="primary"
            onClick={() => fileInput?.current?.click()}
            className={classes.uploadButton}
          >
            Upload
          </Button>
        </Grid>
        <Grid item className={classes.uploadedPlaceholder}>
          {!!uploadedFile && (
            <img
              className={classes.uploadSuccess}
              src={svgIcons.greenTick}
              alt="Refund file uploaded"
            />
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default BoltzChooseSwap;
