import { usePathname } from "next/navigation";
import React from "react";

const Header = () => {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/") {
    return null;
  }
  return <div>Header</div>;
};

export default Header;
