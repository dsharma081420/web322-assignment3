const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.PG_DATABASE,
  process.env.PG_USER,
  process.env.PG_PASSWORD,
  {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  }
);

// Test connection
sequelize.authenticate()
  .then(() => console.log("PostgreSQL Connected (Sequelize)"))
  .catch(err => console.error("PostgreSQL Connection Error:", err));

module.exports = { sequelize, Sequelize };
