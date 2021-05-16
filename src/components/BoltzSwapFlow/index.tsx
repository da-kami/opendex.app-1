import {
  createStyles,
  Grid,
  makeStyles,
  TextareaAutosize,
  Typography,
} from '@material-ui/core';
import React, { ReactElement } from 'react';
import Button from '../Button';

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      display: 'flex',
      'flex-direction': 'column',
      'justify-content': 'space-between',
      flex: 1,
    },
    content: {
      padding: '2rem',
    },
    text: {
      marginBottom: '1rem',
      fontSize: '1.5rem',
      lineHeight: 'normal',
      letterSpacing: '1px',
    },
  })
);

const BoltzSwapFlow = (): ReactElement => {
  const classes = useStyles();
  const nextDisabled = false;

  return (
    <div className={classes.root}>
      <Grid container className={classes.content} justify="flex-start" direction="column" alignItems="center">
        <Typography className={classes.text} component="h2" align="left">
          Paste invoice for amount
        </Typography>
        <Typography className={classes.text} component="h1" align="left">
          1234567890 satoshis
        </Typography>
        <Grid item xs={12}>
          <TextareaAutosize
            aria-label="Paste invoice for 1234577890"
            rowsMin={4}
            placeholder="Paste invoice for 1234577890"
          />
        </Grid>
      </Grid>
      <Button
        variant="contained"
        color="primary"
        disabled={nextDisabled}
        onClick={() => {}}
      >
        Next
      </Button>
    </div>
  );
};

export default BoltzSwapFlow;
