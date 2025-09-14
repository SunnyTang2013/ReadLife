import React from 'react';
import AutoGrowTextarea from '../components/AutoGrowTextarea';

class GenerateMaskJson extends React.Component {
  constructor(props) {
    super(props);
    const messageString = '{"instructions.override":{"reference":[{"batches":[""],"instructions":[{"name":"","value":""}],"jobs":[""]}],"target":[{"batches":[""],"instructions":[{"name":"","value":""}],"jobs":[""],"batches":[""]}]}}';
    this.state = {
      jsonMessage: JSON.parse(messageString),
    };

    this.onAddInstruction = this.onAddInstruction.bind(this);
    this.onChangeInstruction = this.onChangeInstruction.bind(this);
    this.onDeleteInstruction = this.onDeleteInstruction.bind(this);

    this.onAddJob = this.onAddJob.bind(this);
    this.onDeleteJob = this.onDeleteJob.bind(this);
    this.onChangeJob = this.onChangeJob.bind(this);


    this.onAddBatch = this.onAddBatch.bind(this);
    this.onDeleteBatch = this.onDeleteBatch.bind(this);
    this.onChangeBatch = this.onChangeBatch.bind(this);

    this.onAddNode = this.onAddNode.bind(this);
    this.onDeleteNode = this.onDeleteNode.bind(this);


    this.onCopyJson = this.onCopyJson.bind(this);
    this.onChangeIntitalJson = this.onChangeIntitalJson.bind(this);
  }

  componentDidMount() {
  }

  // eslint-disable-next-line class-methods-use-this
  onCopyJson() {
    const jsonTextElement = document.querySelector('[id="final-json-textarea-0"]');
    navigator.clipboard.writeText(jsonTextElement.value);
  }

  onChangeIntitalJson(event) {
    try {
      const value = event.target.value;
      if (JSON.parse(value)) {
        const intialJson = JSON.parse(event.target.value);
        this.setState({ jsonMessage: intialJson });
      }
      // eslint-disable-next-line no-empty
    } catch (e) {
    }
  }

  onDeleteNode(path, id) {
    this.setState((prevState) => {
      const jsonMessage = Object.assign({}, prevState.jsonMessage);
      jsonMessage['instructions.override'][path].splice(id, 1);
      return { jsonMessage };
    });
  }

  onAddNode(path) {
    this.setState((prevState) => {
      const jsonMessage = Object.assign({}, prevState.jsonMessage);
      (jsonMessage['instructions.override'][path].push({ batches: [], jobs: [], instructions: [] }));
      return { jsonMessage };
    });
  }

  onDeleteBatch(path, name, id, parentid) {
    this.setState((prevState) => {
      const jsonMessage = Object.assign({}, prevState.jsonMessage);
      jsonMessage['instructions.override'][path][parentid].batches.splice(id, 1);
      return { jsonMessage };
    });
  }

  onAddBatch(path, parentid) {
    this.setState((prevState) => {
      const jsonMessage = Object.assign({}, prevState.jsonMessage);
      if (Object.getOwnPropertyNames((jsonMessage['instructions.override'][path][parentid]))
        .includes('batches')) {
        (jsonMessage['instructions.override'][path][parentid].batches).push('');
      } else {
        (jsonMessage['instructions.override'][path][parentid]) = Object.assign(
          (jsonMessage['instructions.override'][path][parentid]),
          { batches: [''] },
        );
      }
      return { jsonMessage };
    });
  }

  onChangeBatch(path, id, parentid, e) {
    const value = e.target.value;
    this.setState((prevState) => {
      const jsonMessage = Object.assign({}, prevState.jsonMessage);
      jsonMessage['instructions.override'][path][parentid].batches[id] = value;
      return { jsonMessage };
    });
  }

  onDeleteJob(path, name, id, parentid) {
    this.setState((prevState) => {
      const jsonMessage = Object.assign({}, prevState.jsonMessage);
      jsonMessage['instructions.override'][path][parentid].jobs.splice(id, 1);
      return { jsonMessage };
    });
  }

