import SignIn from "../components/SignIn"; // Ensure the path matches the file name and case

export default function Home() {
  return (
    <div className="flex justify-center items-center h-screen">
      <SignIn />
    </div>
  );
}
