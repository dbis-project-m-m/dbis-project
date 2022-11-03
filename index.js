import express from "express";
import mysql from "mysql";
import path from 'path';
const app = express();
const __dirname = path.resolve(path.dirname(''));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set('/', path.join(__dirname, '/views'));


const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "airport-dbms-trial"
})

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log("db connected")
})

app.get('/', (req, res) => {
    res.render('home.ejs');
})
app.get('/home', (req, res) => {
    res.render('home.ejs');
})

app.get('/sign_in', (req, res) => {
    res.render('sign_in.ejs', { validity: !null })
})
app.get('/index', (req, res) => {
    res.render('index.ejs')
})
app.get('/amenities', (req, res) => {
    res.render('amenities.ejs')
})
app.get('/find_flight', (req, res) => {
    res.render('find_flight.ejs', { results: [] })
})
app.get('/booking/:flight_id', (req, res) => {

    let { flight_id } = req.params;
    console.log(flight_id)



    res.render('booking.ejs')
})

app.get('/bookticket', (req, res) => {
    let data = {
        name: req.query.name,
        email: req.query.email,
        mobile_no: req.query.mobile_no,
        aadhar_no: req.query.aadhar_no
    }

    let sql2 = `select aadhar_no from passengers`
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
                db.query(sql1, (err, result) => {
                    if (err) console.log(err)
                    console.log(data.name)
                    res.render('booking.ejs')
                })
            }
            else {
                res.render('booking.ejs')
            }
        }

    })


})


app.get('/output', (req, res) => {
    let input = {
        to: req.query.to,
        from: req.query.from,
        date: req.query.date
    }

    let sql = `select f.flight_id, f.airline, r.from_route, r.to_route, af.arrival_time, af.duration 
    from flight as f join arrival_flights as af on f.flight_id=af.flight_id join route as r on r.route_id=af.route_id
    where r.from_route='${input.from}' and r.to_route='${input.to}' and date(af.arrival_time)='${input.date}'`
    db.query(sql, (err, results) => {
        if (err) console.log(err)

        res.render('flight_output.ejs', { results })

    })

})
app.get('/my_account', (req, res) => {
    res.render('my_account.ejs')
})
app.get('/navbar', (req, res) => {
    res.render('templates/partials/navbar.ejs')
})

app.get('/search', (req, res) => {
    var email = req.query.email
    var password = req.query.password
    let sql = `select * from login where email='${email}'`

    let prompty = {
        validity: null
    };

    db.query(sql, (err, result) => {
        if (err) console.log(err)

        console.log(password)
        console.log(result.password)
        if (result.length == 0) {
            res.render('sign_in.ejs', { validity: null });
            // prompt("useremail does not exist")
        }
        else if (result[0].password == password) {
            res.render('home.ejs', { result })
        }
        else {
            res.render('sign_in.ejs', { validity: null })
            // prompt("invali password")
        }

    })
})

app.listen(3000, () => {
    console.log("Listening on port 3000!");
})