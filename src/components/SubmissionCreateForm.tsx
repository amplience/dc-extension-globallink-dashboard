import React, { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  makeStyles,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Divider,
  Button,
} from '@material-ui/core';
import { DatePicker } from '@material-ui/pickers';
import { useDispatch, useSelector } from 'react-redux';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { RootState } from '../store/store';
import {
  LoadingsInterface,
  ProjectStateInterface,
  SDKInterface,
  UserInterface,
} from '../types/types';
import MultiSelectList from './common/MultiSelectList';
import ContentItems from './ContentItems';
import { createSubmission } from '../store/submissions/submissions.actions';
import Loader from './common/Loader';
import { setError } from '../store/error/error.actions';

const useStyles = makeStyles(() => ({
  paper: {
    padding: '20px',
    width: '40%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    position: 'relative',
  },
  paperAlt: {
    padding: '20px',
    width: '60%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    position: 'relative',
  },
  container: {
    display: 'flex',
    height: 'calc(100vh - 70px)',
  },
  formControl: {
    display: 'block',
    width: 400,
    marginTop: 30,
    '& > div': {
      width: '100%',
    },
  },
  divider: {
    margin: '20px 0',
  },
  submitButton: {
    position: 'absolute',
    right: 28,
    top: 14,
  },
  select: {},
}));

