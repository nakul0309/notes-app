const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) return next(result.error);
  Object.defineProperty(req, source, { value: result.data, writable: true, configurable: true });
  next();
};

module.exports = validate;
