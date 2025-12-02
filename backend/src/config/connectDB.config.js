import { Pool } from "pg"
import {config} from "./env.config.js"


export const dataBase = new Pool({
    host:config.db.host,
    user:config.db.user,
    password:config.db.password,
    database:config.db.database,
    port:config.db.port,
    ssl: {
        rejectUnauthorized: false 
    }
})

