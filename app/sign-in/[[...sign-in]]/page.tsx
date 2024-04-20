import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen justify-center items-center bg-gradient-to-b from-slate-950 to-purple-950">
      <SignIn path="/sign-in" routing="path" />
    </div>
  );
}
