import Header from "@/components/Header";
import BrandingLoader from "@/components/BrandingLoader";

const AdminLoader = () => {
  return (
    <>
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-16">
        <BrandingLoader message="Verifying admin access..." />
      </div>
    </>
  );
};

export default AdminLoader;
