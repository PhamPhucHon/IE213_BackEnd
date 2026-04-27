const mongoose = require('mongoose');
const { body, query, param, validationResult } = require('express-validator');
const { validationErrorResponse } = require('../utils/apiResponse');

const formatErrors = (errors) => {
  return errors.map((err) => ({
    field: err.path || err.param,
    message: err.msg,
    location: err.location,
    value: err.value,
  }));
};

const handleValidationResult = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  return validationErrorResponse(
    res,
    formatErrors(result.array({ onlyFirstError: true })),
    'Dữ liệu không hợp lệ'
  );
};

/**
 * Tạo middleware validate từ express-validator chains.
 * @param {Array} chains - mảng validation chain
 */
const validate = (chains = []) => {
  return [...chains, handleValidationResult];
};

const validateBody = (chains = []) => validate(chains);
const validateQuery = (chains = []) => validate(chains);
const validateParams = (chains = []) => validate(chains);

/**
 * Validate nhanh các field bắt buộc bằng express-validator.
 */
const requireFields = (fields = [], source = 'body') => {
  const sourceBuilderMap = {
    body,
    query,
    params: param,
  };

  const sourceBuilder = sourceBuilderMap[source] || body;
  const chains = fields.map((field) =>
    sourceBuilder(field)
      .exists({ checkFalsy: true })
      .withMessage(`Thiếu dữ liệu: ${field}`)
      .bail()
      .notEmpty()
      .withMessage(`Thiếu dữ liệu: ${field}`)
  );

  return validate(chains);
};

/**
 * Kiểm tra ObjectId hợp lệ từ req.params bằng express-validator.
 */
const validateObjectId = (paramName = 'id') => {
  const chains = [
    param(paramName)
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage(`ID không hợp lệ: ${paramName}`),
  ];

  return validate(chains);
};

module.exports = {
  body,
  query,
  param,
  validate,
  validateBody,
  validateQuery,
  validateParams,
  requireFields,
  validateObjectId,
  handleValidationResult,
};
