
const mysql = require('mysql')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { promisify } = require('util')

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST, // Lokal host istället för en riktig
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
})

exports.login = async (req, res) => { // Används för att vänta på vissa "actions"
    try {
        const {email, password} = req.body;

        if( !email || !password ) {
            return res.status(400).render('login', {
                message: 'Please provide an email and password'
            })
        }

        db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {

            console.log(results)

            if( !results || !(await bcrypt.compare(password, results[0].password))) { /*Använder bcrypt compare här för att
            jämföra lösenord som någon skriver in vs i databasen */
            res.status(401).render('login', {
                message: 'The email or password is incorrect'
            })
        } else {
            const id = results[0].id;


            // Cookie token -> Allt innehåll för att skapa en cookie
            const token = jwt.sign({ id:id }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN
            });

            console.log("The token is: " + token);

            const cookieOptions = {
                expires: new Date(
                    Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                ),
                httpOnly: true // Denna gör att cookie bara fungerar på http, skyddar mot hacking
            }


            res.cookie('jwt', token, cookieOptions); // Cookie namn
            res.status(200).redirect("/"); // Om pass och email är correct skickas man till main

        }


        })
    }

        catch (error) {
        console.log(error);
    }
}

exports.register = (req, res) => {
    console.log(req.body); // Grabbing all the data from the form



    const { name, email, password, passwordConfirm } = req.body;

    db.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) => { // Även lagt in en async här så att man kan använda await här nere
        if(error) {
            console.log(error);
        }
        if(results.length > 0) {
            return res.render('register', {
                message: 'That email is already in use'
            })
        } else if( password !== passwordConfirm ){
            return res.render('register', {
                message: 'Passwords do not match'
            });

        }
        let hashedPassword = await bcrypt.hash(password, 8); // 8 rounds räknas som säkert
        console.log(hashedPassword)

        db.query('INSERT INTO users SET ?', {name: name, email: email, password: hashedPassword},(error, results) => {
            if(error) {
                console.log(error)

            } else {
                console.log(results);
                return res.render('register', {
                    message: 'User registered'
                })
            }
        })
    });

    //res.send("Form submitted"); Är denna kvar kommer register med random fungera


}


exports.isLoggedIn = async (req, res, next) => {
       console.log(req.cookies);
    /* Kollar om vi har cookies som läggs till när man loggar in - console.log
    här skriver ut token */

    if(req.cookies.jwt) {
        try {
            //1 verify token - Inte min comment
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);


            console.log(decoded)

            //2 Kollar om user fortfarande finns - Inte min comment
            db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (error, result) => {
                console.log(result);

            if(!result) {
                return next();
            }

            req.user = result[0];
            return next();


            });
             /* Det är decoded vi använder här -
             Om man kollar log kan man se id - ? ska alltså replacas med decoded.id */
        } catch (error) {
            console.log(error)
            return next();
        }
    } else {
        next();

        // Utan next stoppas funktionen
    /*Denna funktion kollar om man är
    inloggad eller inte -> används även i pages.js */
    }
}
    // Skulle next ligga utanför en else kommer ingen kunna använda profile

    exports.logout = async (req, res) => {
        res.cookie('jwt', 'logout', { // Overwrites nuvarande cookie
            expires: new Date(Date.now() + 3*1000), // Cookie går ut om 3 sekunder
            httpOnly: true
        });
        res.status(200).redirect('/'); // Efter 3 sekunder kommer man till main
}

