import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLoginClick = async (e) =>{
    navigate("/login");
  }

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    if(password.length < 8){
        return alert("Parola trebuie sa aiba minim 8 caractere.");
    }
    try{
    const response = await fetch("http://localhost:8000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim()
         }),
    });
    const data = await response.json();

    if (response.ok && data.success) {
        navigate("/login");
      } else {
        alert(data.message || "A apărut o eroare la înregistrare.");
      }
    } 
    catch (err) {
      alert("Eroare de conexiune la server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-700 px-4 py-10">
      <div className="bg-white rounded-lg p-10 w-full max-w-md shadow-2xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-5 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-lg flex items-center justify-center">
            <span className="text-2xl font-bold text-white">CS</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CoffeeShop</h1>
          <p className="text-sm text-gray-500">Create your account</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5 mb-6">
          <div className="flex gap-4">
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <label htmlFor="lastName" className="text-sm font-medium text-gray-800">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                className="px-4 py-3 border border-gray-200 rounded-lg text-sm transition-all focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder-gray-400"
                required
              />
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <label htmlFor="firstName" className="text-sm font-medium text-gray-800">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="px-4 py-3 border border-gray-200 rounded-lg text-sm transition-all focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder-gray-400"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-800">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="px-4 py-3 border border-gray-200 rounded-lg text-sm transition-all focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder-gray-400"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="phone" className="text-sm font-medium text-gray-800">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 234 567 8900"
              className="px-4 py-3 border border-gray-200 rounded-lg text-sm transition-all focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder-gray-400"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-800">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="px-4 py-3 border border-gray-200 rounded-lg text-sm transition-all focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder-gray-400"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 bg-gradient-to-r from-indigo-500 to-purple-700 text-white rounded-lg font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <button
            onClick={handleLoginClick} 
            className="text-indigo-500 font-semibold hover:text-purple-700 transition-colors bg-transparent border-none p-0 cursor-pointer"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}