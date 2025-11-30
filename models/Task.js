const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Task = sequelize.define('Task', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  dueDate: { type: DataTypes.DATE },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  userId: { type: DataTypes.STRING, allowNull: false } 
}, {
  tableName: 'Tasks'
});

module.exports = Task;
