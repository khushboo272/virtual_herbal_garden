import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env';
import User from '../models/User';
import { UserRole, JwtPayload } from '../types';

// ── JWT Strategy (RS256) ──
const jwtOptions: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n'),
  algorithms: ['RS256'],
};

passport.use(
  'jwt',
  new JwtStrategy(jwtOptions, async (payload: JwtPayload, done) => {
    try {
      const user = await User.findById(payload.sub).select('_id email role isActive').lean();
      if (!user || !user.isActive) {
        return done(null, false);
      }
      const jwtPayload: JwtPayload = {
        sub: user._id.toString(),
        email: user.email,
        role: user.role as UserRole,
      };
      return done(null, jwtPayload);
    } catch (err) {
      return done(err, false);
    }
  }),
);

// ── Google OAuth2 Strategy ──
passport.use(
  'google',
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Google profile'), undefined);
        }

        let user = await User.findOne({ email });

        if (user) {
          // Update existing user's OAuth account if not already linked
          const hasGoogleAccount = user.oauthAccounts.some(
            (acc) => acc.provider === 'google' && acc.providerUserId === profile.id,
          );
          if (!hasGoogleAccount) {
            user.oauthAccounts.push({
              provider: 'google',
              providerUserId: profile.id,
              accessToken: '', // Will be encrypted if stored
            });
            user.isEmailVerified = true;
            await user.save();
          }
        } else {
          // Create new user from Google profile
          user = await User.create({
            email,
            displayName: profile.displayName || email.split('@')[0],
            avatarUrl: profile.photos?.[0]?.value || null,
            role: UserRole.USER,
            isEmailVerified: true,
            isActive: true,
            oauthAccounts: [
              {
                provider: 'google',
                providerUserId: profile.id,
                accessToken: '',
              },
            ],
          });
        }

        const jwtPayload: JwtPayload = {
          sub: user._id.toString(),
          email: user.email,
          role: user.role as UserRole,
        };

        return done(null, jwtPayload);
      } catch (err) {
        return done(err as Error, undefined);
      }
    },
  ),
);

export default passport;
