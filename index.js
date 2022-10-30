import express from "express";
import mysql from "mysql";
import path from 'path';
const app = express();
const __dirname = path.resolve(path.dirname(''));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set('/' ,path.join(__dirname, '/views'));


const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "airport-dbms-trial"
})

db.connect((err)=>{
    if(err){
        throw err;
    }
    console.log("kjcnrubdc")
})



app.get('/sign_in', (req, res)=>{
    res.render('sign_in.ejs')
})

app.get('/search', (req, res)=>{
    var email=req.query.email
    var password=req.query.password
    let sql=`select * from login where email='${email}'`

    db.query(sql, (err, result)=>{
        if(err) console.log(err)

        console.log(password)
        console.log(result.password)
        if(result.length==0)
        {
            res.render('sign_in.ejs')
            // prompt("useremail does not exist")
        }
        else if(result[0].password==password)
        {
            res.render('home.ejs', {result})
        }
        else
        {
            res.render('sign_in.ejs')
            // prompt("invali password")
        }

    })
})

app.listen(3000, () => {
    console.log("Listening on port 3000!");
})