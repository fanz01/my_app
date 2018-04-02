/**
 *
 * @fanz
 */

import React from "react";
import {Local} from "../../common/utils";
import $ from 'jquery';
import MyTable from '../../common/table'
import Pagination from "../../common/pagination";

const tableHead = ['序号','编号','ID','密码','是否被使用']

class MoneyPage extends React.Component{

    constructor(props){
        super(props);
        this.state={
            data:[],
            total:0
        }
    }

    getList(){
        $.get(Local+'/getMoney',{pageIndex:1})
            .then(
                res=>{
                    this.setState({
                        data:res.data,
                        total:res.total
                    })
                }
            )
    }

    componentDidMount(){
        this.getList()
    }

    render(){
        return(
            <div>
                <MyTable
                    height="600px"
                    tableHeader={tableHead}
                    tableData={this.state.data}
                    className="table"
                    selectable={false}
                />
                <Pagination
                    total={this.state.total}
                />
            </div>
        )
    }
}

export default MoneyPage