/* eslint-disable jsx-a11y/anchor-is-valid */
import { Grid, Link } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import React, { useCallback, useContext, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { LocalStorageState, network } from '../../constants/environment';
import { StepsContext } from '../../context/StepsContext';
import { UtilsContext } from '../../context/UtilsContext';
import { selectSendCurrency } from '../../services/submarine/submarineSelectors';
import confirmAlert from '../../utils/confirmAlert';
import svgIcons from '../../utils/svgIcons';
import OpendexLogo from '../../components/Logo';
import { makeStyles, createStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme =>
  createStyles({
    root: { padding: '1rem 2rem' },
    navLink: {
      color: theme.palette.text.primary,
      fontSize: '1.25rem',
    },
  })
);

export default () => {
  const classes = useStyles();
  const history = useHistory();
  const isRefund = history?.location?.pathname === '/refund';

  const [open, setOpen] = useState(false);

  const anchorRef = useRef(null);

  const { setReverseActiveStep, setSubmarineActiveStep, setRefundActiveStep } =
    useContext(StepsContext);
  const utilsContext = useContext(UtilsContext);
  const isMobileView = !!utilsContext?.isMobileView;

  const sendCurrency = useSelector(selectSendCurrency);

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen);
  };

  const handleClose = event => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }

    setOpen(false);
  };

  function handleListKeyDown(event) {
    if (event.key === 'Tab') {
      event.preventDefault();
      setOpen(false);
    }
  }

  // return focus to the button when we transitioned from !open -> open
  const prevOpen = React.useRef(open);
  React.useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current.focus();
    }

    prevOpen.current = open;
  }, [open]);

  const onLogoClick = () => {
    if ((sendCurrency && confirmAlert()) || !sendCurrency) {
      history.push('/');
      setReverseActiveStep(1);
      setSubmarineActiveStep(0);
      setRefundActiveStep(0);
      localStorage.removeItem(LocalStorageState.ActiveSwap);
      localStorage.removeItem(LocalStorageState.ExtraDetails);
      localStorage.removeItem(LocalStorageState.CurrentSubmarineState);
      localStorage.removeItem(LocalStorageState.CurrentReverseState);
    }
  };

  const onMenuItemClick = useCallback(
    path => () => {
      history.push(path);
    },
    [history]
  );

  const getNavBarLinks = () => [
    <Link
      className={classes.navLink}
      href="https://discord.gg/aS5RMchDrU"
      target="_blank"
      rel="noopener noreferrer"
    >
      Community
    </Link>,
    <Link
      className={classes.navLink}
      href="https://github.com/opendexnetwork/opendex.app"
      target="_blank"
      rel="noopener noreferrer"
    >
      Github
    </Link>,
  ];

  return (
    <Grid
      container
      justify="space-between"
      direction="row"
      alignItems="center"
      className={classes.root}
    >
      <OpendexLogo network={network} onClick={onLogoClick} />
      <Grid item xs={3} sm={3} md={3} lg={3} xl={3}>
        {!isMobileView ? (
          <Grid
            container
            spacing={1}
            justify="flex-end"
            direction="row"
            alignItems="center"
          >
            {getNavBarLinks().map(link => (
              <Grid item>{link}</Grid>
            ))}
          </Grid>
        ) : null}
        {isMobileView && (
          <div className="mobile-view-menu">
            <Button
              ref={anchorRef}
              aria-controls={open ? 'menu-list-grow' : undefined}
              aria-haspopup="true"
              onClick={handleToggle}
            >
              {open && <img src={svgIcons.close} alt="" />}
              {!open && <img src={svgIcons.hamburger} alt="" />}
            </Button>
            <Popper
              open={open}
              anchorEl={anchorRef.current}
              role={undefined}
              transition
              disablePortal
              className="menu-popup"
            >
              {({ TransitionProps, placement }) => (
                <Grow
                  {...TransitionProps}
                  style={{
                    transformOrigin:
                      placement === 'bottom' ? 'center top' : 'center bottom',
                  }}
                >
                  <Paper>
                    <ClickAwayListener onClickAway={handleClose}>
                      <MenuList
                        autoFocusItem={open}
                        id="menu-list-grow"
                        onKeyDown={handleListKeyDown}
                      >
                        {isRefund ? (
                          <MenuItem onClick={handleClose}>
                            <a onClick={onMenuItemClick('/')}>Swap</a>
                          </MenuItem>
                        ) : (
                          <MenuItem onClick={handleClose}>
                            <a onClick={onMenuItemClick('/refund')}>Refund</a>
                          </MenuItem>
                        )}
                        {getNavBarLinks().map(link => (
                          <MenuItem key={link} onClick={handleClose}>
                            {' '}
                            {link}{' '}
                          </MenuItem>
                        ))}
                      </MenuList>
                    </ClickAwayListener>
                  </Paper>
                </Grow>
              )}
            </Popper>
          </div>
        )}
      </Grid>
    </Grid>
  );
};
