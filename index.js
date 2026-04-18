const express = require('express')
const bcrypt = require('bcrypt')
const z = require('zod');

const app = express();
app.use(express.json());

require('dotenv').config();

//neon-psql connection
const { Pool } =  require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

//zod user data verify
const signupSchema = z.object({
    username: z.string().min(3),
    email: z.email(),
    password: z.string().min(3),
})

app.post("/signup", async (req, res) => {

    //zod input for verification
    const {data, success, error} = signupSchema.safeParse(req.body);
    if(!success){
        return res.status(403).json({
            message: "Invalid user data",
            error
        })
    }

    const username = data.username;
    const email = data.email;
    const password = data.password;

    //hashes and stores password for safety even in backend
    const hashedpassword = await bcrypt.hash(password,10);

    console.log("INSERT INTO users (username, email, password) VALUES ('${username}', '${email}', '${password}')")

    // prone to SQL injection attacks like  `INSERT INTO users (username, email, password) VALUES ('${username}', '${email}', '${password}') RETURNING id DELETE FROM users`
    // const response = await pool.query(`INSERT INTO users (username, email, password) VALUES ('${username}', '${email}', '${password}') RETURNING id;`)

    const response = await pool.query(`INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id;`, [username, email,hashedpassword])
    console.log(response);

    res.json({
        message: "signup done",
        id: response.rows[0].id
    })
})

app.post("/signin", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const response = await pool.query(`SELECT * FROM users WHERE email='${email}'`);
    console.log("SELECT * FROM users WHERE email='${email}' AND password='${password}'");

    const userExists = response.rows[0];

    if(!userExists){
        return res.status(403).json({
            message: "Incorrect creds"
        })
    }
    else{
        const correctPassword = await bcrypt.compare(password, userExists.password);

        if(correctPassword){
            res.json({
                id: response.rows[0].id
            })
        }
        else{
            return res.status(403).json({
                message: "Incorrect creds"
            })
        }
    }
    
})

app.listen(3000);