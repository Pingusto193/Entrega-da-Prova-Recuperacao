import { Pool } from 'pg'
const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'senai', // TROQUE pela senha do seu PostgreSQL
  database: 'teste2_prova',
  port: 5432
})
export default pool
