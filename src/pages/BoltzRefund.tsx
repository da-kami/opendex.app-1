import { createStyles, Grid, makeStyles } from '@material-ui/core';
import React, { ReactElement } from 'react';
import BoltzSwapStep from '../components/BoltzSwapStep';
import CardComponent from '../components/Card';
import Title from '../components/Title';
import Layout from '../layout/main';

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      display: 'flex',
      'flex-direction': 'column',
      'justify-content': 'space-between',
      flex: 1,
    },
  })
);

const BoltzRefund = (): ReactElement => {
  const classes = useStyles();

  return (
    <Layout>
      <Grid container direction="column" wrap="nowrap" alignItems="center">
        <Title>CROSS-CHAIN DEX AGGREGATOR</Title>
        <Grid item container direction="column" wrap="nowrap">
          <CardComponent>
            <div className={classes.root}>
              <BoltzSwapStep title="Refund" content={<p>Claim your coins</p>} />
            </div>
          </CardComponent>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default BoltzRefund;
