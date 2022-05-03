import jwt from "jsonwebtoken";

export const generateJwtToken = (user: any) => {
  const jwtSecretKey: any = process.env.WEDDING_VENUES_APP_SECRET_KEY;

  const token = jwt.sign(
    {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      email: user.email,
      customer_id: user.customer_id,
      isSubscribed: user.isSubscribed,
      customer_email: user.customer_email,
    },
    jwtSecretKey
  );

  return token;
};
