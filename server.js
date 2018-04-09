/**
 *
 * @fanz
 */

//启动后端服务器node

const _ = require('lodash');
start();//连接数据库
const curTime = new Date();


const dateChange = (date) => {
    return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
};

function connet() {

    let express = require('express');

    let mysql = require('mysql');

    let bodyParser = require('body-parser');

    let urlencodedParser = bodyParser.urlencoded({extended: false});

    let app = express();


    app.all('*', function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
        res.header("X-Powered-By", ' 3.2.1');
        res.header("Content-Type", "application/json;charset=utf-8");
        next();
    });

    let connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '123456',
        database: 'test',
    });


    //登陆
    app.post('/login_post', urlencodedParser, function (req, res) {
        let sql = 'select * from login where id=' + req.body.id;
        let count = 1;
        let data = {};
        connection.query(sql, function (err, result, fields) {
            if (err) throw err;
            if (!result[0]) {
                data.data = {
                    'admin': false,
                }
            }
            for (let i = 0; i < result.length; i++) {
                if (req.body.password === result[0]['pwd']) {
                    data.data = {
                        'admin': result[0]['admin'],
                        'name': result[0].name
                    };
                    let sql1 = `INSERT INTO loginlog (logid,id,name,time) values('${count}','${req.body.id}','${result[0].name}','${dateChange(curTime)}')`
                    connection.query(sql1);
                } else {
                    data.data = ({
                        'admin': false,
                    })
                }
            }
            res.send(data);
        });
    });

    app.get('/getMax', urlencodedParser, (req, res) => {
        let sql = `SELECT * FROM admin where id = '${req.query.id}'`;
        let data = {
            data: []
        };
        connection.query(sql, (err, result, fields) => {
            if (err) throw err;
            _.map(result, item => {
                data.data.push(item)
            });
            res.send(data)
        })
    });

    //管理员
    app.get('/getCost', urlencodedParser, (req, res) => {
        let townName = req.query.currentTown != 'ALL_VALUE' ? `town = (select name from town where id = '${req.query.currentTown}')` : true;
        if (req.query.currentTown === '全部') townName = true;
        let isOwe = req.query.isOwe === 'true' ? 'water < 0 or manage<0' : 'water > 0 and manage > 0';
        let findName = req.query.findName ? `name LIKE '%${req.query.findName}%'` : true;
        let sql = `select distinct * from cost where ${townName} and (${isOwe}) and ${findName}`;
        let data = {data: []};
        connection.query(sql, function (err, result, fields) {
            if (err) throw err;
            _.map(result, item => {
                data.data.push(item)
            });
            res.send(data);
        })
    });

    app.get('/getMoney', (req, res) => {
        let sql = `SELECT * FROM money limit ${(req.query.pageIndex - 1) * 10},10`;
        let data = {data: [], total: 0};
        connection.query(sql, (err, result) => {
            if (err) throw err;
            _.map(result, item => {
                data.data.push(item)
            });
        });
        connection.query('SELECT COUNT(*) FROM money', (err, result) => {
            if (err) throw err;
            _.map(result, item => {
                data.total = item['COUNT(*)']
            });
            res.send(data)
        });

    });

    app.get('/getTown', (req, res) => {
        let sql = 'select id,name from town';
        let data = {data: []};
        connection.query(sql, (err, result, fields) => {
            if (err) throw err;
            _.map(result, item => {
                data.data.push(item)
            });
            res.send(data);
        })
    });

    app.get('/getUser', (req, res) => {
        let town = _.get(req.query, 'town') !== 'ALL_VALUE' && _.get(req.query, 'town') ? `town='${req.query.town}'` : true;
        let sql = `select id,name,sex,phone,IDcard,town,loudong,room from user 
        WHERE ${town}
        limit ${(req.query.page - 1) * 10},10`;
        let sql2 = `SELECT COUNT(town) AS COUNT FROM user WHERE ${town}`;
        let data = {data: []};
        connection.query(sql, (err, result, field) => {
            if (err) throw err;
            _.map(result, item => {
                data.data.push(item)
            });
        });
        connection.query(sql2, (err, result) => {
            if (err) throw err;
            _.map(result, item => {
                _.merge(data, {total: item.COUNT})
            });
            res.send(data);
        });
    });
    //获取省
    app.get('/getPro', (req, res) => {
        let sql = 'SELECT city.`name`,city.id FROM city WHERE `keys`=0';
        let data = {data: []};
        connection.query(sql, (err, result, field) => {
            if (err) throw err;
            _.map(result, item => {
                data.data.push(item)
            });
            res.send(data)
        })
    });

    //获取市
    app.get('/getCity', (req, res) => {
        let sql = 'SELECT city.`name`,city.id FROM city WHERE `keys`=' + req.query.pro;
        let data = {data: []};
        connection.query(sql, (err, result) => {
            if (err) throw err;
            _.map(result, item => {
                data.data.push(item)
            });
            res.send(data)
        })
    });

    //获取小区ID
    app.get('/getTownId', (req, res) => {
        let sql = 'SELECT id FROM town ORDER BY id DESC LIMIT 1';
        let data;
        connection.query(sql, (err, result) => {
            if (err) throw err;
            _.map(result, item => {
                data = item
            });
            res.send(data)
        })
    });

    //添加小区
    app.post('/addTown', urlencodedParser, (req, res) => {
        const {id, name, pro, city, address} = req.body;
        let sql = `INSERT INTO TOWN (id,name,townPro,townCity,townAddress) 
       values ('${id}','${name}',(SELECT city.name FROM city WHERE city.id = '${pro}'),
       (SELECT city.name FROM city WHERE city.id = '${city}'),'${address}')`;
        connection.query(sql, (err, result) => {
            if (err) throw  err;
        });
        res.send('success')
    });

    //通过选择小区确定省市区和具体地址
    app.get('/getAddressByTown', (req, res) => {
        let sql = `SELECT townPro,townCity,townAddress FROM town  WHERE town.id = ${req.query.id}`;
        let data = {data: []};
        connection.query(sql, (err, result) => {
            if (err) throw err;
            _.map(result, item => {
                data.data.push(item)
            });
            res.send(data)
        })
    });

    //添加用户市获取用户最新ID
    app.get('/getUserId', (req, res) => {
        let sql = 'SELECT id FROM user ORDER BY id DESC LIMIT 1';
        let data;
        connection.query(sql, (err, result) => {
            if (err) throw err;
            _.map(result, item => {
                data = item;
            });
            res.send(data)
        })
    });

    //添加用户
    app.post('/addUser', urlencodedParser, (req, res) => {
        const {id, name, IDcard, sex, phone, Provice, city, town, loudong, room, water, manage, adminId, adminName} = req.body;
        let count = 1;

        let sql = `INSERT INTO user (id,name,sex,phone,IDcard,Provice,city,town,loudong,room)
                        values (
                                    '${id}',
                                    '${name}',
                                    '${sex}',
                                    '${phone}',
                                    '${IDcard}',
                                    '${Provice}',
                                    '${city}',
                                    (SELECT town.name FROM town WHERE town.id = '${town}'),
                                    '${loudong}',
                                    '${room}'
                                );`;
        let sql1 = ` INSERT INTO cost (id,name,town,water,manage)
                        values (
                                    '${id}',
                                    '${name}',
                                    (SELECT town.name FROM town WHERE town.id = '${town}'),
                                    '${water}',
                                    '${manage}'
                               );`;
        let sql2 = `INSERT INTO login (id,name,admin,pwd)
                        values (
                                    '${id}',
                                    '${name}',
                                    '2',
                                    '123456'
                        );`;
        let sql3 = `INSERT INTO adminlog (logid,time,id,name,content)
                        values (
                                    '${count}',
                                    '${dateChange(curTime)}',
                                    '${adminId}',
                                    '${adminName}',
                                    '增加用户'
                                )
                        `;
        console.log(sql, sql1, sql2, sql3);
        connection.query(sql, (err, result) => {
            if (err) throw  err;
        });
        connection.query(sql1, (err, result) => {
            if (err) throw  err;
        });
        connection.query(sql2, (err, result) => {
            if (err) throw  err;
        });
        connection.query(sql3, (err, result) => {
            if (err) throw  err;
            count++;
        });
        res.send('success');
    });

    app.get('/getLoginLog', (req, res) => {
        let sql = `SELECT * FROM loginlog LIMIT ${(req.query.page-1)*10},${req.query.page*10}`;
        let sql1 = `SELECT COUNT(*) AS COUNT FROM loginlog`;
        let data = {data:[],total:0};
        connection.query(sql,(err,result)=>{
            if(err) throw err;
            _.map(result,item=>{
                data.data.push(item);
            });
        });
        connection.query(sql1,(err,result)=>{
            if(err) throw err;
            _.map(result,item=>{
                data.total = item.COUNT
            });
            res.send(data)
        })
    });

    app.get('/getAdminLog',(req,res)=>{
        let sql = `SELECT * FROM adminlog LIMIT ${(req.query.page-1)*10},${req.query.page*10}`;
        let sql1 = `SELECT COUNT(*) AS COUNT FROM adminlog`;
        let data = {data:[],total:0};
        connection.query(sql,(err,result)=>{
            if(err) throw err;
            _.map(result,item=>{
                data.data.push(item);
            });
        });
        connection.query(sql1,(err,result)=>{
            if(err) throw err;
            _.map(result,item=>{
                data.total = item.COUNT
            });
            res.send(data)
        })
    })


    app.listen(3001);


    connection.connect(function () {
        console.log("服务器连接成功");
    });

    return connection;

}

function start() {

    connet().on('error', handleError);

}

function handleError(err) {
    if (err) {
        // 如果是连接断开，自动重新连接
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            connect();
        } else {
            console.error(err.stack || err);
        }
    }
}
