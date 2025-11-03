import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import { logger } from "@/lib/logger";
import { dashboardPath, signInPath } from "@/paths";

const log = logger.child({ module: "SignInForm" });

const PASSWORD_MIN_LENGTH = 6;
const MAX_NAME_LENGTH = 32;
const NAME_MIN_LENGTH = 3;

const signInSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z
    .string()
    .min(
      PASSWORD_MIN_LENGTH,
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`
    ),
});

const signUpSchema = z
  .object({
    name: z
      .string()
      .min(
        NAME_MIN_LENGTH,
        `Your name must be at least ${NAME_MIN_LENGTH} characters long`
      )
      .max(
        MAX_NAME_LENGTH,
        `Your name must be less than ${MAX_NAME_LENGTH} characters long`
      ),
    email: z.email("Please enter a valid email address"),
    password: z
      .string()
      .min(
        PASSWORD_MIN_LENGTH,
        `Your password must be at least ${PASSWORD_MIN_LENGTH} characters long`
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "The passwords you entered do not match",
  });

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

export const useAuth = () => {
  const { signIn, signUp, signOut } = authClient;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const signInForm = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onChange: signInSchema,
      onSubmit: signInSchema,
    },
    onSubmit: async (data) => {
      await handleSignIn(data.value);
    },
  });

  const signUpForm = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validators: {
      onChange: signUpSchema,
      onSubmit: signUpSchema,
    },
    onSubmit: async (data) => {
      await handleSignUp(data.value);
    },
  });

  const handleSignIn = async (data: SignInFormData) => {
    setIsLoading(true);
    try {
      await signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: dashboardPath(),
        fetchOptions: {
          onSuccess: () => {
            log.info("Signed in successfully");
            toast.success("Signed in successfully", {
              description:
                "You will be redirected to the dashboard in a moment...",
            });
            router.push(dashboardPath());
          },
          onError: (error) => {
            log.error(error.error);
            toast.error("Failed to sign in", {
              description: error.error.message,
            });
          },
        },
      });
    } catch (error) {
      log.error(error);
      toast.error("Failed to sign in", {
        description:
          "Please try again... If the problem persists, contact support.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      await signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
        callbackURL: dashboardPath(),
        fetchOptions: {
          onSuccess: () => {
            log.info("Signed up successfully");
            toast.success("Signed up successfully", {
              description:
                "You will be redirected to the dashboard in a moment...",
            });
            router.push(dashboardPath());
          },
          onError: (error) => {
            log.error(error.error);
            toast.error("Failed to sign up", {
              description: error.error.message,
            });
          },
        },
      });
    } catch (error) {
      log.error(error);
      toast.error("Failed to sign up", {
        description:
          "Please try again... If the problem persists, contact support.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: dashboardPath(),
        errorCallbackURL: signInPath(),
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed in with Google successfully", {
              description:
                "You will be redirected to the dashboard in a moment...",
            });
          },
          onError: (error) => {
            log.error(error.error);
            toast.error("Failed to sign in with Google", {
              description: error.error.message,
            });
          },
        },
      });
    } catch (error) {
      log.error(error);
      toast.error("Failed to sign in with Google", {
        description:
          "Please try again... If the problem persists, contact support.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed out successfully", {
              description:
                "You will be redirected to the sign in page in a moment...",
            });
            router.push(signInPath());
          },
          onError: (error) => {
            log.error(error.error);
            router.push(signInPath());
          },
        },
      });
    } catch (error) {
      log.error(error);
      toast.error("Failed to sign out");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signInForm,
    signUpForm,
    handleSignIn,
    handleSignUp,
    handleSignOut,
    handleSignInWithGoogle,
    isLoading,
  };
};
