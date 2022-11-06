const express = require("express")
const mysql = require("mysql")
const path = require("path")
const cookieParser = require("cookie-parser");
const sessions = require('express-session');

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set('/', path.join(__dirname, '/views'));


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

        console.log(password)
        console.log(result[0].password)
        if (result.length == 0) {
            res.render('sign_in.ejs', { validity: null });
            // prompt("useremail does not exist")
        }
        else if (result[0].password == password) {
            session = req.session;
            session.email = req.query.email;
            console.log(req.session)
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
        let result6 = { email: req.session.email }
        res.render('home.ejs', { email: req.session.email });
    }
    else {
        res.render('home.ejs', { result6: [] })
    }
})

// app.get('/sort_by_airline', (req, res) => {

//     var airline= req.query.airline
// // res.render('flight')
// let results=req.params.results


// let sql = `select f.flight_id, f.airline, r.from_route, r.to_route, af.arrival_time, af.duration, af.arrival_schedule_id 
// from flight as f join arrival_flights as af on f.flight_id=af.flight_id join route as r on r.route_id=af.route_id
// where r.from_route='${results.from}' and r.to_route='${results.to}' and date(af.arrival_time)='${results.date}' and f.airline='${airline}'`

// db.query(sql, (err, results) => {
//     if (err) console.log(err)

//     res.render('flight_output.ejs', { results })

// })
//     res.render('flight_output.ejs', {airline: req.query.airline})
// })


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
    res.render('amenities.ejs')
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
        let result = {
            flight_id: req.params.flight_id,
            schedule_id: req.params.arrival_schedule_id
        }
        console.log(result.schedule_id)
        res.render('booking.ejs', {
            flight_id: req.params.flight_id,
            schedule_id: req.params.arrival_schedule_id, abc: 3
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
                            db.query("insert into tickets(booking_id, passenger_id) values (?, ?)", [result2[0].booking_id, result3[0].passenger_id], (err, result4) => {
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
        airline: req.query.airline
    }
   input.arrival_time= convert(input.arrival_time)
    console.log(input.arrival_time)
    console.log(input.to);

    let sql2 = `select f.flight_id, f.airline, r.from_route, r.to_route, af.arrival_time, af.duration, af.arrival_schedule_id 
    from flight as f join arrival_flights as af on f.flight_id=af.flight_id join route as r on r.route_id=af.route_id
    where r.from_route='${input.from}' and r.to_route='${input.to}' and date(af.arrival_time)=date('${input.arrival_time}') and f.airline='${input.airline}'`



    db.query(sql2, (err, results) => {
        if (err) console.log(err)
        console.log(results);
        res.render('flight_output.ejs', { results })

    })


})

app.get('/output', (req, res) => {
    let input = {
        to: req.query.to,
        from: req.query.from,
        date: req.query.date,
        // airline: req.query.airline
    }

    let sql = `select f.flight_id, f.airline, r.from_route, r.to_route, af.arrival_time, af.duration, af.arrival_schedule_id 
    from flight as f join arrival_flights as af on f.flight_id=af.flight_id join route as r on r.route_id=af.route_id
    where r.from_route='${input.from}' and r.to_route='${input.to}' and date(af.arrival_time)='${input.date}'`

    // let sql2 = `select f.flight_id, f.airline, r.from_route, r.to_route, af.arrival_time, af.duration, af.arrival_schedule_id 
    // from flight as f join arrival_flights as af on f.flight_id=af.flight_id join route as r on r.route_id=af.route_id
    // where r.from_route='${input.from}' and r.to_route='${input.to}' and date(af.arrival_time)='${input.date}' and f.airline='${input.airline}'`

    // if(input.airline="")
    // {

    db.query(sql, (err, results) => {
        if (err) console.log(err)

        res.render('flight_output.ejs', { results })

    })
    // }
    // else {
    //     console.log("me idhar hun")
    //     console.log(input.from)
    //     console.log(input.airline)
    //     db.query(sql2, (err, results) => {
    //         if (err) console.log(err)

    //         res.render('flight_output.ejs', { results })

    //     })
    // }

})
app.get('/my_account', (req, res) => {

    let sql = ``
    res.render('my_account.ejs')
})
app.get('/navbar', (req, res) => {
    res.render('templates/partials/navbar.ejs')
})



app.get('/booking', (req, res) => {
    res.render('booking.ejs')
})

app.listen(3000, () => {
    console.log("Listening on port 3000!");
})