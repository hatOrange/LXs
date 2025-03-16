import jwt from "jsonwebtoken";

export async function getUser(req, res, next) {
  try {
    const verify = req.header("verify"); // Optional token verification request
    const authToken = req.cookies.authToken;
    const otpToken = req.cookies.otpToken;

    if (!authToken && !otpToken) {
      return res.status(401).json({ msg: "Authentication required", success: false });
    }

    let tokenType = "unknown";
    let data;

    // Try verifying authToken first
    if (authToken) {
      try {
        data = jwt.verify(authToken, process.env.sec_key);
        tokenType = data.type; // Expecting "auth"
      } catch (err) {
        return res.status(403).json({ msg: "Invalid Auth Token", success: false });
      }
    }

    // If no authToken, check otpToken
    if (!data && otpToken) {
      try {
        data = jwt.verify(otpToken, process.env.sec_key);
        tokenType = data.type; // Expecting "otp"
      } catch (err) {
        return res.status(403).json({ msg: "Invalid OTP Token", success: false });
      }
    }

    if (!data) {
      return res.status(403).json({ msg: "Invalid Token", success: false });
    }

    // If only verifying token validity
    if (verify) {
      return res.status(200).json({ msg: "Token is valid", success: true, tokenType });
    }

    // Attach user data based on token type
    req.uid = data.id;
    req.email = data.email;
    req.type = data.type;
    req.body.email = data.email;
    req.tokenType = tokenType;

    next(); // Proceed to next middleware

  } catch (e) {
    return res.status(500).json({ msg: e.message, success: false });
  }
}
