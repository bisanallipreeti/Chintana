import { AppError } from "../core/errors/AppError.js";

export function validate(schema, source = "body") {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        path: detail.path.join("."),
        message: detail.message,
      }));

      return next(AppError.badRequest("Validation failed.", details));
    }

    if (source === "body") {
      req.body = value;
      return next();
    }

    const target = req[source];
    if (target && typeof target === "object") {
      Object.keys(target).forEach((key) => {
        delete target[key];
      });
      Object.assign(target, value);
    }

    return next();
  };
}
