import db from '../config/db.js';
const { pool, initDB } = db; 

const addUser = async(data) =>{
    const { name, hostname, ip_address, department } = data;
    const result = await pool.query(
      `INSERT INTO users (name, hostname, ip_address, department)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, hostname, ip_address, department]
    );
    return result.rows[0];
}

export const getAllUsers = async () => {
  const result = await pool.query("SELECT * FROM users");
  return result.rows;
};

export default { addUser, getAllUsers };