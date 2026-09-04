const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        port: process.env.DB_PORT || 5432,
        logging: false,
        timezone: '-06:00'
    }
);

async function check() {
    try {
        await sequelize.authenticate();
        console.log('Connection OK.');
        const [results] = await sequelize.query('SELECT * FROM cat_dias ORDER BY id_cat_dia ASC');
        console.log('CatDias:', JSON.stringify(results, null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sequelize.close();
    }
}

check();
