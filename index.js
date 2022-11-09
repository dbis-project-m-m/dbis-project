const express = require("express")
const mysql = require("mysql")
const path = require("path")
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const flash = require('connect-flash');

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(flash());
app.set("view engine", "ejs");
app.set('/', path.join(__dirname, '/views'));
// app.use(function(req, res, next){
//     res.locals.message = req.flash();
//     next();
// });


const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "airport-dbms-trial"
})

const oneDay = 1000 * 60 * 60 * 24;
//session middleware
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
}));

// parsing the incoming data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//serving public file
app.use(express.static(__dirname));

// cookie parser middleware
app.use(cookieParser());

// a variable to save a session
var session;

// console.log(req.session.email)

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log("db connected")
})

function convert(str) {
    var date = new Date(str),
        mnth = ("0" + (date.getMonth() + 1)).slice(-2),
        day = ("0" + date.getDate()).slice(-2);
    return [date.getFullYear(), mnth, day].join("-");
}
var moment = require('moment');
exports.index = function (req, res) {
    res.render('index', { moment: moment });
}
app.get('/', (req, res) => {
    res.render('home.ejs');
})

app.get('/create_acct', (req, res) => {
    console.log("i am here")
    var username = req.query.username
    var email = req.query.email
    var password = req.query.password

    db.query("insert into login(email, username, password) values (?, ?, ?)", [email, username, password], (err, result) => {
        if (err) console.log(err)

        res.redirect('/sign_in')
    })
})
app.get('/search', (req, res) => {
    var email = req.query.email
    var password = req.query.password
    let sql = `select * from login where email='${email}'`
    console.log(email);

    let prompty = {
        validity: null
    };

    db.query(sql, (err, result) => {
        if (err) console.log(err)

        // console.log(password)
        // console.log(result[0].password)
        if (result.length == 0) {
            res.render('sign_in.ejs', { validity: null });
            // prompt("useremail does not exist")
        }
        else if (result[0].password == password) {
            session = req.session;
            session.email = req.query.email;
            // console.log(req.session)
            res.render('home.ejs', { result })
        }
        else {
            res.render('sign_in.ejs', { validity: null })
            // prompt("invali password")
        }

    })


})

app.get('/logout', (req, res) => {
    req.session.destroy();
    // console.log(req.session.user)

    res.redirect('/sign_in');

});

app.get('/home', (req, res) => {

    if (req.session.email != undefined) {
        res.render('home.ejs', { email: req.session.email });
    }
    else {
        res.render('home.ejs', { result6: [] })
    }
})




app.get('/sign_in', (req, res) => {
    res.render('sign_in.ejs', { validity: !null })
})
app.get('/index', (req, res) => {
    res.render('index.ejs')
})
app.get('/new', (req, res) => {
    res.render('reset.ejs')
})
app.get('/amenities', (req, res) => {

    db.query("select r.review, r.airline, l.username, r.rating from reviews as r join login as l on l.login_id=r.login_id", (err ,result)=>{
        res.render('amenities.ejs', {result})
    })

})


app.get('/review_search', (req, res)=>{

    let myobject={
        airline: req.query.airline,
        username: req.query.username
    }

    db.query("select r.review, r.airline, l.username, r.rating from reviews as r join login as l on l.login_id=r.login_id where l.username like '%"+myobject.username+"%' and r.airline like '%"+myobject.airline+"%'", (err, result)=>{
        res.render('amenities.ejs', {result})
    } )
})
app.get('/find_flight', (req, res) => {
    if (req.session.email != undefined) {
        console.log(req.session.email)
    }
    else if (req.session.email == undefined) {
        console.log("req.session.email")
    }
    // console.log(session.email)
    res.render('find_flight.ejs', { results: [] })
})
app.get('/booking/:flight_id/:arrival_schedule_id', (req, res) => {

    if (req.session.email != undefined) {
        console.log("me yaha hun");
        // console.log(result.schedule_id)
        db.query("select * from arrival_flights as af join flight as f on af.flight_id=f.flight_id where f.flight_id=? and af.arrival_schedule_id=?", [req.params.flight_id, req.params.arrival_schedule_id], (err, result) => {
            if (err) console.log(err)
            console.log(result);
            if (result[0].passenger_no < result[0].capacity) {
                console.log(result[0].passenger_no);
                console.log(result[0].capacity);
                db.query("update arrival_flights set passenger_no=passenger_no+1 where flight_id=?", [req.params.flight_id], (err, result2) => {
                    if (err) console.log(err)
                })
                res.render('booking.ejs', {
                    flight_id: req.params.flight_id,
                    schedule_id: req.params.arrival_schedule_id, abc: 3
                })
            }
            else {
                // req.flash('message', 'laude sab book ho chuke he')
                console.log("flight full");
            }
        })

    }
    else {
        res.redirect('/sign_in')
    }
})