const SubmissionCreateForm = () => {
  const dispatch = useDispatch();
  const prevSubmitter = localStorage.getItem('submission_submitter');
  const classes = useStyles();
  const [submitter, setSubmitter] = React.useState<any>(
    prevSubmitter ? JSON.parse(prevSubmitter) : null
  );
  const [selectedTemplate, setTemplate] = useState<any>(null);
  const [selectedContent, setSelectedContent] = useState<string[]>([]);
  const { selectedProjectConfig }: ProjectStateInterface = useSelector(
    (state: RootState) => state.projects
  );
  const {
    params: { templates, dueDate: dueDateParam },
  }: SDKInterface = useSelector((state: RootState) => state.sdk);
  const { data }: { data: UserInterface[] } = useSelector(
    (state: RootState) => state.users
  );
  const { create }: LoadingsInterface = useSelector(
    (state: RootState) => state.loadings
  );
  const sourceLocales = selectedProjectConfig.supported_locales.filter(
    ({ is_source }: any) => is_source
  );
  const targetLocales = selectedProjectConfig.supported_locales.filter(
    ({ is_source }: any) => !is_source
  );
  const defaultData = {
    workflow: '',
    sourceLocale: '',
    name: `Submission-${new Date().getTime()}`,
    additionalInstruction: '',
    dueDate: new Date(
      new Date().getTime() + dueDateParam * 24 * 60 * 60 * 1000
    ),
    targetLocales: [],
    additional: {},
    config: {},
  };
  const [formValues, setFormValues] = useState<any>(defaultData);

  const onSubmit = (e: any) => {
    e.preventDefault();
    if (!selectedContent || !selectedContent.length) {
      dispatch(setError('Select Content to translate, please'));

      return false;
    }

    if (!formValues.targetLocales || !formValues.targetLocales.length) {
      dispatch(setError('Select Target locales to translate, please'));
      return false;
    }

    return dispatch(
      createSubmission({
        ...formValues,
        submitter:
          formValues.submitter ||
          (submitter
            ? `${submitter.firstName} ${submitter.lastName}`
            : 'Amplience'),
        contentItems: selectedContent,
      })
    );
  };

  const handleChange = (e: any) => {
    const { name } = e.target;
    const { value } = e.target;

    setFormValues({
      ...formValues,
      [name]: value,
    });
  };

  const handleSetSubmitter = (_e, newValue) => {
    setSubmitter(newValue);
    setFormValues({
      ...formValues,
      submitter: newValue
        ? `${newValue.firstName} ${newValue.lastName}`
        : 'Amplience',
    });
    localStorage.setItem('submission_submitter', JSON.stringify(newValue));
  };
  const handleSetTemplate = (event) => {
    const template = templates.find(
      ({ name }: any) => name === event.target.value
    );

    setTemplate(template);

    if (template) {
      return setFormValues({
        ...formValues,
        workflow: template.workflow,
        sourceLocale: template.sourceLocale,
        targetLocales: template.targetLocales,
        additionalInstructions: template.additionalInstructions,
        additional: template.customParameters || {},
        config: template.customConfig || {},
      });
    }
    return setFormValues({
      ...formValues,
      workflow: '',
      sourceLocale: '',
      targetLocales: [],
      additionalInstructions: '',
      additional: {},
      config: {},
    });
  };
  const handleSetAdditional = (e, key, keyVal = 'additional') => {
    setFormValues({
      ...formValues,
      [keyVal]: {
        ...formValues[keyVal],
        [key]: e.target.value,
      },
    });
  };
  return (
    <form onSubmit={onSubmit}>
      {create ? <Loader className="content-loader" /> : null}
      <Button
        variant="contained"
        color="primary"
        type="submit"
        className={classes.submitButton}
      >
        Create
      </Button>
      <div id="createForm" className={classes.container}>
        <Paper
          elevation={1}
          variant="outlined"
          square
          classes={{ root: classes.paper }}
        >
          <Typography variant="h5">New Submission Details</Typography>
          <FormControl className={classes.formControl}>
            <TextField
              label="Name"
              required
              name="name"
              value={formValues.name}
              onChange={handleChange}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </FormControl>
          <FormControl className={classes.formControl}>
            <DatePicker
              autoOk
              variant="inline"
              format="dd/MM/yyyy"
              margin="normal"
              id="date-picker-inline"
              label="Due Date"
              name="dueDate"
              minDate={new Date()}
              value={formValues.dueDate}
              onChange={(date) => {
                setFormValues({
                  ...formValues,
                  dueDate: date,
                });
              }}
            />
          </FormControl>
          <FormControl className={classes.formControl}>
            <Autocomplete
              options={data}
              getOptionLabel={(option: any) =>
                option ? `${option.firstName} ${option.lastName}` : ''
              }
              id="submitter"
              value={submitter}
              onChange={handleSetSubmitter}
              renderInput={(params) => (
                <TextField {...params} label="Submitter" margin="normal" />
              )}
            />
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel id="template-label">Template</InputLabel>
            <Select
              labelId="template-label"
              label="Template"
              classes={{ outlined: classes.select }}
              value={selectedTemplate ? selectedTemplate.name : ''}
              onChange={handleSetTemplate}
            >
              <MenuItem value="">None</MenuItem>
              {templates.map(({ name }: any) => (
                <MenuItem value={name} key={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel id="workflow-label">Workflow</InputLabel>
            <Select
              labelId="workflow-label"
              label="Workflow"
              name="workflow"
              required
              value={formValues.workflow}
              onChange={handleChange}
              classes={{ outlined: classes.select }}
            >
              {selectedProjectConfig &&
                selectedProjectConfig.workflows &&
                selectedProjectConfig.workflows.map((label: string) => (
                  <MenuItem value={label} key={label}>
                    {label}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel id="source-locale-label">Source Locale</InputLabel>
            <Select
              labelId="source-locale-label"
              label="Source Locale"
              value={formValues.sourceLocale}
              name="sourceLocale"
              required
              onChange={handleChange}
              classes={{ outlined: classes.select }}
            >
              {sourceLocales.map(({ locale_label, connector_locale }: any) => (
                <MenuItem
                  value={connector_locale}
                  key={connector_locale}
                >{`${locale_label} (${connector_locale})`}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl className={classes.formControl}>
            <MultiSelectList
              changeTargetLocales={(locales: string[]) =>
                setFormValues({ ...formValues, targetLocales: locales })
              }
              locales={targetLocales}
              selectedLocales={formValues.targetLocales}
            />
          </FormControl>
          <FormControl className={classes.formControl}>
            <TextField
              label="Additional Instructions"
              multiline
              value={formValues.additionalInstructions}
              rows={3}
              name="additionalInstructions"
              onChange={handleChange}
              variant="outlined"
              InputLabelProps={{
                shrink: true,
              }}
            />
          </FormControl>
          <Divider className={classes.divider} />
          <Typography variant="h5">Custom Parameters</Typography>
          {selectedProjectConfig.submission_options.attributes.map(
            ({
              key,
              name,
              type,
              values,
              enabled,
              is_multiselect,
              is_mandatory,
            }: any) =>
              enabled ? (
                values && values.length ? (
                  <FormControl key={key} className={classes.formControl}>
                    <InputLabel id={`${name}-label`}>{name}</InputLabel>
                    <Select
                      labelId={`${name}-label`}
                      label={name}
                      defaultValue=""
                      multiple={is_multiselect}
                      classes={{ outlined: classes.select }}
                      required={is_mandatory}
                      key={
                        formValues.additional ? formValues.additional[key] : ''
                      }
                      value={
                        formValues.additional ? formValues.additional[key] : ''
                      }
                      name={`additional.${key}`}
                      onChange={(e) => handleSetAdditional(e, key)}
                    >
                      <MenuItem value="">None</MenuItem>
                      {values.map((label: string) => (
                        <MenuItem value={label} key={label}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : type === 'string' ? (
                  <FormControl className={classes.formControl}>
                    <TextField
                      label={name}
                      required={is_mandatory}
                      name={`additional.${key}`}
                      key={name}
                      value={
                        formValues.additional ? formValues.additional[key] : ''
                      }
                      InputLabelProps={{
                        shrink: true,
                      }}
                      onChange={(e) => handleSetAdditional(e, key)}
                    />
                  </FormControl>
                ) : null
              ) : null
          )}

          <Divider className={classes.divider} />
          <Typography variant="h5">Custom Configuration</Typography>
          {selectedProjectConfig.submission_options.config.map(
            ({
              key,
              name,
              type,
              values,
              enabled,
              is_multiselect,
              is_mandatory,
            }: any) =>
              enabled ? (
                values && values.length ? (
                  <FormControl key={key} className={classes.formControl}>
                    <InputLabel id={`${name}-label`}>{name}</InputLabel>
                    <Select
                      labelId={`${name}-label`}
                      label={name}
                      defaultValue=""
                      multiple={is_multiselect}
                      classes={{ outlined: classes.select }}
                      required={is_mandatory}
                      key={formValues.config ? formValues.config[key] : ''}
                      value={formValues.config ? formValues.config[key] : ''}
                      name={`config.${key}`}
                      onChange={(e) => handleSetAdditional(e, key, 'config')}
                    >
                      <MenuItem value="">None</MenuItem>
                      {values.map((label: string) => (
                        <MenuItem value={label} key={label}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : type === 'string' ? (
                  <FormControl className={classes.formControl}>
                    <TextField
                      label={name}
                      required={is_mandatory}
                      name={`config.${key}`}
                      key={name}
                      value={formValues.config ? formValues.config[key] : ''}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      onChange={(e) => handleSetAdditional(e, key, 'config')}
                    />
                  </FormControl>
                ) : null
              ) : null
          )}
        </Paper>
        <Paper
          elevation={1}
          variant="outlined"
          square
          classes={{ root: classes.paperAlt }}
        >
          {formValues.sourceLocale ? (
            <>
              <ContentItems
                selectedContent={selectedContent}
                getSelectedIds={(content: string[]) =>
                  setSelectedContent(content)
                }
                locale={formValues.sourceLocale}
              />
            </>
          ) : null}
        </Paper>
      </div>
    </form>
  );
};

export default SubmissionCreateForm;
