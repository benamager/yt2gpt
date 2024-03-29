import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import refreshTokens from "@utils/refreshTokens";

import User from "@models/user";
import { connectToDB } from "@utils/database";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        async session({ session }) {
            // store the user id from MongoDB to session
            const sessionUser = await User.findOne({ email: session.user.email });
            session.user.id = sessionUser._id.toString();
            session.user.tokens = sessionUser.tokens;
            session.user.tokensRefill = sessionUser.tokensRefill;

            return session;
        },
        async signIn({ account, profile, user, credentials }) {
            try {
                await connectToDB();

                // check if user already exists
                const user = await User.findOne({ email: profile.email });

                // if not, create a new document and save user in MongoDB
                if (!user) {
                    let username = profile.name.replace(" ", "").toLowerCase();

                    // if username is shorter than 8 characters, pad it with "user".
                    if (username.length < 8) {
                        username = username.padEnd(8, "_user");
                    }

                    // if username is longer than 20 characters, truncate it.
                    if (username.length > 20) {
                        username = username.substring(0, 20);
                    }

                    await User.create({
                        email: profile.email,
                        username: username,
                        image: profile.picture,
                        tokens: process.env.START_TOKEN_AMOUNT, // .env to select starting token amount
                        tokensRefill: new Date(new Date().valueOf() + 1000 * 60 * 60 * 24), // 24 hours from now
                        createdAt: new Date(),
                    });
                }

                // if user exists, maybe refresh their tokens
                if (user) {
                    await refreshTokens(user);
                }

                return true;
            } catch (error) {
                console.log(error.message);
                return false;
            }
        },
        redirect: async ({ url, baseUrl }) => {
            return baseUrl; // redirect to homepage after succesfull login
        },
    },
});

export { handler as GET, handler as POST };