app.get('/bookticket/:flight_id/:schedule_id', (req, res) => {
    let data = {
        name: req.query.name,
        email: req.query.email,
        mobile_no: req.query.mobile_no,
        aadhar_no: req.query.aadhar_no,
        class: req.query.class
    }
    console.log(req.params.flight_id)
    let sql2 = `select aadhar_no from passengers`
    let sql3 = `select * from bookings where flight_id=${req.params.flight_id} and schedule_id=${req.params.schedule_id}`

    db.query(sql2, (err, result) => {
        if (err) { console.log(err) }
        else {
            let check = false;
            for (let values of result) {
                if (values.aadhar_no == data.aadhar_no) {
                    check = true;
                    break;
                }
            }
            if (!check && data.name != null && data.email != null && data.mobile_no != null && data.aadhar_no != null) {
                let sql1 = `insert into passengers(name, email, mobile_no, aadhar_no) values ('${data.name}','${data.email}','${data.mobile_no}','${data.aadhar_no}')  `
                let sql4 = `select passenger_id from passengers where aadhar_no='${data.aadhar_no}'`
                db.query(sql1, (err, result1) => {
                    if (err) console.log(err)

                    db.query(sql3, (err, result2) => {
                        if (err) console.log(err)
                        db.query(sql4, (err, result3) => {
                            if (err) console.log(err)
                            console.log("lodu")
                            console.log(result2[0].booking_id)
                            db.query("insert into tickets(booking_id, passenger_id, user_mail) values (?, ?, ?)", [result2[0].booking_id, result3[0].passenger_id, req.session.email], (err, result4) => {
                                console.log(data.name)
                                res.render('booking.ejs')
                            })
                        })
                    })

                })
            }
            else {
                res.render('booking.ejs')
            }
        }

    })


})
app.get('/airline/:to_route/:from_route/:arrival_time', (req, res) => {
    let input = {
        to: req.params.to_route,
        from: req.params.from_route,
        arrival_time: req.params.arrival_time,
        airline: req.query.choose_airline,
        sort_opt: req.query.sort_by_cond
    }
    input.arrival_time = convert(input.arrival_time)
    console.log(input.arrival_time)
    console.log(input.to);

    let sql2 = "select f.flight_id, f.airline, r.from_route, r.to_route, af.arrival_time, af.duration, af.arrival_schedule_id, af.economy_cost, af.business_cost, af.first_cost from flight as f join arrival_flights as af on f.flight_id=af.flight_id join route as r on r.route_id=af.route_id where r.from_route like '%" + input.from + "%' and r.to_route like '%" + input.to + "%' and date(af.arrival_time) like '%" + input.arrival_time + "%' and f.airline like '%" + input.airline + "%' order by f.airline"
    let sql3 = "select f.flight_id, f.airline, r.from_route, r.to_route, af.arrival_time, af.duration, af.arrival_schedule_id, af.economy_cost, af.business_cost, af.first_cost from flight as f join arrival_flights as af on f.flight_id=af.flight_id join route as r on r.route_id=af.route_id where r.from_route like '%" + input.from + "%' and r.to_route like '%" + input.to + "%' and date(af.arrival_time) like '%" + input.arrival_time + "%' order by f.airline"



    db.query(sql2, (err, results) => {
        if (err) console.log(err)
        console.log(results);
        console.log(input.sort_opt)

        if (results.length == 0) {
            console.log("no flights available")
            res.redirect('/find_flight')
        }
        else {

            db.query(sql3, (err, result3) => {
                for (let values of results) {
                    values.arrival_time = moment(new Date(values.arrival_time)).format('YYYY-MM-DD HH:mm:ss')
                }
                for (let values of result3) {
                    values.arrival_time = moment(new Date(values.arrival_time)).format('YYYY-MM-DD HH:mm:ss')
                }

                res.render('flight_output.ejs', { results, result3, result2: input.sort_opt })
            })
        }

    })


})

app.get('/output', (req, res) => {
    let input = {
        to: req.query.to,
        from: req.query.from,
        date: req.query.date,
        // airline: req.query.airline
    }

    let sql = "select f.flight_id, f.airline, r.from_route, r.to_route, af.arrival_time, af.duration, af.arrival_schedule_id, af.economy_cost, af.business_cost, af.first_cost from flight as f join arrival_flights as af on f.flight_id=af.flight_id join route as r on r.route_id=af.route_id where r.from_route like '%" + input.from + "%' and r.to_route like '%" + input.to + "%' and date(af.arrival_time) like '%" + input.date + "%' order by f.airline"


    db.query(sql, (err, results) => {
        if (err) console.log(err)

        for (let values of results) {
            values.arrival_time = moment(new Date(values.arrival_time)).format('YYYY-MM-DD HH:mm:ss')
        }
        console.log(results)
        let result3 = results
        res.render('flight_output.ejs', { results, result3, result2: 'Cost' })

    })


})
app.get('/my_account', (req, res) => {

    if (req.session.email == undefined) {
        res.redirect('/sign_in')
    }

    let sql = `select * from tickets as t
    join login as l on l.email=t.user_mail join
     bookings as b on b.booking_id=t.booking_id  join
     arrival_flights as af on af.arrival_schedule_id=b.schedule_id join flight as f on f.flight_id=af.flight_id where  t.user_mail='${req.session.email}'`
    console.log(req.session.email);
    db.query(sql, (err, results) => {
        if (err) console.log(err)

        res.render('my_account.ejs', { results })

    })

})
app.get('/navbar', (req, res) => {
    res.render('templates/partials/navbar.ejs')
})



app.get('/booking', (req, res) => {
    res.render('booking.ejs')
})
app.get('/reset', (req, res) => {
    let data = {
        name: req.query.username,
        age: req.query.age,
        country: req.query.country,
        phone: req.query.phone,
        address: req.query.address
    }
    let sql = `update login set username='${data.name}',age='${data.age}',country='${data.country}',address='${data.address}' where email='${req.session.email}';`

    db.query(sql, (err, results) => {
        if (err) console.log(err)

        res.render('reset.ejs', { results })

    })

})

app.listen(3000, () => {
    console.log("Listening on port 3000!");
})