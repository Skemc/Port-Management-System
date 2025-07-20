import jwt from 'jsonwebtoken';

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      username: user.username
    },
    process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    {
      expiresIn: '7d'
    }
  );
};

export default generateToken;
