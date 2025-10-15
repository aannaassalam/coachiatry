import assets from "@/json/assets";
import Image from "next/image";

export default function CoachAi() {
  return (
    <div className="flex flex-col w-[400px] h-[600px] mx-auto rounded-2xl shadow-lg border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0b1936] to-[#132a55] text-white p-6">
        <Image
          src={assets.coachAiBackground}
          width={527}
          height={348}
          alt="background"
        />
        <h1 className="text-2xl font-semibold">Hello</h1>
        <p className="text-lg mt-1 opacity-90">How can I help you</p>
      </div>

      {/* Body */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-[#0b1936] flex items-center justify-center text-white">
            <span className="text-lg">⚡</span>
          </div>
          <div>
            <p className="text-gray-700 font-medium mb-1">
              Welcome back! Feel free to ask me anything. How can I help?
            </p>

            {/* Suggested actions */}
            <p className="text-sm text-gray-500 font-semibold mb-2">
              Suggested
            </p>
            <div className="flex flex-col gap-2">
              <button className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition text-gray-700 text-sm font-medium">
                ⚙️ Generate a Task
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition text-gray-700 text-sm font-medium">
                ⚡ Create a doc
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition text-gray-700 text-sm font-medium">
                🔥 Find task assigned to me
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Input */}
      <div className="border-t bg-white p-3 flex items-center gap-2">
        <button className="text-gray-500 hover:text-gray-700">🌐</button>
        <button className="text-gray-500 hover:text-gray-700">📎</button>
        <input
          type="text"
          placeholder="Ask anything..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button className="text-gray-500 hover:text-gray-700">🎤</button>
        <button className="text-blue-600 hover:text-blue-800 text-xl">↑</button>
      </div>
    </div>
  );
}
