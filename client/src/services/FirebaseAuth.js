const admin = require("../config/firebaseAdmin");

async function firebaseAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const token = authHeader.split("Bearer ")[1];

    const decodedToken =
      await admin.auth().verifyIdToken(token);

    req.firebaseUser = decodedToken;

    next();
  } catch (error) {
    console.error("Firebase authentication error:", error);

    return res.status(401).json({
      message: "Invalid or expired authentication token.",
    });
  }
}

module.exports = firebaseAuth;