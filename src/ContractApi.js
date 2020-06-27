import React from "react";
import { IconApi } from "./IconApi.js";
import "./css/ContractApi.css";

function TxResultTitle(props) {
  if (props.checkFailed) {
    var title = "Failed to check Tx result";
    var cssClass = "error-result-title";
  } else {
    title = "Tx failed";
    cssClass = "error-result-title";
    if (typeof props.result === "object" && props.result !== null) {
      if (props.result.hasOwnProperty("status")) {
        if (props.result["status"]) {
          title = "Tx succeed";
          cssClass = "succeed-result-title";
        }
      }
    }
  }
  return (
    <div className="row">
      <div className="col-auto">
        <h6 className={cssClass}>{title}</h6>
      </div>
    </div>
  );
}

function TxTitle(props) {
  const cssClass = props.txError
    ? "error-result-title"
    : "succeed-result-title";
  return (
    <h6 className={cssClass}>
      {props.txError ? "Failed to send Tx" : "Tx hash below"}
    </h6>
  );
}

function CallResultTitle(props) {
  const cssClass = props.failed ? "error-result-title" : "succeed-result-title";
  return (
    <div className="row">
      <div className="col-auto">
        <h6 className={cssClass}>
          {props.failed ? "Call error" : "Call succeed"}
        </h6>
      </div>
    </div>
  );
}

function Output(props) {
  return (
    <div className="container">
      {props.txHash ? (
        <div className="row">
          <div className="col">
            <br />
            <div className="row">
              <div className="col-auto">
                <TxTitle txError={props.txError} />
              </div>
              <div className="col-auto">
                <div
                  type="button"
                  className="btn btn-secondary btn-sm checktx-button"
                  onClick={props.checkTx}
                >
                  Check Tx
                </div>
              </div>
            </div>

            <textarea
              value={props.txHash}
              readOnly={true}
              rows="1"
              className="form-control text-area"
            />
            <br />
          </div>
        </div>
      ) : (
        ""
      )}

      {props.callResult ? (
        <div className="row">
          <div className="col">
            {props.txHash ? "" : <br />}
            <CallResultTitle failed={props.callFailed} />
            <textarea
              value={JSON.stringify(props.callResult, null, 2)}
              readOnly={true}
              rows="4"
              className="form-control text-area"
            />
            <br />
          </div>
        </div>
      ) : (
        ""
      )}

      {props.txResult ? (
        <div className="row">
          <div className="col">
            {props.txHash ? "" : <br />}
            <TxResultTitle
              checkFailed={props.txCheckFailed}
              result={props.txResult}
            />
            <textarea
              value={JSON.stringify(props.txResult, null, 2)}
              readOnly={true}
              rows="4"
              className="form-control text-area"
            />
            <br />
          </div>
        </div>
      ) : (
        ""
      )}
    </div>
  );
}

