import {
  AppBar,
  Grid,
  isWidthUp,
  Toolbar,
  WithWidth,
  withWidth,
} from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Divider from '../Divider';
import Logo from '../Logo/';
import Menu from '../Menu';
import React from 'react';

const useStyles = makeStyles(() =>
  createStyles({
    toolbar: {
      flexWrap: 'wrap',
    },
  })
);

export type NavBarProps = WithWidth & {};

const NavBar = (props: NavBarProps) => {
  const classes = useStyles();
  const { width } = props;

  return (
    <div>
      <AppBar elevation={0} color="transparent" position="static">
        <Toolbar classes={{ root: classes.toolbar }}>
          <Grid
            justify="space-between"
            container
            direction={isWidthUp('sm', width) ? 'row' : 'row-reverse'}
            alignItems="center"
          >
            <Logo />
            <Grid item>
              <Menu />
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
      <Divider />
    </div>
  );
};

export default withWidth()(NavBar);
