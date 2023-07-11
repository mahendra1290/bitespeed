import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from './db';

class Contact extends Model<
  InferAttributes<Contact>,
  InferCreationAttributes<Contact>
> {
  declare id: CreationOptional<number>;
  declare email: string | null;
  declare phoneNumber: string | null;
  declare linkedId: number | null;
  declare linkPrecedence: 'primary' | 'secondary';
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Contact.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    linkedId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    linkPrecedence: {
      type: DataTypes.ENUM('primary', 'secondary'),
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Contact',
  }
);

export default Contact;
