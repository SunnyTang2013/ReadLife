/* eslint-disable */
import React from 'react';
import ScorchPropTypes from '../../proptypes/scorch';
import diffService from '../../backend/diffService';
import { withCurrentUser } from '../../components/currentUser';
import ParametersDiffTable from "../../components/ParametersDiffTable";

const PARAM_CONFIG_NAME = 'ODR_PARAM_CONFIG';
const PARAM_DEFINITION_NAME = 'ODR_PARAM_DEFINITION';
const PARAM_CONFIG_FILE_NAME = `${PARAM_CONFIG_NAME}.csv`;
const PARAM_DEFINITION_FILE_NAME = `${PARAM_DEFINITION_NAME}.csv`;

function getRandomColour() {
  return 'hsla(' + (Math.random() * 360) + ', 100%, 70%, 1)';
}

export function grabIDFromURL(scorchURL) {
  const parts = scorchURL.split("/")
  const numericalID = parts[parts.length-1]
  return numericalID;
}

/* eslint-disable class-methods-use-this */
class Diff extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      leftId: "https://scorch-uat01.systems.uk.hsbc:6500/frontend/pipelines/detail/301812562",
      rightId: "https://scorch-uat01.systems.uk.hsbc:6500/frontend/pipelines/detail/301812562",
      loading: false,
      error: "",
      diffData: [],
      currentTab: 0,
      tabTypes: ["pipeline", "batch", "job REQUEST", "job REQUEST",],
      tabParamTypes: ["overridden", "overridden", "resolved", "overridden",],
      tabColors: ["cornflowerblue", "violet", "#ff8c00", "#4caf50",],
      tabFunctions: [
        diffService.getDiffData,
        diffService.getDiffData,
        diffService.getDiffData,
        diffService.getDiffData,
        diffService.getDiffData,
      ],
      tabURLs: [
        "/api/v2/pipeline/summaries-for-diff",
        "/api/v2/batch/summaries-for-diff",
        "/api/v2/job-requests/details-for-diff",
        "/api/v2/job-requests/details-for-diff",
      ],
    }
  }

  resetUI = () => {
    this.setState({
      error: "",
      diffData: [],
      loading: false,
    })
  }

  handleInput = (event) => {
    this.setState({[event.target.name]: event.target.value});
  }

  render() {

    const renderDiffTable = () => {
      if (this.state.tabParamTypes[this.state.currentTab] === "resolved")
      {
        return <ParametersDiffTable
          left={{label:this.state.diffData[0].name, parameters:this.state.diffData[0].resolvedParameters}}
          right={{label:this.state.diffData[1].name, parameters:this.state.diffData[1].resolvedParameters}} />
      } else if (this.state.tabParamTypes[this.state.currentTab] === "overridden") {
        return <ParametersDiffTable
          left={{label:this.state.diffData[0].name, parameters:this.state.diffData[0].overriddenParameters}}
          right={{label:this.state.diffData[1].name, parameters:this.state.diffData[1].overriddenParameters}} />
      }
    }

    return (
      <main className="diff-tools">
        <div className="spacer-top"> </div>
        <h2 className="display-4">Diff Tools</h2>
        <span className="tabs-for-pipelines-batches-job">
          {/* render the tabs from state  */}
          {this.state.tabTypes.map((tab,index) =>
            <span key={index}>
                <span
                  style={{color: this.state.tabColors[index],cursor:"pointer"}} onClick={() => this.setState({
                  currentTab: index,
                  error: "",
                  diffData: [],
                  loading: false,
                })}>
                  {/* render current tab name + type of parameter to diff, from state */}
                  {tab} {this.state.tabParamTypes[index]}
                <span style={{color: "black"}}> | </span>
              </span>
            </span>
            )}
        </span>
        {/* render current tab */}
        <section>
            <h3 className="display-5" style={{color: this.state.tabColors[this.state.currentTab]}}>
              {this.state.tabTypes[this.state.currentTab]} {this.state.tabParamTypes[this.state.currentTab]}
              {this.state.tabParamTypes[this.state.currentTab] == "(full tree diff)" ? null : <span> params</span> }
            </h3>
            <div>
              <label htmlFor="leftId">
                <h4>Left {this.state.tabTypes[this.state.currentTab]} URL or ID:</h4>
              </label>
              <input id="leftId" name="leftId" placeholder="https://scorch-uat01.systems.uk.hsbc:6500/frontend/pipelines/detail/301812562" type="url" value={this.state.leftId} onChange={this.handleInput} />
            </div>
            <div>
              <label htmlFor="rightId">
                <h4>Right {this.state.tabTypes[this.state.currentTab]} URL or ID:</h4>
              </label>
              <input id="rightId" name="rightId" placeholder="https://scorch-uat01.systems.uk.hsbc:6500/frontend/pipelines/detail/301812562" type="url" value={this.state.rightId} onChange={this.handleInput} />
            </div>
            <button className="diff-btn" onClick={async ()=>{
              try {
                this.setState({loading: true, error: "", diffData: []})
                let apiFunction = await this.state.tabFunctions[this.state.currentTab];
                let apiURL = this.state.tabURLs[this.state.currentTab];
                let answer = await apiFunction(apiURL,grabIDFromURL(this.state.leftId), grabIDFromURL(this.state.rightId));
                this.setState({loading: false, diffData: answer})
                console.log(answer);
              } catch (error) {
                console.log(error)
                this.setState({loading: false, error: (error && error.message) ? JSON.stringify(error.message) : "Something went wrong when talking to the backend!"})
              } finally {
                this.setState({loading: false})
              }
            }
            }>Diff</button>
        </section>
        <span className="loading">
                {this.state.loading ? "Loading..." : ""}
              </span>
        <div className="error">
          {this.state.error == "" ? null : <div className="red">Error: {this.state.error}</div>}
        </div>
        {/* render diff results */}
        {
          this.state.diffData.length !== 2 ? null :
            <section>
              <div className="card-header">
                {/* render current tab name + type of parameter to diff, from state */}
                <h5 className="mb-0">{this.state.tabTypes[this.state.currentTab]}
                  {this.state.tabParamTypes[this.state.currentTab]}
                </h5>
              </div>
              <div className="card-body bg-light">
                {
                  renderDiffTable()
                }
              </div>
            </section>
        }
      </main>
    );
  }
}

Diff.propTypes = {
  currentUser: ScorchPropTypes.currentUser().isRequired,
};

export default withCurrentUser(Diff);
