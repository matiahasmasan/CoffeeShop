import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // For now, just redirect to home
    navigate("/home");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-500 via-purple-500 to-purple-700 px-4">
      <div className="bg-white rounded-lg p-10 w-full max-w-md shadow-2xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-5 bg-linear-to-br from-indigo-500 to-purple-700 rounded-lg flex items-center justify-center">
            <span className="text-2xl font-bold text-white">CS</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CoffeeShop</h1>
          <p className="text-sm text-gray-500">Coffee, curated for you</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 mb-6">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-800"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="px-4 py-3 border border-gray-200 rounded-lg text-sm transition-all focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 placeholder-gray-400"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-800"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="px-4 py-3 border border-gray-200 rounded-lg text-sm transition-all focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 placeholder-gray-400"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 bg-linear-to-r from-indigo-500 to-purple-700 text-white rounded-lg font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            Log in
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <a
            href="#signup"
            className="text-indigo-500 font-semibold hover:text-purple-700 transition-colors"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
