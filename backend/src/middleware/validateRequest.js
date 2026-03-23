const { validationResult } = require("express-validator");

function validateRequest(validations) {
  return async (req, res, next) => {
    // validations are already applied as middleware before this function runs
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ success: false, error: result.array() });
    }
    next();
  };
}

module.exports = { validateRequest };

