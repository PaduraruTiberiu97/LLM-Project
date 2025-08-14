import ChatWindow from "@/components/ChatWindow";
export default function Home(){
  return (
    <div className="p-6">
      <div className="mb-3 text-slate-500 text-sm">Tip: click <b>New chat</b> in the left sidebar to persist your conversation.</div>
      <ChatWindow />
    </div>
  );
}