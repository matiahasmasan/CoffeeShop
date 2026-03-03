import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Settings() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <div className="flex-1 overflow-y-auto px-5 py-8 max-w-5xl mx-auto w-full">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
          <p className="text-gray-500">Settings page coming soon...</p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
