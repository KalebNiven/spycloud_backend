import React, {Component} from 'react';
import axios from 'axios';
import '../styles/index.css';
import Fuse from 'fuse.js';
import {Progress} from "reactstrap/es";

// options for fuse.js(fuzzy search in object array)
const options = {
    includeScore: true,
    shouldSort: true,
    keys: ['payload.password'],
    findAllMatches: true,
};

export class FetchData extends Component {
    static displayName = FetchData.name;

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            file: null,
            result: {
                csvData: [],
                apiResult: [],
                matchedResult: []
            },
            fuse: null,
        };
    }

    uploadCSV() {
        if (!this.state.file) {
            alert("Please select csv file!");
            return;
        }
        let formData = new FormData();
        let {file} = this.state;
        formData.append("fileName", file.name);
        formData.append("formFile", file);
        this.setState({ loading: true });
        // Send request to backend(upload file , response matched result)
        axios.post('api/File', formData).then(res => {
            let fu = new Fuse(res.data.apiResult, options);
            this.setState({
                loading: false,
                result: res.data,
                fuse: fu,
            });
        }).catch(err => {
            this.setState({loading: false});
            alert('Something went wrong!')
        })
    }

    // Pick CSV file
    onSelectFile(e) {
        this.setState({file: e.target.files[0]});
    }

    // Check if one character is mismatch
    isMismatchOne(str1, str2) {
        let flag = true;
        let s1 = str1.length < str2.length ? str1 : str2; // small
        let s2 = str1.length < str2.length ? str2 : str1; //big
        if (s1 === s2) flag = false;
        if (s2.includes(s1) && s1.length < s2.length - 1) {
            flag = false;
        }
        for (let i = 0; i < s1.length; i++) {
            if (s1[i] !== s2[i]) {
                if (s1[i] !== s2[i + 1]) {
                    flag = false;
                } else {
                    if (s1.substring(i, s1.length - 1) !== s2.substring(i + 1, s2.length - 1)) {
                        flag = false;
                    }
                }
            }
        }
        return flag;
    }

    // Render table function
    renderResultTable(result) {
        // Initialize fuse object
        let fuse = new Fuse(result.apiResult, options);
        return (
            <div className="container">
                <div className="row">
                    <div className="col-12 mb-5">
                        <h4>CSV Data</h4>
                        <div className="table-responsive">
                            <table className='table table-striped'>
                                <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Email</th>
                                    <th>Password</th>
                                    <th>Desirable Items</th>
                                </tr>
                                </thead>
                                <tbody>
                                {result.csvData.map((item, index) => {
                                        return (
                                            <tr key={index}>
                                                <td>{index + 1}</td>
                                                <td>{item.result.email}</td>
                                                <td>
                                                    {item.result.password}
                                                </td>
                                                <td>
                                                    <ul className="list-group list-group-flush">
                                                        {
                                                            fuse.search(item.result.password).filter(o => {
                                                                return (o.item.payload.email === item.result.email) && (Math.ceil((1 - o.score) * 100))
                                                            }).map((it, key) => {
                                                                let originalPwd = item.result.password;
                                                                let resultPwd = it.item.payload.password;
                                                                if ((originalPwd === resultPwd) || (originalPwd !== resultPwd && this.isMismatchOne(originalPwd, resultPwd)))
                                                                    return (
                                                                        <li className="list-group-item d-flex w-75 bg-transparent"
                                                                            key={key}>
                                                                            <div
                                                                                className="d-flex justify-content-center align-items-center p-2">
                                                                                {it.item.payload.password}
                                                                            </div>
                                                                            <div
                                                                                className="justify-content-center align-items-center p-2">
                                                                                <div
                                                                                    className="text-center"
                                                                                >
                                                                                    {(originalPwd === resultPwd) ? "Complete Match" : "One character mismatch"}
                                                                                </div>
                                                                                <Progress
                                                                                    style={{backgroundColor: `rgb(0 ${255 * (1 - it.score)} 0)`}}
                                                                                    value={Math.ceil((1 - it.score) * 100)}/>
                                                                            </div>
                                                                        </li>
                                                                    )
                                                            })
                                                        }
                                                    </ul>
                                                </td>
                                            </tr>
                                        )
                                    }
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    render() {
        let {file, loading, fuse} = this.state;
        let contents = loading
            ? <p><em>Loading...</em></p>
            : this.renderResultTable(this.state.result, fuse);

        return (
            <div>
                <h1>Password Check</h1>
                <p>Please upload CSV file to server.</p>
                <div className="pb-5">
                    <div className="custom-file">
                        <input type="file" className="custom-file-input" id="validatedCustomFile" required
                               onChange={(e) => this.onSelectFile(e)}/>
                        <label className="custom-file-label"
                               htmlFor="validatedCustomFile">{file ? file.name : "Choose CSV file..."}</label>
                        <div className="invalid-feedback">Example invalid custom file feedback</div>
                    </div>
                    <div className="pt-2 pb-2">
                        <button className="buttonload flex-fill" onClick={() => this.uploadCSV()}>
                            {this.state.loading && <i className="fa fa-spinner fa-spin"></i>}
                            {this.state.loading ? "Loading" : "Upload"}
                        </button>
                    </div>
                </div>
                {contents}
            </div>
        );
    }
}