  onAddJob(path, parentid) {
    this.setState((prevState) => {
      const jsonMessage = Object.assign({}, prevState.jsonMessage);
      if (Object.getOwnPropertyNames((jsonMessage['instructions.override'][path][parentid]))
        .includes('jobs')) {
        (jsonMessage['instructions.override'][path][parentid].jobs).push('');
      } else {
        (jsonMessage['instructions.override'][path][parentid]) = Object.assign(
          (jsonMessage['instructions.override'][path][parentid]),
          { jobs: [''] },
        );
      }
      return { jsonMessage };
    });
  }

  onChangeJob(path, id, parentid, e) {
    const value = e.target.value;
    this.setState((prevState) => {
      const jsonMessage = Object.assign({}, prevState.jsonMessage);
      jsonMessage['instructions.override'][path][parentid].jobs[id] = value;
      return { jsonMessage };
    });
  }

  onDeleteInstruction(path, name, id, parentid) {
    this.setState((prevState) => {
      const jsonMessage = Object.assign({}, prevState.jsonMessage);
      jsonMessage['instructions.override'][path][parentid].instructions.splice(id, 1);
      return { jsonMessage };
    });
  }

  onAddInstruction(path, parentid) {
    this.setState((prevState) => {
      const jsonMessage = Object.assign({}, prevState.jsonMessage);
      if (Object.getOwnPropertyNames((jsonMessage['instructions.override'][path][parentid]))
        .includes('instructions')) {
        (jsonMessage['instructions.override'][path][parentid].instructions).push({ name: '', value: '' });
      } else {
        (jsonMessage['instructions.override'][path][parentid]) = Object.assign(
          (jsonMessage['instructions.override'][path][parentid]),
          { instructions: [{ name: '', value: '' }] },
        );
      }
      return { jsonMessage };
    });
  }


  onChangeInstruction(path, keyName, id, parentid, e) {
    const value = e.target.value;
    this.setState((prevState) => {
      const jsonMessage = Object.assign({}, prevState.jsonMessage);
      (jsonMessage['instructions.override'][path][parentid].instructions[id])[keyName] = value;
      return { jsonMessage };
    });
  }


  _renderBatches(path, blocId) {
    const { jsonMessage } = this.state;
    const $items = [];

    const mainNode = jsonMessage['instructions.override'][path][blocId];
    if (Object.getOwnPropertyNames(mainNode).includes('batches')) {
      for (let idx = 0; idx < (mainNode.batches).length; idx++) {
        const node = (mainNode.batches)[idx];

        const $valueCell = (
          <div style={{ width: '80%' }}>
            <AutoGrowTextarea
              className="form-control"
              name={node}
              placeholder="Batch Name"
              value={node}
              onChange={(e) => this.onChangeBatch(path,
                idx,
                blocId,
                e)}
            />
          </div>
        );

        const $buttonCell = (
          <div className="text-nowrap">
            <button
              className="anchor text-muted"
              type="button"
              title="Delete this batch"
              onClick={() => this.onDeleteBatch(path,
                node,
                idx,
                blocId)}
            >
              <i className="fa fa-fw fa-trash" />
            </button>
          </div>
        );

        const $item = (
          <div
            key={`batch-${path}-${idx}-${blocId}`}
            style={{ backgroundColor: '#fffafc' }}
            className="d-flex justify-content-between"
          >
            {$valueCell}
            {$buttonCell}
          </div>
        );
        $items.push($item);
      }
    }

    return (
      <div style={{ backgroundColor: '#ffebf5', marginLeft: '20px' }}>
        <div className="d-flex justify-content-between">
          <div>
            Batchs : [
          </div>
          <div className="text-right">
            <button
              className="btn btn-primary btn-light-primary"
              type="button"
              onClick={() => this.onAddBatch(path,
                blocId)}
            >
              <i className="fa fa-fw fa-plus" /> Add
            </button>
          </div>
        </div>
        {$items}
        <div style={{ backgroundColor: '#ffebf5' }}>
          ]
        </div>
      </div>
    );
  }

