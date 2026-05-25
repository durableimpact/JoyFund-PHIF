import NextAuth, { CredentialsSignin } from "next-auth"
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsSignin({
  credentials: {
    email: {
      type: "email",
      label: "Email",
      placeholder: "johndoe@gmail.com",
    },
    password: {
      type: "password",
      label: "Password",
      placeholder: "*****",
    },
  },
})
  ],
})