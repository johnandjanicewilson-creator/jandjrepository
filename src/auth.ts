import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.password !== "string"
        ) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();

        for (const name of ["JOHN", "JANICE"]) {
          const savedEmail = process.env[`DASHBOARD_${name}_EMAIL`]?.trim().toLowerCase();
          const savedHash = process.env[`DASHBOARD_${name}_HASH`]?.trim();

          if (savedEmail !== email || !savedHash) continue;

          const matches = await bcrypt.compare(credentials.password, savedHash);
          if (matches) {
            return { id: name.toLowerCase(), name, email };
          }
        }

        return null;
      },
    }),
  ],
});