export class ApiItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      icxValue: "",

      methodName: props.methodName,
      methodParams: props.methodParams,
      payable: props.payable,
      readonly: props.readonly,
      paramValues: {},

      fetching: false,

      txHash: "",
      txError: false,
      txCheckFailed: false,
      txResult: "",

      callResult: "",
      callFailed: false,
    };
  }

  handleClick = async () => {
    this.setState({ fetching: true });

    if (this.state.readonly) {
      this.call(this.state.methodName, this.state.paramValues);
    } else {
      this.sendCallTx(
        this.state.methodName,
        this.state.paramValues,
        parseFloat(this.state.icxValue) * 10 ** 18
      );
    }
  };

  updateParamValue = (param, value) => {
    this.setState((state) => {
      const paramValues = state.paramValues;
      paramValues[param] = value;
      return { paramValues: paramValues };
    });
  };

  async call(method, params) {
    console.log(`Calling method: ${method}`);
    console.log(`..with params: ${JSON.stringify(params)}`);

    let result = "";
    let failed;

    try {
      const api = new IconApi({
        endpoint: this.context.explorerState.endpoint,
        nid: this.context.explorerState.nid,
        contract: this.context.explorerState.contract,
      });
      result = await api.call(method, params);
      failed = false;
    } catch (err) {
      result = err;
      failed = true;
    }

    this.setState({
      callResult: result || "Undefined",
      callFailed: failed,
      txHash: "",
      fetching: false,
    });

    console.log("Call result: " + result);
  }

  async sendCallTx(method, params, value) {
    console.log(`Calling method: ${method}`);
    console.log(`..with params: ${JSON.stringify(params)}`);
    console.log(`..and ICX value: ${value}`);

    let txHash = "";
    let failed;

    try {
      const api = new IconApi(
        {
          endpoint: this.context.explorerState.endpoint,
          nid: this.context.explorerState.nid,
          contract: this.context.explorerState.contract,
        },
        {
          pkey: this.context.explorerState.pkey,
          keystore: this.context.explorerState.keystore,
          keystorePass: this.context.explorerState.keystorePass,
          iconexWallet: this.context.explorerState.iconexWallet,
        }
      );

      txHash = await api.sendCallTx(method, params, value);
      failed = false;
    } catch (err) {
      txHash = err;
      failed = true;
    }

    this.setState({
      callResult: "",
      txHash: txHash,
      txError: failed,
      fetching: false,
    });

    console.log("Call Tx: " + txHash);
  }

  async checkTx(txHash) {
    let txResult = "";
    let failed = false;

    try {
      const api = new IconApi({
        endpoint: this.context.explorerState.endpoint,
        nid: this.context.explorerState.nid,
        contract: this.context.explorerState.contract,
      });
      txResult = await api.checkTx(txHash);
      failed = false;
    } catch (err) {
      txResult = err;
      failed = true;
    }

    this.setState({
      txResult: txResult,
      txCheckFailed: failed,
    });
  }

  render() {
    return (
      <div className="row my-3 ApiItem">
        <div className="container">
          <div className="row">
            <div
              type="button"
              className="btn btn-primary api-button"
              onClick={this.handleClick}
            >
              {this.state.methodName}
            </div>

            {!this.state.readonly && this.state.payable ? (
              <div>
                <input
                  type="number"
                  className="form-control icx-amount-input"
                  value={this.state.icxValue || ""}
                  onChange={(e) => this.setState({ icxValue: e.target.value })}
                  placeholder="Payable value in ICX"
                  title="ICX value to be sent with payable contract call, in ICX unit"
                />
              </div>
            ) : (
              ""
            )}

            {this.state.fetching ? (
              <div className="fetching">Calling...</div>
            ) : (
              ""
            )}
          </div>

          {/* Params list */}
          {this.state.methodParams.length > 0
            ? this.state.methodParams.map((param, index) => (
                <div className="row my-2" key={index}>
                  <div className="col">
                    <div className="row">
                      <div className="col-auto">
                        <var className="param-name">{param.name}</var> :{" "}
                        <code>{param.type}</code>
                      </div>
                      <div className="col">
                        <input
                          type="text"
                          className="form-control param-input"
                          value={this.state.paramValues[param.name] || ""}
                          onChange={(e) =>
                            this.updateParamValue(param.name, e.target.value)
                          }
                          required={true}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            : ""}

          <Output
            callFailed={this.state.callFailed}
            callResult={this.state.callResult}
            txHash={this.state.txHash}
            txError={this.state.txError}
            txCheckFailed={this.state.txCheckFailed}
            txResult={this.state.txResult}
            checkTx={async () => this.checkTx(this.state.txHash)}
          />
        </div>
      </div>
    );
  }
}

function ApiList(props) {
  return props.methods.map((item, index) => (
    <ApiItem
      methodName={item.methodName}
      methodParams={item.methodParams}
      payable={item.payable}
      readonly={props.readonly}
      key={index + item.methodName}
    />
  ));
}

/**
 * Contain list of API and params input
 */
export class ContractApi extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: props.title,
      readonlyMethods: [],
      methods: [],
      invalidContractError: "",
      contractName: "",
      noContract: true,
      fetching: false,
    };
  }

  async componentDidMount() {
    if (this.context.explorerState.contract) {
      await this.fetchMethods();
    }
  }

  async fetchMethods() {
    this.setState({ fetching: true });

    try {
      const api = new IconApi({
        endpoint: this.context.explorerState.endpoint,
        nid: this.context.explorerState.nid,
        contract: this.context.explorerState.contract,
      });
      const apiList = await api.getScoreApi();

      const methods = apiList
        .getList()
        .filter((item) => item.type === "function")
        .filter((item) => !item.hasOwnProperty("readonly"))
        .map((item) => ({
          methodName: item.name,
          methodParams: item.inputs,
          payable: item.hasOwnProperty("payable"),
        }));
      this.setState({ methods: methods });

      const readonlyMethods = apiList
        .getList()
        .filter((item) => item.type === "function")
        .filter((item) => item.hasOwnProperty("readonly"))
        .map((item) => ({
          methodName: item.name,
          methodParams: item.inputs,
          payable: false,
        }));
      this.setState({
        readonlyMethods: readonlyMethods,
      });

      // Reset error message if any
      this.setState({
        invalidContractError: "",
      });

      // Get contract name, if any
      try {
        const api = new IconApi({
          endpoint: this.context.explorerState.endpoint,
          nid: this.context.explorerState.nid,
          contract: this.context.explorerState.contract,
        });
        const cxName = await api.call("name", {});
        this.setState({ contractName: cxName });
      } catch (err) {
        console.log("Failed to get contract name: " + err);
        this.setState({ contractName: "" });
      }

      // Loaded contract
      this.setState({ noContract: false });
      // Finished

      // console.log("API list: " + JSON.stringify(apiList.getList(), null, 2));
      // console.log("API list: " + JSON.stringify(methods, null, 2));
    } catch (err) {
      this.setState({ invalidContractError: err });
    }

    this.setState({ fetching: false });
  }

  render() {
    return (
      <div className="container-fluid ContractApi">
        <h4 id="ContractApi-title">{this.state.title}</h4>
        <div className="container-fluid px-1">
          <div className="row my-4">
            <div className="col-auto">
              {!this.state.noContract ? (
                this.state.contractName ? (
                  <div className="contract-name">
                    Contract name : <b>{this.state.contractName}</b>
                  </div>
                ) : (
                  <div className="no-contract-name">
                    This contract has no name
                  </div>
                )
              ) : (
                <div className="no-contract-name">No contract</div>
              )}
            </div>

            <div className="col-sm-4">
              <input
                type="text"
                className="form-control"
                id="contract-address-input"
                value={this.context.explorerState.contract}
                onChange={(e) =>
                  this.context.updateExplorerState({ contract: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    this.fetchMethods();
                  }
                }}
                title="Press Enter to refresh contract API list"
                placeholder="Contract address here"
                required
              />

              {this.state.invalidContractError ? (
                <div className="alert alert-error" role="alert">
                  {this.state.invalidContractError}
                </div>
              ) : (
                ""
              )}
            </div>

            <div className="col-auto">
              <div
                type="button"
                className="btn btn-primary btn-sm"
                onClick={async () => this.fetchMethods()}
              >
                Refresh
              </div>
            </div>

            {this.state.fetching ? (
              <div className="fetching">Fetching contract APIs...</div>
            ) : (
              ""
            )}
          </div>

          <div className="row">
            <div className="col-lg-6 col-md-6 col-sm-12 col-xs-12">
              <div className="container">
                <h5 id="ApiList-title">Readonly methods</h5>
                <div className="container">
                  <ApiList
                    methods={this.state.readonlyMethods}
                    readonly={true}
                  />
                </div>
                {this.state.readonlyMethods.length > 0 ? "" : "...empty..."}
              </div>
            </div>
            <div className="col-lg-6 col-md-6 col-sm-12 col-xs-12">
              <div className="container">
                <h5 id="ApiList-title">Writable methods</h5>
                <div className="container">
                  <ApiList methods={this.state.methods} readonly={false} />
                </div>
                {this.state.methods.length > 0 ? "" : "...empty..."}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
