const express = require('express')
const app = express();
app.use(express.json());

require('dotenv').config();

//neon-psql connection
const { Pool } =  require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

app.post("/signup", async (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    console.log("INSERT INTO users (username, email, password) VALUES ('${username}', '${email}', '${password}')")

    // prone to SQL injection attacks like  `INSERT INTO users (username, email, password) VALUES ('${username}', '${email}', '${password}') RETURNING id DELETE FROM users`
    // const response = await pool.query(`INSERT INTO users (username, email, password) VALUES ('${username}', '${email}', '${password}') RETURNING id;`)

    const response = await pool.query(`INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id;`, [username, email,password])
    console.log(response);

    res.json({
        message: "signup done",
        id: response.rows[0].id
    })
})

app.post("/signin", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const response = await pool.query(`SELECT * FROM users WHERE email='${email}' AND password='${password}'`);
    console.log("SELECT * FROM users WHERE email='${email}' AND password='${password}'");

    const userExists = response.rows[0];

    if(!userExists){
        return res.status(403).json({
            message: "Incorrect creds"
        })
    }
    else{
        res.json({
            id: response.rows[0].id
        })
    }
    
})

app.listen(3000);