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
    database: "dbis"
})

// app.get("/", (req, res)=>{

// })

app.get("/", (req, res) => {
    db.query("SELECT * FROM users", (err, results) => {
        if (err) console.log(err);
        else {
            console.log(results);
            res.render("index.ejs", { results });
        }
    })
})

app.listen(3000, () => {
    console.log("Listening on port 3000!");
})