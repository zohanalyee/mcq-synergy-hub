
import Header from "@/components/Header";

const AdminLoader = () => {
  return (
    <>
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-16 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    </>
  );
};

export default AdminLoader;
