const express = require('express')
const mysql = require('mysql')
const dotenv = require('dotenv')
const path = require('path')
const cookieParser = require('cookie-parser');


dotenv.config({ path: './.env' }) //Hanterar säkerheten med lösenord

const app = express()

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST, // Lokal host istället för en riktig
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
})

const publicDirectory = path.join(__dirname, './public')
app.use(express.static(publicDirectory))
app.use(express.urlencoded({ extended: false})) // Behövs för register
app.use(express.json());
app.use(cookieParser());

console.log(__dirname) //Visar vart man är i konsollen, alltså vilken folder

app.set('view engine', 'hbs')

db.connect((error) => {
    if (error) {
        console.log(error)
    } else {
        console.log('MYSQL Connected...')
    }
})

/*app.get('/', (req, res) => {
    //res.send('<h1>Home Page</h1>')
    res.render('index')
})

app.get('/register', (req, res) => {
    //res.send('<h1>Home Page</h1>')
    res.render('register')
}) */

app.use('/', require('./routes/pages'))
app.use('/auth', require('./routes/auth')) /* Denna här till den som ligger i register
alltså form action */


app.listen(5000, () => {
    console.log('Server started on Port 5000')
})
