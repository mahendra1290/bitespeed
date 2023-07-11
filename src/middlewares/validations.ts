import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import Joi from 'joi';

const identitySchema = Joi.object({
  email: Joi.string().email().allow(null),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]+$/)
    .allow(null),
})
  .or('email', 'phoneNumber')
  .custom((value, helpers) => {
    const { email, phoneNumber } = value;
    if (email === null && phoneNumber === null) {
      return helpers.error('any.invalid');
    }
    return value;
  });

const validateRequestBody = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await identitySchema.validateAsync(req.body);
    return next();
  } catch (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Validation failed',
      errors: error,
    });
  }
};

export default validateRequestBody;
