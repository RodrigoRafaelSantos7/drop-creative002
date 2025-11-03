"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const SignOutButton = () => {
  const { handleSignOut } = useAuth();

  return <Button onClick={handleSignOut}>Sign Out</Button>;
};

export { SignOutButton };