  _renderJobs(path, blocId) {
    const { jsonMessage } = this.state;
    const $items = [];

    const mainNode = jsonMessage['instructions.override'][path][blocId];
    if (Object.getOwnPropertyNames(mainNode).includes('jobs')) {
      console.log('jobs');
      for (let idx = 0; idx < (mainNode.jobs).length; idx++) {
        const node = (mainNode.jobs)[idx];
        const $valueCell = (
          <div style={{ width: '80%' }}>
            <AutoGrowTextarea
              className="form-control"
              name={node}
              value={node}
              placeholder="Job Name"
              onChange={(e) => {
                this.onChangeJob(path,
                  idx,
                  blocId,
                  e);
              }}
            />
          </div>
        );

        const $buttonCell = (
          <div className="text-nowrap">
            <button
              className="anchor text-muted"
              type="button"
              title="Delete this job"
              onClick={(e) => this.onDeleteJob(path,
                node,
                idx/* (mainNode.jobs).indexOf(node) */,
                blocId,
                e)}
            >
              <i className="fa fa-fw fa-trash" />
            </button>
          </div>
        );

        const $item = (
          <div
            key={`job-${path}-${idx}-${blocId}`}
            style={{ backgroundColor: '#eaf5fe' }}
            className="d-flex justify-content-between"
          >
            {$valueCell}
            {$buttonCell}
          </div>
        );
        $items.push($item);
      }
    }

    return (
      <div style={{ backgroundColor: '#deecfe', marginLeft: '20px' }}>
        <div
          className="d-flex justify-content-between"
          style={{ backgroundColor: '#deecfe' }}
        >
          <div>
            Jobs : [
          </div>
          <div className="text-right">
            <button
              className="btn btn-primary btn-light-primary"
              type="button"
              onClick={() => this.onAddJob(path,
                blocId)}
            >
              <i className="fa fa-fw fa-plus" /> Add
            </button>
          </div>
        </div>
        {$items}
        <div style={{ backgroundColor: '#deecfe' }}>
          ]
        </div>
      </div>
    );
  }

  _renderInstructions(path, instructionsId) {
    const { jsonMessage } = this.state;
    const $items = [];

    const mainNode = jsonMessage['instructions.override'][path][instructionsId];
    for (let idx = 0; idx < (mainNode.instructions).length; idx++) {
      const node = (mainNode.instructions)[idx];


      const $nameCell = (
        <input
          className="form-control"
          name={node.name}
          placeholder="Name"
          value={node.name}
          onChange={(e) => this.onChangeInstruction(path,
            'name',
            idx,
            instructionsId,
            e)}
        />
      );
      const $valueCell = (
        <AutoGrowTextarea
          className="form-control"
          name={node.value}
          placeholder="Value"
          value={node.value}
          onChange={(e) => this.onChangeInstruction(path,
            'value',
            idx,
            instructionsId,
            e)}
        />
      );

      const $buttonCell = (
        <button
          className="anchor text-muted"
          type="button"
          title="Delete this parameter"
          onClick={() => this.onDeleteInstruction(path,
            node.name,
            idx,
            (jsonMessage['instructions.override'][path]).indexOf(mainNode))}
        >
          <i className="fa fa-fw fa-trash" />
        </button>
      );

      const $item = (
        <div
          key={`instr-${path}-${idx}-${instructionsId}`}
          style={{ backgroundColor: '#f0e6d5' }}
          className="d-flex justify-content-between"
        >
          {$nameCell}
          {$valueCell}
          {$buttonCell}
        </div>
      );
      $items.push($item);
    }


    return (
      <div style={{ backgroundColor: '#eae0d1', marginLeft: '20px' }}>
        <div className="d-flex justify-content-between" style={{ backgroundColor: '#eae0d1' }}>
          <div>
            instructions : [
          </div>
          <div className="text-right">
            <button
              className="btn btn-primary btn-light-primary"
              type="button"
              onClick={() => this.onAddInstruction(path,
                instructionsId)}
            >
              <i className="fa fa-fw fa-plus" /> Add
            </button>
          </div>
        </div>
        {$items}
        <div style={{ backgroundColor: '#eae0d1' }}>
          ]
        </div>
      </div>
    );
  }

