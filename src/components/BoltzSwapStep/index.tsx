import { createStyles, Grid, makeStyles, Typography } from '@material-ui/core';
import React, { ReactElement } from 'react';
import Button from '../Button';
import ErrorMessage from '../ErrorMessage';

type BoltzSwapStepProps = {
  content: ReactElement;
  title: string | ReactElement;
  errorMessage?: string;
  mainButtonText?: string;
  mainButtonVisible?: boolean;
  mainButtonDisabled?: boolean;
  onMainButtonClick?: () => void;
};

const useStyles = makeStyles(() =>
  createStyles({
    content: {
      padding: '2rem',
    },
    title: {
      marginBottom: '1rem',
      fontSize: '1.5rem',
      lineHeight: 'normal',
      letterSpacing: '1px',
    },
  })
);

const BoltzSwapStep = (props: BoltzSwapStepProps): ReactElement => {
  const classes = useStyles();
  const {
    content,
    title,
    errorMessage,
    mainButtonText,
    mainButtonVisible,
    mainButtonDisabled,
    onMainButtonClick,
  } = props;

  return (
    <>
      <Grid
        container
        className={classes.content}
        justify="flex-start"
        direction="column"
        alignItems="center"
      >
        <Typography className={classes.title} component="h2" align="center">
          {title}
        </Typography>
        {content}
      </Grid>
      {!!errorMessage && <ErrorMessage message={errorMessage} />}
      {mainButtonVisible && (
        <Button
          variant="contained"
          color="primary"
          disabled={mainButtonDisabled}
          onClick={onMainButtonClick}
        >
          {mainButtonText}
        </Button>
      )}
    </>
  );
};

export default BoltzSwapStep;
