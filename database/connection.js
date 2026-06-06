import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import kleur from 'kleur';
dotenv.config();


//La conexión se crea al instanciar Sequelize.
const db = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",/* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
    port: process.env.DB_PORT || 3306,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    logging: false,
  }
);

//Probar conexión una vez al inicio. La primera conexión real ocurre al usar authenticate() o hacer consultas.
//authenticate() intenta conectarse a la base de datos una vez para validar las credenciales. Si funciona, el pool de Sequelize queda inicializado.
(async () => {
  try {
    await db.authenticate();
    console.log(kleur.blue().bold('🔵 Conexión con la BD establecida con éxito'));
  } catch (err) {
    console.error(kleur.red().bold('💀 Error en la conexión de la bd: '), err);
  }
})();



//Manejo de cierre de la app
const cerrarConexion = async () => {
  try {
    console.log(kleur.yellow().bold("🟡 Cerrando conexiones con la BD..."));
    await db.close();
    console.log(kleur.green().bold("🖖🏻 Conexiones con la BD cerradas correctamente."));
    process.exit(0);
  } catch (err) {
    console.error(kleur.red().bold("☠️ Error al cerrar la BD:"), err);
    process.exit(1);
  }
};

process.on("SIGINT", cerrarConexion);   // Ctrl+C
process.on("SIGTERM", cerrarConexion);  // Terminar proceso
process.on("SIGQUIT", cerrarConexion);  // Salida de shell



export default db;


/*
El pool de conexiones es una característica muy útil que permite reutilizar las conexiones existentes en lugar de abrir y 
cerrar conexiones para cada consulta. Esto puede reducir significativamente la sobrecarga de tiempo y recursos tanto para 
tu aplicación como para la base de datos
*/