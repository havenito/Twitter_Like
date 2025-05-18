import Sidebar from "@/components/Main/Sidebar/Sidebar";

export default function HomeLayout2 ({ children }) {
  return (
    <>
      {/* Sidebar */}
      <Sidebar />
      
      {/* Central area for content with left margin to compensate for fixed sidebar */}
      <div className="ml-64 w-full"> 
        <section className="flex-1 flex flex-col items-center justify-center p-10">
          <div className="w-full max-w-4xl">
            {children}
          </div>
        </section>
      </div>
    </>
  );
}