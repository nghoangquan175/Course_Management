import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Op } from 'sequelize';
import User from '../models/User';
import RefreshToken from '../models/RefreshToken';
import { sendActivationEmail, sendResetPasswordEmail } from '../services/mailService';

// Helpers
const generateToken = (payload: any, secret: string, expiresIn: any) => {
  return jwt.sign(payload, secret, { expiresIn });
};

const storeRefreshToken = async (userId: string, token: string) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7); // 7 days

  await RefreshToken.create({
    userId,
    token,
    expiryDate,
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });

    // If email exists and is already activated, prevent re-registration
    if (existingUser && existingUser.isActivated) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (existingUser && !existingUser.isActivated) {
      // If email exists but is NOT activated, update info and resend token
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.activationToken = activationToken;
      existingUser.activationExpires = activationExpires;
      await existingUser.save();
    } else {
      // If new email, create new user
      await User.create({
        name,
        email,
        password: hashedPassword,
        activationToken,
        activationExpires,
      });
    }

    try {
      await sendActivationEmail(email, activationToken);
    } catch (mailError) {
      console.error('Failed to send activation email:', mailError);
      return res.status(500).json({
        message:
          'Account created/updated but failed to send activation email. Please try again later or contact support.',
      });
    }

    res.status(201).json({
      message: 'Registration successful! Please check your email to activate your account.',
    });
  } catch (error) {
    next(error);
  }
};

export const activateAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ where: { activationToken: token } });

    if (!user)
      return res.status(400).json({ status: 'invalid', message: 'Invalid activation link' });
    if (user.isActivated)
      return res
        .status(200)
        .json({ status: 'already_active', message: 'Account already activated' });
    if (user.activationExpires && user.activationExpires < new Date())
      return res.status(400).json({ status: 'expired', message: 'Activation link has expired' });

    user.isActivated = true;
    user.activationToken = null;
    user.activationExpires = null;
    await user.save();

    res.status(200).json({ status: 'success', message: 'Account activated successfully!' });
  } catch (error) {
    next(error);
  }
};

const handleLogin = async (user: User, res: Response) => {
  const accessToken = generateToken(
    { id: user.id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET!,
    process.env.ACCESS_TOKEN_EXPIRE!
  );

  const refreshToken = generateToken(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET!,
    process.env.REFRESH_TOKEN_EXPIRE!
  );

  // Store RT in DB
  await storeRefreshToken(user.id, refreshToken);

  const isProduction = process.env.NODE_ENV === 'production';
  const useHTTPS = process.env.USE_HTTPS === 'true';

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction && useHTTPS,
    sameSite: useHTTPS ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
  });
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    // Check credentials first
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Role restriction: Admins cannot login here
    if (user.role === 'ADMIN') {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActivated) {
      return res.status(403).json({ message: 'Please activate your account first' });
    }

    await handleLogin(user, res);
  } catch (error) {
    next(error);
  }
};

export const adminLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Role restriction: Only Admins can login here
    if (user.role !== 'ADMIN') {
      return res
        .status(403)
        .json({ message: 'Access Denied. This portal is for Administrators only.' });
    }

    await handleLogin(user, res);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await RefreshToken.destroy({ where: { token: refreshToken } });
    }
    const isProduction = process.env.NODE_ENV === 'production';
    const useHTTPS = process.env.USE_HTTPS === 'true';

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction && useHTTPS,
      sameSite: useHTTPS ? 'none' : 'lax',
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token provided' });

    const tokenDoc = await RefreshToken.findOne({ where: { token: refreshToken } });
    if (!tokenDoc) return res.status(401).json({ message: 'Invalid refresh token' });

    if (tokenDoc.expiryDate < new Date()) {
      await RefreshToken.destroy({ where: { id: tokenDoc.id } });
      return res.status(401).json({ message: 'Refresh token expired' });
    }

    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as any;
    const user = await User.findByPk(payload.id);

    if (!user) return res.status(401).json({ message: 'User not found' });

    const newAccessToken = generateToken(
      { id: user.id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET!,
      process.env.ACCESS_TOKEN_EXPIRE!
    );

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'No account found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 1 * 60 * 60 * 1000);
    await user.save();

    await sendResetPasswordEmail(email, resetToken);
    res.status(200).json({ message: 'Reset link sent' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Find user by token first to distinguish between "not found" and "expired"
    const user = await User.findOne({
      where: { resetPasswordToken: token },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    // Check if token has expired
    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ message: 'Reset token has expired' });
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Revoke all refresh tokens for security upon password change
    await RefreshToken.destroy({ where: { userId: user.id } });

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.user?.id, {
      attributes: { exclude: ['password'] },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