  _renderLeaf(path) {
    const { jsonMessage } = this.state;


    const $elements = [];
    (jsonMessage['instructions.override'][path]).forEach(mainNode => {
      const bloc = (
        <div
          style={{ backgroundColor: '#f2ad7d' }}
          className="d-flex justify-content-between"
        >
          Node:
          <div className="text-right">
            <button
              className="btn btn-primary btn-light-primary"
              type="button"
              onClick={() => this.onDeleteNode(path,
                (jsonMessage['instructions.override'][path]).indexOf(mainNode))}
            >
              <i className="fa fa-fw fa-trash" />
            </button>
          </div>
        </div>
      );
      $elements.push(bloc);
      const $instruction = this._renderInstructions(path, (jsonMessage['instructions.override'][path]).indexOf(mainNode));
      const $jobs = this._renderJobs(path, (jsonMessage['instructions.override'][path]).indexOf(mainNode));
      const $batchs = this._renderBatches(path, (jsonMessage['instructions.override'][path]).indexOf(mainNode));

      $elements.push($instruction);
      $elements.push($jobs);
      $elements.push($batchs);
    });

    const bkgColor = (path.toLowerCase() === 'target' ? '#CDFCCF' : '#ffffcc');


    return (
      <div
        className="justify-content-between"
        style={{ backgroundColor: bkgColor, marginLeft: '20px' }}
      >
        {$elements}
      </div>
    );
  }

  render() {
    const { jsonMessage } = this.state;

    let path = 'target';
    const $treeTarget = this._renderLeaf(path);
    path = 'reference';
    const $treeReference = this._renderLeaf(path);

    const finalJson = JSON.stringify(jsonMessage);

    return (
      <div style={{ maxWidth: '85%' }} className="container-fluid">
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              Generate New Json
            </li>
          </ol>
        </nav>
        <div className="d-flex">
          <div className="form-group col-lg-9">
            <h2 className="display-4">Create a New Json</h2>
            <div style={{ backgroundColor: '#ffffcc' }}>
              <div className="d-flex justify-content-between">
                <h3>Reference :</h3>
                <button
                  className="btn btn-primary btn-light-primary"
                  type="button"
                  onClick={() => this.onAddNode('reference')}
                >
                  <i className="fa fa-fw fa-plus" /> Add Node
                </button>
              </div>
              {$treeReference}
            </div>
            <div style={{ backgroundColor: '#CDFCCF' }}>
              <div className="d-flex justify-content-between">
                <h3>Target :</h3>
                <button
                  className="btn btn-primary btn-light-primary"
                  type="button"
                  onClick={() => this.onAddNode('target')}
                >
                  <i className="fa fa-fw fa-plus" /> Add Node
                </button>
              </div>
              {$treeTarget}
            </div>
          </div>
          <div className="form-group col-lg-3">
            <h4 className="display-4">Initial Json:</h4>
            <AutoGrowTextarea
              id="initial-json-textarea-1"
              className="form-control"
              name="initial-json-textarea"
              rows="6"
              placeholder="Place your initial json here if you want"
              onChange={event => this.onChangeIntitalJson(event)}
            />
            <h4 className="display-5">Json Result:</h4>
            <AutoGrowTextarea
              id="final-json-textarea-0"
              className="form-control"
              rows="6"
              name="final-json-textarea"
              value={finalJson}
            />
            <button
              className="btn btn-success btn-lg btn-block  mt-3"
              type="button"
              title="Copy JSON"
              onClick={() => this.onCopyJson()}
            >
              <i className="fa fa-fw fa-copy" /> Copy
            </button>
            <div className="mt-3 mb-5" style={{ backgroundColor: '#D3D3D3' }}>
              <p>
                <small>
                  <em>
                    You can use this tool to generate json to override scorch instructions and
                    use it in the jenkins pipeline when launching scorch tests.<br />
                    Use this form to  add instructions (instruction ,value), list of
                    jobs/batches. You can add several groups ie (instruction + jobs/batches)<br />
                    You can apply rules on Reference ,Target legs or both.
                    <mark>
                      If you want to remove a parameter from a job you can
                      put null as value.
                      <br />
                      You can choose if rule should be applied on a list of scorch jobs or scorch
                      batches, if both are provided only jobs listed will be overridden.
                    </mark>
                    <br />
                    You can create json from scratch using the form, for lazy/smart people you can
                    start from old/pattern jenkins text ,just put it in the initial Json edit box,
                    <br />
                    form will be updated when a valid json is entered. Once done you can
                    copy the Json from final json box and use it in the Jenkins pipeline.
                  </em>
                </small>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}


export default GenerateMaskJson;
