import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';

const host = process.env.MYSQL_HOST || 'sql.infinityfree.com';
const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
const database = process.env.MYSQL_DATABASE || 'if0_XXXXXXXX_votesphere';
const username = process.env.MYSQL_USER || 'if0_XXXXXXXX';
const password = process.env.MYSQL_PASSWORD || 'your_password';

let sequelize;

if (process.env.NODE_ENV === 'production') {
  sequelize = new Sequelize(database, username, password, {
    host,
    port,
    dialect: 'mysql',
    dialectModule: mysql2,
    dialectOptions: {
      connectTimeout: 20000,
      decimalNumbers: true,
    },
    pool: {
      max: 5,
      min: 0,
      idle: 10000,
      acquire: 30000,
    },
    logging: false,
    define: {
      timestamps: true,
      underscored: false,
    },
  });
} else {
  // Prevent multiple Sequelize instances in development hot-reloads
  if (!global.sequelizeInstance) {
    global.sequelizeInstance = new Sequelize(database, username, password, {
      host,
      port,
      dialect: 'mysql',
      dialectModule: mysql2,
      dialectOptions: {
        connectTimeout: 20000,
        decimalNumbers: true,
      },
      pool: {
        max: 5,
        min: 0,
        idle: 10000,
        acquire: 30000,
      },
      logging:
        process.env.NODE_ENV === 'development'
          ? // eslint-disable-next-line no-console
            (msg) => console.log(`[Sequelize] ${msg}`)
          : false,
      define: {
        timestamps: true,
        underscored: false,
      },
    });
  }
  sequelize = global.sequelizeInstance;
}

export default sequelize;
export { sequelize };
