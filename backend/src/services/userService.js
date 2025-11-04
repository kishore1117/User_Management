import pool from "../config/db.js";

const addUser = async(data) =>{
    const { name, hostname, ip_address, department } = data;
    const result = await pool.query(
      `INSERT INTO users (name, hostname, ip_address, department)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, hostname, ip_address, department]
    );
    return result.rows[0];
}

export default { addUser };