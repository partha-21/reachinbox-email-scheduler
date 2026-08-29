import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'reachinbox_super_secret_jwt_key_2026';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const googleClientId = process.env.GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret';
const googleCallbackUrl =
  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

passport.use(
  new GoogleStrategy(
    {
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: googleCallbackUrl,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName || profile.name?.givenName || 'User';
        const avatar = profile.photos?.[0]?.value || null;

        if (!email) {
          return done(new Error('No email address provided by Google profile'), undefined);
        }

        let user = await prisma.user.findFirst({
          where: {
            OR: [{ googleId }, { email }],
          },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              googleId,
              email,
              name,
              avatar,
            },
          });
        } else if (!user.googleId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId, name, avatar },
          });
        }

        return done(null, user);
      } catch (error: any) {
        return done(error, undefined);
      }
    }
  )
);

export class AuthController {
  static generateToken(user: { id: string; email: string; name?: string | null; avatar?: string | null }) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  static initiateGoogleAuth(req: Request, res: Response, next: NextFunction) {
    if (
      !googleClientId ||
      googleClientId.includes('your-google-client-id') ||
      !googleClientSecret ||
      googleClientSecret.includes('your-google-client-secret')
    ) {
      return res.redirect(`${FRONTEND_URL}/login?error=google_not_configured`);
    }

    return passport.authenticate('google', {
      scope: ['openid', 'email', 'profile'],
      prompt: 'select_account',
    })(req, res, next);
  }

  static googleCallback(req: Request, res: Response, next: NextFunction) {
    passport.authenticate('google', { session: false }, (err: any, user: any) => {
      if (err || !user) {
        return res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
      }

      const token = AuthController.generateToken(user);

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
    })(req, res, next);
  }

  static async getMe(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Session invalid.' });
    }

    const userWithSlack = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        slackConnection: {
          select: {
            id: true,
            teamName: true,
            slackUserId: true,
            createdAt: true,
          },
        },
      },
    });

    return res.json({
      user: userWithSlack,
    });
  }

  static async logout(req: Request, res: Response) {
    res.clearCookie('token');
    return res.json({ message: 'Logged out successfully' });
  }
}
