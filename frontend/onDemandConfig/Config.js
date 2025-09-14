import React from 'react';
import moment from 'moment';
import { isEmpty } from 'lodash';
import { toast } from 'react-toastify';
import { exportToCsv } from '../utils/utilities';
import ScorchPropTypes from '../proptypes/scorch';
import batchService from '../backend/batchService';
import { withCurrentUser } from '../components/currentUser';

const PARAM_CONFIG_NAME = 'ODR_PARAM_CONFIG';
const PARAM_DEFINITION_NAME = 'ODR_PARAM_DEFINITION';
const PARAM_CONFIG_FILE_NAME = `${PARAM_CONFIG_NAME}.csv`;
const PARAM_DEFINITION_FILE_NAME = `${PARAM_DEFINITION_NAME}.csv`;

/* eslint-disable class-methods-use-this */
class Config extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fileNames: [],
      isImportEnabled: props.currentUser.canWrite,
      isRefreshing: false,
    };

    this.inputRef = React.createRef();
    this.onDragOver = this.onDragOver.bind(this);
    this.onFileDrop = this.onFileDrop.bind(this);
    this.onImportConfigToDatabase = this.onImportConfigToDatabase.bind(this);
    this.onExportConfigFromDatabase = this.onExportConfigFromDatabase.bind(this);
    this.onDataRefresh = this.onDataRefresh.bind(this);
  }

  onDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  onFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!this.state.isImportEnabled) {
      return;
    }

    const fileNames = [];
    [...e.dataTransfer.files].forEach((file) => fileNames.push(file.name));

    this.setState({ fileNames });
    this.inputRef.current.files = e.dataTransfer.files;
  }

  // eslint-disable-next-line consistent-return
  async onImportConfigToDatabase() {
    const files = this.inputRef.current.files;
    const fileNames = this.state.fileNames;

    if (isEmpty(files)) {
      return toast.error('No files selected');
    }

    if (!fileNames.includes(PARAM_DEFINITION_FILE_NAME)
      && !fileNames.includes(PARAM_CONFIG_FILE_NAME)
    ) {
      return toast.error(`Incorrect file names. Correct file names should be: ${PARAM_CONFIG_FILE_NAME} and ${PARAM_DEFINITION_FILE_NAME}`);
    }
    try {
      const formData = new FormData();
      [...files].forEach((file) => {
        if (file.name === PARAM_DEFINITION_FILE_NAME) {
          formData.append('paramDefinitionFile', file);
        } else if (file.name === PARAM_CONFIG_FILE_NAME) {
          formData.append('paramConfigFile', file);
        }
      });

      const response = await batchService.importConfigToDb(formData);

      if (!response.ok) {
        throw new Error('Server error');
      }

      toast.success('Successfully imported config to database');
    } catch (e) {
      toast.error(`There was an error during config import: ${e}`);
    }
  }

  async onExportConfigFromDatabase() {
    try {
      const [configParams, definitionParams] = await batchService.exportConfigFromDb();
      const normalizedConfig = configParams.reduce((acc, {
        configName,
        scorchParam,
        defaultValue,
      }) => acc.concat([{
        CONFIG_NAME: configName,
        SCORCH_PARAM: scorchParam,
        DEFAULT_VALUE: defaultValue,
      }]), []);
      const normalizedDefinitions = definitionParams.reduce((acc, {
        aqsType,
        position,
        category,
        label,
        scorchParam,
        value,
        editable,
        tooltip,
      }) => acc.concat([{
        AQS_TYPE: aqsType,
        POSITION: position,
        CATEGORY: category,
        LABEL: label,
        SCORCH_PARAM: scorchParam,
        VALUE: value,
        EDITABLE: editable,
        TOOLTIP: tooltip,
      }]), []);
      const formattedTimestamp = moment().format('YYYYMMDD_hhmmss');

      exportToCsv(`${PARAM_DEFINITION_NAME}_${formattedTimestamp}`, normalizedDefinitions);
      exportToCsv(`${PARAM_CONFIG_NAME}_${formattedTimestamp}`, normalizedConfig);

      toast.success('Successfully exported config from database');
    } catch (e) {
      toast.error(`There was an error during config export: ${e}`);
    }
  }

  async onDataRefresh() {
    try {
      this.setState({ isRefreshing: true });

      await batchService.refreshData();
      toast.success('Successfully refreshed data');
    } catch (e) {
      toast.error(`There was an error during data refresh: ${e}`);
    } finally {
      this.setState({ isRefreshing: false });
    }
  }

  render() {
    const {
      inputRef,
      onDragOver,
      onFileDrop,
      onImportConfigToDatabase,
      onExportConfigFromDatabase,
      onDataRefresh,
    } = this;
    const { fileNames, isImportEnabled, isRefreshing } = this.state;

    return (
      <main>
        <h2 className="display-4">On Demand Risk</h2>
        <section>
          <h3 className="display-5">Config options</h3>
          <p>In order to import config to database, you need to upload valid csv
            files: <b>{PARAM_DEFINITION_NAME}</b> and <b>{PARAM_CONFIG_NAME}</b>.
            You can export one or both files respectively. <br />
            Files marked red <b>will not be imported</b>!
          </p>
          <div
            className={`file-select-dropzone ${isImportEnabled ? '' : 'disabled'}`}
            onDrop={onFileDrop}
            onDragOver={onDragOver}
          >
            {isEmpty(fileNames)
              ? <h4>Drag and drop files here</h4>
              : (
                <>
                  <h4>Selected files:</h4>
                  {fileNames.map((name) => (
                    <p
                      key={name}
                      style={{ color: name === PARAM_CONFIG_FILE_NAME || name === PARAM_DEFINITION_FILE_NAME ? 'green' : 'red' }}
                    >
                      {name}
                    </p>
                  ))}
                </>
              )}
            <input
              ref={inputRef}
              multiple
              type="file"
              accept=".csv"
              className="file-input"
              disabled={!isImportEnabled}
              onChange={(e) => {
                const fNames = [];
                [...e.target.files].forEach((file) => fNames.push(file.name));
                this.setState({ fileNames: fNames });
              }}
            />
            <button
              type="button"
              disabled={!isImportEnabled}
              onClick={() => inputRef.current.click()}
            >
              Choose files to upload
            </button>
          </div>
          <button
            type="button"
            disabled={!isImportEnabled}
            onClick={onImportConfigToDatabase}
            style={{ marginRight: '5px' }}
          >
            Import config to database
          </button>
          <button type="button" onClick={onExportConfigFromDatabase}>Export config from database</button>
        </section>
        <section>
          <h3 className="display-5">Refresh data</h3>
          <p>Push synchronisation of config in Falcon GUI.</p>
          <button
            type="button"
            onClick={onDataRefresh}
            disabled={isRefreshing || !isImportEnabled}
          >
            Refresh data
          </button>
        </section>
      </main>
    );
  }
}

Config.propTypes = {
  currentUser: ScorchPropTypes.currentUser().isRequired,
};

export default withCurrentUser(Config);
