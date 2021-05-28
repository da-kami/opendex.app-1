import { createStyles, Grid, makeStyles, Typography } from '@material-ui/core';
import { ReactElement } from 'react';
import svgIcons from '../../utils/svgIcons';

type BoltzRefundResultProps = {
  swapId?: string;
  errorMessage?: string;
};

const useStyles = makeStyles(() =>
  createStyles({
    iconContainer: {
      margin: '1.5rem',
    },
  })
);

const BoltzRefundResult = (props: BoltzRefundResultProps): ReactElement => {
  const { swapId, errorMessage } = props;
  const classes = useStyles();

  const successMessage = `Swap ${swapId} successfully refunded!`;

  return (
    <>
      <Grid item className={classes.iconContainer}>
        {errorMessage ? (
          <img src={svgIcons.snap} alt="aw, snap!" />
        ) : (
          <img src={svgIcons.greenTick} alt="success" />
        )}
      </Grid>
      <Typography variant="body1" align="center">
        {errorMessage ? errorMessage : successMessage}
      </Typography>
    </>
  );
};

export default BoltzRefundResult;
