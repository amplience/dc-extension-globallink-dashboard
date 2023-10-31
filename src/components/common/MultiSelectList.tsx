import React, { useEffect } from 'react';
import {
  createStyles,
  makeStyles,
  ListSubheader,
  ListItem,
  List,
  ListItemText,
  Typography,
  Box,
} from '@material-ui/core';
import ReactCountryFlag from 'react-country-flag';
import { getCountryCode } from '../../utils/locale';

interface ListInterface {
  locale_label: string;
  connector_locale: string;
}

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      width: '100%',
      maxHeight: 260,
      overflow: 'auto',
      border: '1px solid rgba(0, 0, 0, 0.09)',
      borderRadius: 4,
    },
    subheader: {
      background: '#fff',
      borderBottom: '1px solid rgba(0, 0, 0, 0.09)',
      paddingTop: 20,
      marginBottom: 10,
    },
  })
);

const MultiSelectList = ({
  locales = [],
  changeTargetLocales,
  selectedLocales,
}: {
  locales: ListInterface[];
  selectedLocales: string[];
  changeTargetLocales: (locales: string[]) => void;
}) => {
  const classes = useStyles();
  const [checked, setChecked] = React.useState<string[]>(selectedLocales || []);

  useEffect(() => {
    if (selectedLocales) {
      setChecked(selectedLocales);
    }
  }, [selectedLocales]);

  const handleToggle = (value: string) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    if (changeTargetLocales) {
      changeTargetLocales(newChecked);
    }

    setChecked(newChecked);
  };

  return (
    <List
      className={classes.root}
      subheader={
        <ListSubheader classes={{ root: classes.subheader }} component="div">
          <Box style={{ display: 'flex' }}>
            <Typography>Target Locales</Typography>
            <div>&nbsp;</div>
            <Typography style={{ verticalAlign: 'top' }}>*</Typography>
          </Box>
        </ListSubheader>
      }
    >
      {locales.map(({ locale_label, connector_locale }) => {
        const labelId = `check-list-label-${connector_locale}`;

        return (
          <ListItem
            key={connector_locale}
            role={undefined}
            dense
            button
            onClick={handleToggle(connector_locale)}
            className={
              checked.indexOf(connector_locale) !== -1 ? 'selected-item' : ''
            }
          >
            <ReactCountryFlag
              countryCode={getCountryCode(connector_locale)}
              style={{ marginRight: 4 }}
            />
            <ListItemText
              id={labelId}
              primary={`${locale_label} (${connector_locale})`}
            />
          </ListItem>
        );
      })}
    </List>
  );
};

export default MultiSelectList;
