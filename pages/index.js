import SignIn from "../pages/signin"; // This imports the sign-in page from the 'pages' directory

export default function Home() {
  return (
    <div className="flex justify-center items-center h-screen">
      <SignIn />
    </div>
  );
}
