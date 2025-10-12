export const config = {
    env: process.env.NODE_ENV,
    port: Number(process.env.PORT),
    db: {
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        port: Number(process.env.PGPORT)
    },
    JWT_SECRET:process.env.JWT_SECRET,
    JWT_REFRESH_SECRET:process.env.JWT_REFRESH_SECRET
}

