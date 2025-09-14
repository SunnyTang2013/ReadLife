import React, { useState, useCallback } from 'react';
import { cloneDeep } from 'lodash';

import Toggle from 'react-toggle';
import Alert from '../../components/Alert';
import ParametersTable from '../../components/ParametersTable';

const PipelineNoticeForm = ({ runNotice, onSave, onCancel, disabled = false }) => {
  const [input, setInput] = useState(runNotice);
  const [saveWarning, setSaveWarning] = useState(null);

  const onChangePipelineProperty = useCallback((name, event) => {
    const value = event.target.value;
    setInput((prevInput) => {
      const newInput = cloneDeep(prevInput);
      newInput[name] = value;
      return newInput;
    });
    setSaveWarning(null);
  }, []);

  const onChangeOverrideParameters = useCallback((callJenkinsParameters) => {
    setInput((prevInput) => Object.assign({}, prevInput, { callJenkinsParameters }));
  }, []);

  const onOffJenkins = useCallback((event) => {
    const enableJenkins = event.target.checked;
    setInput((prevInput) => Object.assign({}, prevInput, { enableJenkins }));
  }, []);

  const onOffSymphony = useCallback((event) => {
    const enableSymphony = event.target.checked;
    setInput((prevInput) => Object.assign({}, prevInput, { enableSymphony }));
  }, []);

  const handleSave = useCallback((event) => {
    event.preventDefault();
    const inputCopy = cloneDeep(input);
    setSaveWarning(null);
    onSave(inputCopy);
  }, [input, onSave]);

  const handleCancel = useCallback((event) => {
    event.preventDefault();
    onCancel && onCancel(event);
  }, [onCancel]);

  return (
    <div>
      {saveWarning && <Alert type={saveWarning.type} text={saveWarning.text} />}
      
      <form className="my-2">
        <fieldset disabled={disabled}>
          <div className="row no-gutters">
            <div className="col-lg-6 pr-lg-2">
              <section>
                <div className="card mb-3 shadow bg-white rounded">
                  <div className="card-header">
                    <div className="d-flex justify-content-between">
                      <div className="mb-2">
                        <h5 className="mb-0">Jenkins</h5>
                      </div>
                      <div className="mb-2">
                        <Toggle id="cheese-status" checked={input.enableJenkins} onChange={onOffJenkins} />
                      </div>
                    </div>
                  </div>
                  <div className="card-body bg-light">
                    <ParametersTable parameters={input.callJenkinsParameters} onChange={onChangeOverrideParameters} />
                  </div>
                </div>
              </section>
            </div>
            <div className="col-lg-6 pr-lg-2">
              <section>
                <div className="card mb-3 shadow bg-white rounded">
                  <div className="card-header">
                    <div className="d-flex justify-content-between">
                      <div className="mb-2">
                        <h5 className="mb-0">Symphony</h5>
                      </div>
                      <div className="mb-2">
                        <Toggle id="symphony-status" checked={input.enableSymphony} onChange={onOffSymphony} />
                      </div>
                    </div>
                  </div>
                  <div className="card-body bg-light">
                    <div className="form-group">
                      <input 
                        id="pipeline-name" 
                        className="form-control" 
                        type="text" 
                        placeholder="split multiple symphony by comma" 
                        value={input.symphonyRoom} 
                        onChange={event => onChangePipelineProperty('symphonyRoom', event)} 
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
            
            <div className="form-group">
              <button className="btn btn-primary mr-2" type="button" onClick={handleSave}>
                Save
              </button>
              <button className="btn btn-secondary" type="button" onClick={handleCancel}>
                Cancel and Go Back
              </button>
            </div>
          </div>
        </fieldset>
      </form>
    </div>
  );
};

export default PipelineNoticeForm;